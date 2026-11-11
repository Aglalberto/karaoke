import { ChevronLeft, ChevronRight } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { SongListView } from '../components/SongListView';
import { getList, songLists, type Song } from '../lib/songs';
import type { Video } from '../lib/types';

export function RemoteLists({ onAdd, onMissing }: { onAdd: (video: Video) => void; onMissing: (song: Song) => void }) {
  const [listId, setListId] = useState<string | null>(null);
  const list = listId ? getList(listId) : null;

  if (!list) {
    return (
      <div class="scroll-thin -mx-4 min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <h2 class="px-1 pb-3 text-xl font-bold tracking-tight">Listas</h2>
        <ul class="flex flex-col gap-1">
          {songLists.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => setListId(l.id)}
                class="flex h-14 w-full items-center gap-3 rounded-xl px-3 text-left text-base font-medium text-neutral-200 transition active:bg-white/[0.06]"
              >
                <span class="min-w-0 flex-1 truncate">{l.title}</span>
                <span class="text-xs tabular-nums text-neutral-600">{l.songs.length}</span>
                <ChevronRight size={18} class="text-neutral-600" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div class="flex min-h-0 flex-1 flex-col">
      <button
        type="button"
        onClick={() => setListId(null)}
        class="-ml-2 inline-flex h-9 w-fit items-center gap-1 rounded-lg pl-1 pr-3 text-sm font-medium text-neutral-400"
      >
        <ChevronLeft size={18} aria-hidden="true" />
        Listas
      </button>
      <h2 class="px-1 pb-3 pt-2 text-xl font-bold tracking-tight">{list.title}</h2>
      <div class="scroll-thin -mx-4 min-h-0 flex-1 overflow-y-auto px-2">
        <SongListView
          listId={list.id}
          onAdd={onAdd}
          onMissing={onMissing}
        />
      </div>
    </div>
  );
}
