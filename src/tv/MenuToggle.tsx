import { ChevronLeft } from 'lucide-preact';
import { menuOpen } from './ui';

export function MenuToggle() {
  const open = menuOpen.value;
  return (
    <button
      type="button"
      onClick={() => (menuOpen.value = !open)}
      aria-expanded={open}
      aria-controls="menu"
      aria-label={open ? 'Fechar menu' : 'Abrir menu'}
      class="group relative z-10 flex h-full w-10 shrink-0 flex-col items-center justify-center gap-4 border-r border-white/[0.06] bg-canvas text-neutral-500 transition-colors hover:bg-surface hover:text-white"
    >
      <span class="text-[11px] font-bold leading-none tracking-[0.35em] [text-orientation:upright] [writing-mode:vertical-rl]">
        MENU
      </span>
      <ChevronLeft
        size={18}
        strokeWidth={2.25}
        aria-hidden="true"
        class={`transition-transform duration-300 ease-out ${open ? '' : 'rotate-180'}`}
      />
    </button>
  );
}
