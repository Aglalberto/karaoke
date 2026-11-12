import { batch, effect, signal } from '@preact/signals';
import { randomId } from './id';
import { loadJSON, saveJSON } from './storage';
import {
  SINGER_MAX,
  isVideoId,
  type CurrentItem,
  type HistoryItem,
  type QueueItem,
  type Snapshot,
  type Video,
} from './types';

/**
 * Estado da TV: fonte da verdade da fila, salvo no localStorage do navegador.
 * O Firebase (quando configurado) só recebe uma cópia para o celular ler.
 */

const STORAGE_KEY = 'karaoke:state:v1';
const HISTORY_LIMIT = 200;
const SNAPSHOT_HISTORY_LIMIT = 50;

interface Persisted {
  current: CurrentItem | null;
  queue: QueueItem[];
  history: HistoryItem[];
}

const str = (value: unknown, max: number) => (typeof value === 'string' ? value.slice(0, max) : '');

function sanitizeItem(raw: unknown): QueueItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!isVideoId(r.videoId) || typeof r.id !== 'string') return null;
  return {
    id: r.id,
    videoId: r.videoId,
    title: str(r.title, 200),
    channel: str(r.channel, 120),
    thumb: str(r.thumb, 300),
    singer: str(r.singer, SINGER_MAX),
    ownerUid: typeof r.ownerUid === 'string' ? r.ownerUid : null,
    standby: r.standby === true,
    addedAt: typeof r.addedAt === 'number' ? r.addedAt : Date.now(),
  };
}

function sanitizeHistory(raw: unknown): HistoryItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.playedAt !== 'number') return null;
  return {
    id: r.id,
    videoId: str(r.videoId, 11),
    title: str(r.title, 200),
    channel: str(r.channel, 120),
    singer: str(r.singer, SINGER_MAX),
    playedAt: r.playedAt,
  };
}

function load(): Persisted {
  const saved = loadJSON<Partial<Persisted>>(STORAGE_KEY);
  const currentBase = sanitizeItem(saved?.current);
  return {
    current: currentBase
      ? { ...currentBase, startedAt: typeof saved?.current?.startedAt === 'number' ? saved.current.startedAt : null }
      : null,
    queue: Array.isArray(saved?.queue) ? saved.queue.map(sanitizeItem).filter((i): i is QueueItem => !!i) : [],
    history: Array.isArray(saved?.history)
      ? saved.history.map(sanitizeHistory).filter((i): i is HistoryItem => !!i)
      : [],
  };
}

const initial = load();

export const current = signal<CurrentItem | null>(initial.current);
export const queue = signal<QueueItem[]>(initial.queue);
export const history = signal<HistoryItem[]>(initial.history);

effect(() => {
  saveJSON(STORAGE_KEY, { current: current.value, queue: queue.value, history: history.value });
});

/** Se nada estiver tocando, a primeira música que não está em standby vira a atual. */
function ensureCurrent() {
  if (current.value) return;
  const index = queue.value.findIndex((item) => !item.standby);
  if (index < 0) return;
  const next = queue.value[index];
  queue.value = queue.value.filter((_, i) => i !== index);
  current.value = { ...next, standby: false, startedAt: null };
}

export function addToQueue(video: Video, singer: string, ownerUid: string | null = null): QueueItem | null {
  if (!isVideoId(video.videoId)) return null;
  const item: QueueItem = {
    id: randomId(12),
    videoId: video.videoId,
    title: video.title.slice(0, 200),
    channel: video.channel.slice(0, 120),
    thumb: video.thumb.slice(0, 300),
    singer: singer.trim().slice(0, SINGER_MAX),
    ownerUid,
    standby: false,
    addedAt: Date.now(),
  };
  batch(() => {
    queue.value = [...queue.value, item];
    ensureCurrent();
  });
  return item;
}

export function removeFromQueue(id: string) {
  queue.value = queue.value.filter((item) => item.id !== id);
}

/** Remoção pedida por um celular: só vale para músicas que ele mesmo adicionou e que ainda estão na fila. */
export function removeOwnedFromQueue(id: string, ownerUid: string): boolean {
  const item = queue.value.find((i) => i.id === id);
  if (!item || !item.ownerUid || item.ownerUid !== ownerUid) return false;
  removeFromQueue(id);
  return true;
}

export function reorderQueue(from: number, to: number) {
  const list = [...queue.value];
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return;
  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved);
  queue.value = list;
}

/** Leva a música para a 1ª posição da fila; se estava em standby, já retoma. */
export function moveToNext(id: string) {
  const item = queue.value.find((i) => i.id === id);
  if (!item) return;
  batch(() => {
    queue.value = [{ ...item, standby: false }, ...queue.value.filter((i) => i.id !== id)];
    ensureCurrent();
  });
}

export function toggleStandby(id: string) {
  batch(() => {
    queue.value = queue.value.map((i) => (i.id === id ? { ...i, standby: !i.standby } : i));
    ensureCurrent();
  });
}

/** Devolve a música atual para o início da fila, congelada, e chama a próxima. */
export function standbyCurrent() {
  const cur = current.value;
  if (!cur) return;
  const { startedAt: _ignored, ...item } = cur;
  batch(() => {
    current.value = null;
    queue.value = [{ ...item, standby: true }, ...queue.value];
    ensureCurrent();
  });
}

export function markStarted() {
  const cur = current.value;
  if (cur && !cur.startedAt) current.value = { ...cur, startedAt: Date.now() };
}

/**
 * Encerra a música atual. Vai para o histórico se terminou ou se chegou a tocar antes de ser pulada;
 * vídeos com erro ou pulados antes de começar não entram.
 */
export function finishCurrent(reason: 'ended' | 'skipped' | 'error') {
  const cur = current.value;
  if (!cur) return;
  const played = reason === 'ended' || (reason === 'skipped' && cur.startedAt !== null);
  batch(() => {
    if (played) {
      const entry: HistoryItem = {
        id: cur.id,
        videoId: cur.videoId,
        title: cur.title,
        channel: cur.channel,
        singer: cur.singer,
        playedAt: Date.now(),
      };
      history.value = [entry, ...history.value].slice(0, HISTORY_LIMIT);
    }
    current.value = null;
    ensureCurrent();
  });
}

export function clearHistory() {
  history.value = [];
}

export function getSnapshot(): Snapshot {
  return {
    current: current.value,
    queue: queue.value,
    history: history.value.slice(0, SNAPSHOT_HISTORY_LIMIT),
    updatedAt: Date.now(),
  };
}

/** Garante que, ao abrir a página com músicas na fila e nada tocando, a próxima seja carregada. */
export function bootstrapState() {
  batch(ensureCurrent);
}
