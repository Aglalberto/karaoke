import type { CurrentItem, HistoryItem, QueueItem } from './types';

const MAX_NAMES = 12;

/** Chave de comparação: ignora maiúsculas, acentos e espaços extras ("Ana", " ana " e "Aná" são a mesma pessoa). */
export const singerKey = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

interface Sources {
  current?: CurrentItem | null;
  queue?: QueueItem[] | null;
  history?: HistoryItem[] | null;
}

/** Nomes que já cantaram ou estão na fila, do uso mais recente para o mais antigo, sem repetir. */
export function recentSingers({ current, queue, history }: Sources): string[] {
  const entries: Array<{ name: string; at: number }> = [];
  if (current) entries.push({ name: current.singer, at: current.addedAt });
  for (const item of queue ?? []) entries.push({ name: item.singer, at: item.addedAt });
  for (const item of history ?? []) entries.push({ name: item.singer, at: item.playedAt });
  entries.sort((a, b) => b.at - a.at);

  const seen = new Set<string>();
  const names: string[] = [];
  for (const { name } of entries) {
    const key = singerKey(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    names.push(name.trim());
    if (names.length >= MAX_NAMES) break;
  }
  return names;
}
