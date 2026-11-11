import { YT_API_KEY } from '../config';
import { decodeEntities } from './format';
import { loadJSON, saveJSON } from './storage';
import { isVideoId, thumbFor, type Video } from './types';

const CACHE_KEY = 'karaoke:searchCache:v1';
const CACHE_TTL = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 40;

export type SearchErrorKind = 'no-key' | 'quota' | 'config' | 'network';

export class SearchError extends Error {
  constructor(public kind: SearchErrorKind, message: string) {
    super(message);
  }
}

type Cache = Record<string, { at: number; results: Video[] }>;

/** Acrescenta "karaoke" ao termo, se a pessoa não tiver escrito. */
export function buildQuery(term: string): string {
  const clean = term.trim().replace(/\s+/g, ' ');
  return /karaok/i.test(clean) ? clean : `${clean} karaoke`;
}

function readCache(query: string): Video[] | null {
  const cache = loadJSON<Cache>(CACHE_KEY) ?? {};
  const hit = cache[query.toLowerCase()];
  return hit && Date.now() - hit.at < CACHE_TTL ? hit.results : null;
}

function writeCache(query: string, results: Video[]) {
  const cache = loadJSON<Cache>(CACHE_KEY) ?? {};
  cache[query.toLowerCase()] = { at: Date.now(), results };
  const entries = Object.entries(cache)
    .filter(([, value]) => Date.now() - value.at < CACHE_TTL)
    .sort((a, b) => b[1].at - a[1].at)
    .slice(0, CACHE_MAX_ENTRIES);
  saveJSON(CACHE_KEY, Object.fromEntries(entries));
}

interface ApiResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: { title?: string; channelTitle?: string; thumbnails?: { medium?: { url?: string } } };
  }>;
  error?: { code?: number; errors?: Array<{ reason?: string }> };
}

/** Busca vídeos de karaokê no YouTube (custa 100 unidades da cota diária por chamada, por isso o cache). */
export async function searchVideos(term: string): Promise<Video[]> {
  if (!YT_API_KEY) throw new SearchError('no-key', 'Busca indisponível: a chave da API do YouTube não foi configurada.');
  const query = buildQuery(term);
  const cached = readCache(query);
  if (cached) return cached;

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    videoEmbeddable: 'true',
    videoSyndicated: 'true',
    maxResults: '15',
    regionCode: 'BR',
    relevanceLanguage: 'pt',
    q: query,
    fields: 'items(id/videoId,snippet(title,channelTitle,thumbnails/medium/url))',
    key: YT_API_KEY,
  });

  let response: Response;
  try {
    response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  } catch {
    throw new SearchError('network', 'Sem conexão com o YouTube. Verifique a internet e tente de novo.');
  }

  const data = (await response.json().catch(() => ({}))) as ApiResponse;
  if (!response.ok) {
    const reasons = data.error?.errors?.map((e) => e.reason ?? '') ?? [];
    if (reasons.some((r) => /quota|rateLimit/i.test(r))) {
      throw new SearchError('quota', 'O limite diário de buscas do YouTube acabou. Use as listas ou tente amanhã.');
    }
    throw new SearchError('config', 'A busca do YouTube recusou a chave de API. Confira a configuração.');
  }

  const results: Video[] = (data.items ?? [])
    .filter((item) => isVideoId(item.id?.videoId))
    .map((item) => {
      const videoId = item.id!.videoId!;
      return {
        videoId,
        title: decodeEntities(item.snippet?.title ?? ''),
        channel: decodeEntities(item.snippet?.channelTitle ?? ''),
        thumb: item.snippet?.thumbnails?.medium?.url ?? thumbFor(videoId),
      };
    });

  writeCache(query, results);
  return results;
}
