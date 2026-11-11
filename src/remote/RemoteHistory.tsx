import { HistoryListView } from '../components/HistoryListView';
import type { HistoryItem } from '../lib/types';

export function RemoteHistory({ items }: { items: HistoryItem[] }) {
  return (
    <div class="scroll-thin -mx-4 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
      <h2 class="px-3 pb-3 text-xl font-bold tracking-tight">Histórico</h2>
      <HistoryListView items={items} />
    </div>
  );
}
