import { useState } from 'preact/hooks';
import { Modal, btnGhost, btnPrimary } from './Modal';
import { loadString, saveString } from '../lib/storage';
import { SINGER_MAX, type Video } from '../lib/types';

const LAST_SINGER_KEY = 'karaoke:lastSinger';

interface SingerModalProps {
  video: Video;
  onConfirm: (singer: string) => void;
  onClose: () => void;
}

export function SingerModal({ video, onConfirm, onClose }: SingerModalProps) {
  const [name, setName] = useState(() => loadString(LAST_SINGER_KEY) ?? '');
  const trimmed = name.trim();

  const submit = (event: Event) => {
    event.preventDefault();
    if (!trimmed) return;
    saveString(LAST_SINGER_KEY, trimmed);
    onConfirm(trimmed);
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
        <label class="flex flex-col gap-2">
          <span class="text-xl font-bold tracking-tight text-white">Quem vai cantar essa?</span>
          <input
            type="text"
            value={name}
            maxLength={SINGER_MAX}
            autoComplete="off"
            enterKeyHint="done"
            placeholder="Nome de quem vai cantar"
            onInput={(e) => setName(e.currentTarget.value)}
            onFocus={(e) => e.currentTarget.select()}
            class="h-12 rounded-xl border border-white/10 bg-neutral-950 px-4 text-lg text-white placeholder:text-neutral-600 focus:border-white/40 focus:outline-none"
          />
        </label>
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
