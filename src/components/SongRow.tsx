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

/** Linha de música (listas e busca): clicar na linha adiciona à fila. */
export function SongRow({ leading, title, subtitle, onAdd, addLabel, wrapTitle = false }: SongRowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onAdd}
        aria-label={addLabel}
        title="Adicionar à fila"
        class="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.06] focus-visible:bg-white/[0.06] active:bg-white/[0.1]"
      >
        {leading}
        <span class="min-w-0 flex-1">
          <span class={`block ${wrapTitle ? 'line-clamp-2 text-[15px]' : 'truncate'} font-semibold leading-snug text-neutral-100`}>
            {title}
          </span>
          <span class="block truncate text-sm leading-snug text-neutral-400">{subtitle}</span>
        </span>
      </button>
    </li>
  );
}
