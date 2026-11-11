import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isPlayable, parseDuration, pickBest, run, scoreCandidate } from '../scripts/resolve-videos.mjs';

const song = { artist: 'Chitãozinho & Xororó', title: 'Evidências', videoId: null, checkedAt: null };
const video = (id, title, channel, duration = 'PT4M30S', status = {}) => ({
  id,
  snippet: { title, channelTitle: channel },
  contentDetails: { duration },
  status: { privacyStatus: 'public', embeddable: true, uploadStatus: 'processed', ...status },
});

test('parseDuration', () => {
  assert.equal(parseDuration('PT4M13S'), 253);
  assert.equal(parseDuration('PT1H2M'), 3720);
  assert.equal(parseDuration('PT45S'), 45);
  assert.equal(parseDuration(''), 0);
});

test('isPlayable respeita privacidade, incorporação e bloqueio no Brasil', () => {
  assert.ok(isPlayable(video('a', 't', 'c')));
  assert.ok(!isPlayable(video('a', 't', 'c', 'PT3M', { embeddable: false })));
  assert.ok(!isPlayable(video('a', 't', 'c', 'PT3M', { privacyStatus: 'private' })));
  assert.ok(!isPlayable({ ...video('a', 't', 'c'), contentDetails: { regionRestriction: { blocked: ['BR'] } } }));
  assert.ok(!isPlayable({ ...video('a', 't', 'c'), contentDetails: { regionRestriction: { allowed: ['US'] } } }));
  assert.ok(!isPlayable(undefined));
});

test('prefere a versão karaokê da música certa', () => {
  const karaoke = video('k', 'Evidências - Chitãozinho &amp; Xororó (Karaokê)', 'Karaokê Brasil');
  const cover = video('c', 'Evidências cover no violão', 'Fulano');
  const short = video('s', 'Evidências karaoke #shorts', 'Karaoke', 'PT30S');
  const other = video('o', 'Fio de Cabelo karaoke', 'Sing King');
  assert.ok(scoreCandidate(song, karaoke) > scoreCandidate(song, cover));
  assert.equal(pickBest(song, [cover, short, other, karaoke]).id, 'k');
  assert.equal(pickBest(song, [cover]), null);
});

function fakeFetch(handlers) {
  const calls = [];
  const impl = async (url) => {
    const u = new URL(url);
    const endpoint = u.pathname.split('/').pop();
    calls.push(endpoint);
    const result = handlers[endpoint](u.searchParams);
    return { ok: result.status === undefined, status: result.status ?? 200, json: async () => result.body ?? result };
  };
  impl.calls = calls;
  return impl;
}

test('run valida, substitui inválidos e respeita o limite de buscas', async () => {
  const data = {
    songs: {
      ok: { artist: 'Queen', title: 'Bohemian Rhapsody', videoId: 'okokokokok1', checkedAt: null },
      gone: { artist: 'Queen', title: 'Love of My Life', videoId: 'gonegonego1', checkedAt: null },
      evidencias: { ...song },
      outra: { artist: 'Tim Maia', title: 'Gostava Tanto de Você', videoId: null, checkedAt: null },
    },
    lists: [],
  };
  const fetchImpl = fakeFetch({
    videos: (p) => ({
      items: p
        .get('id')
        .split(',')
        .filter((id) => id !== 'gonegonego1')
        .map((id) => video(id, id === 'newkaraoke1' ? 'Evidências Karaokê' : 'Bohemian Rhapsody Karaoke', 'Sing King')),
    }),
    search: () => ({ items: [{ id: { videoId: 'newkaraoke1' } }] }),
  });
  const { changed, stats } = await run({ data, key: 'k', maxSearches: 2, fetchImpl, log: () => {}, today: new Date('2026-11-11') });
  assert.ok(changed);
  assert.equal(data.songs.ok.checkedAt, '2026-11-11');
  assert.equal(stats.invalidated, 1);
  assert.equal(stats.searches, 2, 'limite de buscas');
  assert.equal(data.songs.evidencias.videoId, 'newkaraoke1');
  assert.equal(stats.units, 1 + 2 * 101);
});

test('run para ao esgotar a cota sem falhar', async () => {
  const data = { songs: { evidencias: { ...song } }, lists: [] };
  const fetchImpl = fakeFetch({
    videos: () => ({ items: [] }),
    search: () => ({ status: 403, body: { error: { errors: [{ reason: 'quotaExceeded' }] } } }),
  });
  const { stats } = await run({ data, key: 'k', fetchImpl, log: () => {} });
  assert.equal(stats.resolved, 0);
  assert.equal(data.songs.evidencias.videoId, null);
});
