import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { openModals } from '../lib/modal-stack';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ComponentChildren;
  /** Seletor do elemento que recebe o foco ao abrir. */
  initialFocus?: string;
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function Modal({ title, onClose, children, initialFocus }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    openModals.value += 1;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const target = initialFocus ? panel.current?.querySelector<HTMLElement>(initialFocus) : null;
    (target ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    return () => {
      openModals.value -= 1;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key === 'Tab' && panel.current) {
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      class="animate-fade-in fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm sm:items-center sm:pt-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        class="animate-pop-in w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl shadow-black/60"
      >
        {children}
      </div>
    </div>
  );
}

export const btnPrimary =
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 font-semibold text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40';
export const btnGhost =
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 font-medium text-neutral-300 transition hover:bg-white/5 hover:text-white';
