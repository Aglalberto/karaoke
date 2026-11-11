import { ArrowUpToLine, Play, SkipForward, Snowflake, Trash2 } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { current, moveToNext, queue, removeFromQueue, standbyCurrent, toggleStandby } from '../lib/state';
import { requestConfirm } from './dialogs';
import { confirmSkip } from './QueueBar';
import { cardMenu } from './ui';

const MENU_WIDTH = 224;

interface Position {
  left: number;
  bottom: number;
}

/** Calcula a posição acima do cartão; null se o cartão saiu da área visível da fila. */
function positionFor(itemId: string): Position | null {
  const card = document.querySelector<HTMLElement>(`[data-card-id="${CSS.escape(itemId)}"]`);
  if (!card) return null;
  const rect = card.getBoundingClientRect();
  const scroller = document.querySelector<HTMLElement>('[data-queue-scroller]');
  if (itemId !== 'current' && scroller) {
    const area = scroller.getBoundingClientRect();
    if (rect.right < area.left + 24 || rect.left > area.right - 24) return null;
  }
  return {
    left: Math.max(8, Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8)),
    bottom: window.innerHeight - rect.top + 8,
  };
}

export function CardMenu() {
  const state = cardMenu.value;
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

  useLayoutEffect(() => {
    if (!state) return;
    const update = () => {
      const next = positionFor(state.itemId);
      if (next) setPosition(next);
      else cardMenu.value = null;
    };
    update();
    document.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      document.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [state?.itemId]);

  useEffect(() => {
    if (!state) return;
    panel.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus({ preventScroll: true });
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panel.current?.contains(target)) return;
      // Clique no próprio cartão: deixa o botão alternar o menu.
      if ((target as HTMLElement).closest?.('[aria-haspopup="menu"]')) return;
      cardMenu.value = null;
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [state?.itemId, !!position]);

  if (!state || !position) return null;

  const isCurrent = state.itemId === 'current';
  const cur = current.value;
  const index = queue.value.findIndex((i) => i.id === state.itemId);
  const item = isCurrent ? cur : queue.value[index];
  if (!item) return null;

  const close = () => (cardMenu.value = null);
  const { left, bottom } = position;

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []);
    const at = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === 'ArrowDown' ? (at + 1) % items.length : (at - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div
      ref={panel}
      role="menu"
      aria-label={`Opções de ${item.title}`}
      onKeyDown={onKeyDown}
      class="animate-pop-in fixed z-40 rounded-xl border border-white/10 bg-raised p-1.5 shadow-2xl shadow-black/70"
      style={{ left, bottom, width: MENU_WIDTH }}
    >
      <div class="px-3 pb-2 pt-1.5">
        <p class="truncate text-sm font-semibold text-white">{item.singer}</p>
        <p class="truncate text-xs text-neutral-500">{item.title}</p>
      </div>
      <div class="mb-1 h-px bg-white/[0.06]" />

      {isCurrent ? (
        <>
          <MenuItem
            icon={<Snowflake size={17} />}
            onClick={() => {
              close();
              standbyCurrent();
            }}
          >
            Standby
          </MenuItem>
          <MenuItem
            icon={<SkipForward size={17} />}
            onClick={() => {
              close();
              confirmSkip();
            }}
          >
            Pular música
          </MenuItem>
        </>
      ) : (
        <>
          <MenuItem
            icon={<ArrowUpToLine size={17} />}
            disabled={index === 0 && !queue.value[0]?.standby}
            onClick={() => {
              close();
              moveToNext(item.id);
            }}
          >
            Próxima da fila
          </MenuItem>
          <MenuItem
            icon={queue.value[index].standby ? <Play size={17} /> : <Snowflake size={17} />}
            onClick={() => {
              close();
              toggleStandby(item.id);
            }}
          >
            {queue.value[index].standby ? 'Retomar a fila' : 'Standby'}
          </MenuItem>
          <div class="my-1 h-px bg-white/[0.06]" />
          <MenuItem
            icon={<Trash2 size={17} />}
            onClick={() => {
              close();
              requestConfirm({
                title: 'Excluir da fila?',
                body: `${item.title} (${item.singer}) será removida da fila.`,
                confirmLabel: 'Excluir',
                onConfirm: () => removeFromQueue(item.id),
              });
            }}
          >
            Excluir
          </MenuItem>
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
  disabled,
}: {
  icon: ComponentChildren;
  children: ComponentChildren;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      class="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] font-medium text-neutral-200 transition hover:bg-white/[0.06] hover:text-white focus-visible:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-35"
    >
      <span class="text-neutral-400" aria-hidden="true">
        {icon}
      </span>
      {children}
    </button>
  );
}
