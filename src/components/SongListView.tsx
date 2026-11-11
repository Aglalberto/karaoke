import { getList, songToVideo, type Song } from '../lib/songs';
import type { Video } from '../lib/types';
import { SongRow } from './SongRow';

interface SongListViewProps {
  listId: string;
  onAdd: (video: Video) => void;
  /** Música ainda sem vídeo definido: abre a busca. */
  onMissing: (song: Song) => void;
}

export function SongListView({ listId, onAdd, onMissing }: SongListViewProps) {
  const list = getList(listId);
  if (!list) return null;
  return (
    <ol class="flex flex-col gap-0.5 pb-2">
      {list.songs.map((song, index) => (
        <SongRow
          key={song.id}
          leading={
            <span class="w-7 shrink-0 text-right text-sm font-semibold tabular-nums text-neutral-500">{index + 1}</span>
          }
          title={song.title}
          subtitle={song.artist}
          addLabel={`Adicionar ${song.title}, de ${song.artist}, à fila`}
          onAdd={() => {
            const video = songToVideo(song);
            if (video) onAdd(video);
            else onMissing(song);
          }}
        />
      ))}
    </ol>
  );
}
