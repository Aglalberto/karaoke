import { formatTime } from '../lib/format';
import type { HistoryItem } from '../lib/types';

export function HistoryListView({ items }: { items: HistoryItem[] }) {
  if (items.length === 0) {
    return <p class="px-2 py-6 text-center text-sm text-neutral-500">Nenhuma música cantada ainda.</p>;
  }
  return (
    <ul class="flex flex-col gap-0.5 pb-2">
      {items.map((item) => (
        <li key={item.id + item.playedAt} class="flex items-center gap-3 rounded-xl px-2 py-2">
          <time class="w-12 shrink-0 text-sm font-medium tabular-nums text-neutral-500" dateTime={new Date(item.playedAt).toISOString()}>
            {formatTime(item.playedAt)}
          </time>
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold leading-snug text-neutral-100" title={item.title}>
              {item.title}
            </p>
            <p class="truncate text-sm leading-snug text-neutral-400">
              <span class="text-neutral-300">{item.singer}</span>
              {item.channel ? ` · ${item.channel}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
