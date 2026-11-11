#!/usr/bin/env node
/**
 * Preenche e valida os vídeos do YouTube das listas (src/data/songs.json).
 *
 * 1. Valida os IDs existentes com videos.list (1 unidade de cota a cada 50 vídeos):
 *    público, incorporável e sem bloqueio no Brasil. IDs inválidos são descartados.
 * 2. Para músicas sem vídeo, busca "artista música karaoke" (100 unidades por busca),
 *    pontua os resultados e grava o melhor.
 *
 * Uso: YT_API_KEY=... node scripts/resolve-videos.mjs [--dry-run]
 * Variáveis: MAX_SEARCHES (padrão 50), YT_REFERER (para chaves restritas por site).
 */
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SONGS_PATH = resolve(ROOT, 'src/data/songs.json');
const API = 'https://www.googleapis.com/youtube/v3';
const RETRY_EMPTY_AFTER_DAYS = 7;

const normalize = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[^a-z0-9& ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Converte duração ISO 8601 (PT4M13S) em segundos. */
export function parseDuration(iso) {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso ?? '');
  if (!m) return 0;
  const [, d = 0, h = 0, min = 0, s = 0] = m.map((v) => Number(v ?? 0));
  return d * 86400 + h * 3600 + min * 60 + s;
}

/** O vídeo pode ser tocado no site, no Brasil? */
export function isPlayable(video, region = 'BR') {
  const status = video?.status ?? {};
  if (status.privacyStatus !== 'public' || status.embeddable === false) return false;
  if (status.uploadStatus && status.uploadStatus !== 'processed') return false;
  const restriction = video?.contentDetails?.regionRestriction;
  if (restriction?.blocked?.includes(region)) return false;
  if (restriction?.allowed && !restriction.allowed.includes(region)) return false;
  return true;
}

