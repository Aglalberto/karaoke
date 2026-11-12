import { useState } from 'preact/hooks';
import { Modal, btnGhost, btnPrimary } from './Modal';
import { singerKey } from '../lib/singers';
import { loadString, saveString } from '../lib/storage';
import { SINGER_MAX, type Video } from '../lib/types';

const LAST_SINGER_KEY = 'karaoke:lastSinger';

interface SingerModalProps {
  video: Video;
  /** Nomes já usados (fila e histórico), do mais recente para o mais antigo. */
  names?: string[];
  onConfirm: (singer: string) => void;
  onClose: () => void;
}

export function SingerModal({ video, names = [], onConfirm, onClose }: SingerModalProps) {
  const [name, setName] = useState(() => loadString(LAST_SINGER_KEY) ?? '');
  const [edited, setEdited] = useState(false);
  const trimmed = name.trim();
  const typedKey = singerKey(name);

  // Enquanto a pessoa digita, mostra só os nomes que contêm o texto; antes disso, todos.
  const suggestions = edited && typedKey ? names.filter((n) => singerKey(n).includes(typedKey)) : names;

  const confirm = (singer: string) => {
    saveString(LAST_SINGER_KEY, singer);
    onConfirm(singer);
  };

  const submit = (event: Event) => {
    event.preventDefault();
    if (trimmed) confirm(trimmed);
  };

  return (
    <Modal title="Quem vai cantar essa?" onClose={onClose} initialFocus="input">
      <form onSubmit={submit} class="flex flex-col gap-5">
        <div class="flex items-center gap-3">
          <img src={video.thumb} alt="" class="h-12 w-[85px] shrink-0 rounded-lg bg-neutral-800 object-cover" />
          <div class="min-w-0">
            <p class="truncate font-semibold text-neutral-100">{video.title}</p>
            <p class="truncate text-sm text-neutral-400">{video.channel}</p>
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <label class="flex flex-col gap-2">
            <span class="text-xl font-bold tracking-tight text-white">Quem vai cantar essa?</span>
            <input
              type="text"
              value={name}
              maxLength={SINGER_MAX}
              autoComplete="off"
              enterKeyHint="done"
              placeholder="Nome de quem vai cantar"
              onInput={(e) => {
                setName(e.currentTarget.value);
                setEdited(true);
              }}
              onFocus={(e) => e.currentTarget.select()}
              class="h-12 rounded-xl border border-white/10 bg-neutral-950 px-4 text-lg text-white placeholder:text-neutral-600 focus:border-white/40 focus:outline-none"
            />
          </label>
          {suggestions.length > 0 && (
            <div role="group" aria-label="Nomes já usados: toque para adicionar" class="flex flex-col gap-2">
              <span class="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Toque para adicionar</span>
              <div class="scroll-thin flex max-h-28 flex-wrap gap-2 overflow-y-auto">
                {suggestions.map((singer) => {
                  const active = singerKey(singer) === typedKey;
                  return (
                    <button
                      key={singer}
                      type="button"
                      onClick={() => confirm(singer)}
                      class={`h-9 max-w-full truncate rounded-full border px-4 text-[15px] font-medium transition ${
                        active
                          ? 'border-white bg-white text-neutral-950 hover:bg-neutral-200'
                          : 'border-white/15 text-neutral-200 hover:border-white/40 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      {singer}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" class={btnGhost} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" class={btnPrimary} disabled={!trimmed}>
            Adicionar à fila
          </button>
        </div>
      </form>
    </Modal>
  );
}
