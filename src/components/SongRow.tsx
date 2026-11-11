import { Plus } from 'lucide-preact';
import type { ComponentChildren } from 'preact';

interface SongRowProps {
  leading: ComponentChildren;
  title: string;
  subtitle: string;
  onAdd: () => void;
  addLabel: string;
  /** Permite título em até duas linhas (títulos longos do YouTube). */
  wrapTitle?: boolean;
}

/** Linha de música (listas e busca) com botão "+" para adicionar à fila. */
export function SongRow({ leading, title, subtitle, onAdd, addLabel, wrapTitle = false }: SongRowProps) {
  return (
    <li class="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/[0.04]">
      {leading}
      <div class="min-w-0 flex-1">
        <p class={`${wrapTitle ? 'line-clamp-2 text-[15px]' : 'truncate'} font-semibold leading-snug text-neutral-100`} title={title}>
          {title}
        </p>
        <p class="truncate text-sm leading-snug text-neutral-400" title={subtitle}>
          {subtitle}
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        aria-label={addLabel}
        title="Adicionar à fila"
        class="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 text-neutral-300 transition hover:border-white hover:bg-white hover:text-neutral-950"
      >
        <Plus size={20} strokeWidth={2.25} aria-hidden="true" />
      </button>
    </li>
  );
}
