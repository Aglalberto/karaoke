import { Search } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { searchEnabled } from '../config';
import { SearchError, searchVideos } from '../lib/youtube-search';
import type { Video } from '../lib/types';
import { SongRow } from './SongRow';

interface SearchPanelProps {
  initialQuery?: string;
  autoSearch?: boolean;
  autoFocus?: boolean;
  onAdd: (video: Video) => void;
}

type Status = { kind: 'idle' } | { kind: 'loading' } | { kind: 'done'; results: Video[] } | { kind: 'error'; message: string };

export function SearchPanel({ initialQuery = '', autoSearch = false, autoFocus = true, onAdd }: SearchPanelProps) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const input = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  const run = async (term: string) => {
    if (!term.trim()) return;
    const id = ++requestId.current;
    setStatus({ kind: 'loading' });
    try {
      const results = await searchVideos(term);
      if (id === requestId.current) setStatus({ kind: 'done', results });
    } catch (error) {
      if (id !== requestId.current) return;
      setStatus({ kind: 'error', message: error instanceof SearchError ? error.message : 'Não foi possível buscar agora.' });
    }
  };

  useEffect(() => {
    setQuery(initialQuery);
    if (autoSearch && initialQuery) run(initialQuery);
    else if (autoFocus) input.current?.focus();
  }, [initialQuery, autoSearch]);

  return (
    <div class="flex min-h-0 flex-1 flex-col gap-3">
      <form
        class="relative shrink-0"
        onSubmit={(e) => {
          e.preventDefault();
          input.current?.blur();
          run(query);
        }}
      >
        <Search size={18} class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
        <input
          ref={input}
          type="search"
          value={query}
          onInput={(e) => setQuery(e.currentTarget.value)}
          placeholder="Música ou artista"
          enterKeyHint="search"
          aria-label="Buscar música ou artista no YouTube"
          disabled={!searchEnabled}
          class="h-12 w-full rounded-xl border border-white/10 bg-neutral-950 pl-10 pr-4 text-base text-white placeholder:text-neutral-600 focus:border-white/40 focus:outline-none disabled:opacity-50"
        />
      </form>

      <div class="scroll-thin -mx-2 min-h-0 flex-1 overflow-y-auto px-2">
        {!searchEnabled ? (
          <Hint>Busca indisponível: a chave da API do YouTube ainda não foi configurada. Use as listas.</Hint>
        ) : status.kind === 'idle' ? (
          <Hint>Digite e aperte Enter. A palavra "karaokê" é incluída automaticamente.</Hint>
        ) : status.kind === 'loading' ? (
          <ul class="flex flex-col gap-1" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} class="flex animate-pulse items-center gap-3 px-2 py-2">
                <div class="h-12 w-[85px] rounded-lg bg-neutral-800" />
                <div class="flex flex-1 flex-col gap-2">
                  <div class="h-3.5 w-4/5 rounded bg-neutral-800" />
                  <div class="h-3 w-1/2 rounded bg-neutral-800/70" />
                </div>
              </li>
            ))}
          </ul>
        ) : status.kind === 'error' ? (
          <Hint>{status.message}</Hint>
        ) : status.results.length === 0 ? (
          <Hint>Nenhum vídeo encontrado. Tente outro nome.</Hint>
        ) : (
          <ul class="flex flex-col gap-0.5 pb-2">
            {status.results.map((video) => (
              <SongRow
                key={video.videoId}
                leading={
                  <img
                    src={video.thumb}
                    alt=""
                    loading="lazy"
                    class="h-12 w-[85px] shrink-0 rounded-lg bg-neutral-800 object-cover"
                  />
                }
                title={video.title}
                subtitle={video.channel}
                wrapTitle
                addLabel={`Adicionar ${video.title} à fila`}
                onAdd={() => onAdd(video)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Hint({ children }: { children: string }) {
  return <p class="px-2 py-6 text-center text-sm leading-relaxed text-neutral-500">{children}</p>;
}