/** Pontua um candidato: quanto maior, mais provável ser a versão karaokê da música certa. */
export function scoreCandidate(song, video) {
  const title = normalize(video.snippet?.title);
  const channel = normalize(video.snippet?.channelTitle);
  const songTitle = normalize(song.title.replace(/\(.*?\)/g, ''));
  const artistWords = normalize(song.artist).split(' ').filter((w) => w.length > 2 && w !== 'feat');
  let score = 0;

  if (/karaok|videok|instrumental with lyrics|sing along/.test(title)) score += 6;
  if (songTitle && title.includes(songTitle)) score += 5;
  if (artistWords.length && artistWords.some((w) => title.includes(w) || channel.includes(w))) score += 2;
  if (/karaok|videok|sing king|stingray|party tyme|karafun|zzang|singa/.test(channel)) score += 3;

  if (/\bcover\b/.test(title)) score -= 3;
  if (/reac(t|ao|ting)|tutorial|\baula\b|como cantar|lesson|piano|guitar|violao/.test(title)) score -= 6;
  if (/\b(live|ao vivo)\b/.test(title)) score -= 1;
  if (/#shorts?\b/.test(title)) score -= 8;

  const seconds = parseDuration(video.contentDetails?.duration);
  if (seconds >= 120 && seconds <= 600) score += 2;
  else if (seconds > 0 && seconds < 90) score -= 10;
  else if (seconds > 900) score -= 5;

  return score;
}

export function pickBest(song, videos, minScore = 8) {
  const ranked = videos
    .filter((v) => isPlayable(v))
    .map((v) => ({ video: v, score: scoreCandidate(song, v) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0] && ranked[0].score >= minScore ? ranked[0].video : null;
}

class QuotaError extends Error {}

function createClient({ key, referer, fetchImpl = fetch }) {
  let units = 0;
  async function call(endpoint, params, cost) {
    const url = `${API}/${endpoint}?${new URLSearchParams({ ...params, key })}`;
    const response = await fetchImpl(url, { headers: referer ? { Referer: referer } : {} });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const reasons = (data.error?.errors ?? []).map((e) => e.reason).join(',');
      if (/quota|rateLimit/i.test(reasons)) throw new QuotaError(`Cota esgotada (${reasons})`);
      throw new Error(`${endpoint}: HTTP ${response.status} ${data.error?.message ?? ''} ${reasons}`.trim());
    }
    units += cost;
    return data;
  }
  return {
    get units() {
      return units;
    },
    videos: (ids) =>
      call('videos', { part: 'status,contentDetails,snippet', id: ids.join(','), maxResults: '50' }, 1).then((d) => d.items ?? []),
    search: (q) =>
      call(
        'search',
        {
          part: 'snippet',
          type: 'video',
          q,
          maxResults: '8',
          regionCode: 'BR',
          videoEmbeddable: 'true',
          videoSyndicated: 'true',
        },
        100,
      ).then((d) => (d.items ?? []).map((i) => i.id?.videoId).filter(Boolean)),
  };
}

export async function run({ data, key, referer, maxSearches = 50, fetchImpl, log = console.log, today = new Date() }) {
  const client = createClient({ key, referer, fetchImpl });
  const stamp = today.toISOString().slice(0, 10);
  const songs = Object.entries(data.songs);
  const stats = { validated: 0, invalidated: 0, resolved: 0, notFound: 0, searches: 0 };
  let changed = false;

  // 1) Valida os vídeos já definidos.
  const withVideo = songs.filter(([, s]) => s.videoId);
  for (let i = 0; i < withVideo.length; i += 50) {
    const batch = withVideo.slice(i, i + 50);
    const items = await client.videos(batch.map(([, s]) => s.videoId));
    const byId = new Map(items.map((v) => [v.id, v]));
    for (const [id, song] of batch) {
      if (isPlayable(byId.get(song.videoId))) {
        stats.validated += 1;
        if (song.checkedAt !== stamp) {
          song.checkedAt = stamp;
          changed = true;
        }
      } else {
        log(`✗ ${id}: vídeo ${song.videoId} indisponível, será substituído`);
        song.videoId = null;
        song.checkedAt = null;
        stats.invalidated += 1;
        changed = true;
      }
    }
  }

  // 2) Resolve as músicas sem vídeo, até o limite de buscas.
  const retryBefore = new Date(today.getTime() - RETRY_EMPTY_AFTER_DAYS * 86400000).toISOString().slice(0, 10);
  const pending = songs.filter(([, s]) => !s.videoId && (!s.checkedAt || s.checkedAt < retryBefore));
  for (const [id, song] of pending) {
    if (stats.searches >= maxSearches) break;
    try {
      stats.searches += 1;
      const ids = await client.search(`${song.artist} ${song.title} karaoke`);
      const candidates = ids.length ? await client.videos(ids) : [];
      const best = pickBest(song, candidates);
      song.checkedAt = stamp;
      changed = true;
      if (best) {
        song.videoId = best.id;
        stats.resolved += 1;
        log(`✓ ${id}: ${best.id} — ${best.snippet?.title}`);
      } else {
        stats.notFound += 1;
        log(`? ${id}: nenhum resultado bom o suficiente`);
      }
    } catch (error) {
      if (error instanceof QuotaError) {
        log(`Cota da API esgotada; continua na próxima execução.`);
        break;
      }
      throw error;
    }
  }

  const missing = Object.values(data.songs).filter((s) => !s.videoId).length;
  return { changed, stats: { ...stats, missing, units: client.units } };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const key = (process.env.YT_API_KEY ?? '').trim();
  const output = process.env.GITHUB_OUTPUT;
  const setOutput = (name, value) => output && appendFileSync(output, `${name}=${value}\n`);

  if (!key) {
    console.log('YT_API_KEY não configurada: nada a fazer.');
    setOutput('changed', 'false');
    return;
  }

  const data = JSON.parse(readFileSync(SONGS_PATH, 'utf8'));
  const maxSearches = Math.max(0, Number.parseInt(process.env.MAX_SEARCHES ?? '50', 10) || 0);
  const referer = process.env.YT_REFERER ?? 'https://aglalberto.github.io/karaoke/';
  const { changed, stats } = await run({ data, key, referer, maxSearches });

  console.log(
    `\nValidados: ${stats.validated} · Substituídos: ${stats.invalidated} · Encontrados: ${stats.resolved} · ` +
      `Sem resultado: ${stats.notFound} · Faltando: ${stats.missing} · Cota usada: ${stats.units} unidades`,
  );

  if (changed && !dryRun) writeFileSync(SONGS_PATH, `${JSON.stringify(data, null, 2)}\n`);
  setOutput('changed', String(changed && !dryRun));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
