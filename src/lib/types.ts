export interface Video {
  videoId: string;
  /** Título da música (ou do vídeo, quando vem da busca). */
  title: string;
  /** Artista (listas) ou canal do YouTube (busca). */
  channel: string;
  thumb: string;
}

export interface QueueItem extends Video {
  id: string;
  singer: string;
  /** uid anônimo do celular que adicionou; null quando adicionado na própria TV. */
  ownerUid: string | null;
  standby: boolean;
  addedAt: number;
}

export interface CurrentItem extends QueueItem {
  /** Momento em que o vídeo começou a tocar de fato (null = carregado, ainda não tocou). */
  startedAt: number | null;
}

export interface HistoryItem {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  singer: string;
  playedAt: number;
}

export interface Snapshot {
  current: CurrentItem | null;
  queue: QueueItem[];
  history: HistoryItem[];
  updatedAt: number;
}

export const SINGER_MAX = 30;

export const thumbFor = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

export const isVideoId = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{11}$/.test(value);
