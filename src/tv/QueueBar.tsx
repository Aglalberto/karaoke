import { Play, SkipForward, Snowflake } from 'lucide-preact';
import Sortable from 'sortablejs';
import { useEffect, useRef } from 'preact/hooks';
import { SortIcon } from '../components/SortIcon';
import { current, queue, reorderQueue } from '../lib/state';
import type { QueueItem } from '../lib/types';
import { requestConfirm } from './dialogs';
import { playerState, skipCurrent } from './playback';
import { cardMenu } from './ui';

function openCardMenu(itemId: string) {
  cardMenu.value = cardMenu.value?.itemId === itemId ? null : { itemId };
}

/** Botão direito no cartão faz o mesmo que o clique normal (no lugar do menu do navegador). */
const onCardContextMenu = (itemId: string) => (event: MouseEvent) => {
  event.preventDefault();
  openCardMenu(itemId);
};

export function confirmSkip() {
  const cur = current.value;
  if (!cur) return;
  requestConfirm({
    title: 'Pular esta música?',
    body: `${cur.title} (${cur.singer}) sai da vez e a próxima da fila é chamada.`,
    confirmLabel: 'Pular música',
    onConfirm: skipCurrent,
  });
}

export function QueueBar() {
  const scroller = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!list.current) return;
    const sortable = Sortable.create(list.current, {
      handle: '.drag-handle',
      direction: 'horizontal',
      animation: 180,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      forceFallback: true,
      fallbackOnBody: true,
      onStart: () => {
        cardMenu.value = null;
      },
      onEnd: (event) => {
        const { item, from, oldIndex, newIndex } = event;
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;
        // Desfaz a mudança feita pelo SortableJS no DOM e deixa o Preact renderizar a nova ordem.
        from.removeChild(item);
        from.insertBefore(item, from.children[oldIndex] ?? null);
        reorderQueue(oldIndex, newIndex);
      },
    });
    return () => sortable.destroy();
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || el.scrollWidth <= el.clientWidth) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const items = queue.value;
  let activePosition = 0;

  return (
    <footer aria-label="Fila de músicas" class="flex h-24 shrink-0 items-stretch gap-3 border-t border-white/[0.06] bg-canvas px-3 py-3">
      <NowPlayingCard />
      <div class="relative min-w-0 flex-1">
        <div ref={scroller} data-queue-scroller class="scroll-x h-full overflow-x-auto overflow-y-hidden">
          <ol ref={list} class="flex h-full w-max gap-2 pr-14" aria-label="Próximas músicas">
            {items.map((item, index) => {
              if (!item.standby) activePosition += 1;
              return <QueueCard key={item.id} item={item} index={index} position={item.standby ? null : activePosition} />;
            })}
          </ol>
          {items.length === 0 && (
            <p class="pointer-events-none absolute inset-0 flex items-center px-4 text-sm text-neutral-600">Nenhuma música na fila</p>
          )}
        </div>
      </div>
    </footer>
  );
}

function NowPlayingCard() {
  const cur = current.value;
  if (!cur) {
    return (
      <div class="flex w-72 shrink-0 items-center gap-3 rounded-xl border border-white/[0.06] bg-surface px-4 text-neutral-600">
        <span class="grid size-9 place-items-center rounded-full border border-white/10">
          <Play size={14} aria-hidden="true" />
        </span>
        <span class="text-sm font-medium">Nada tocando</span>
      </div>
    );
  }
  const playing = playerState.value === 1;
  const label = cur.startedAt ? 'Tocando agora' : 'É a vez de';
  return (
    <div data-card-id="current" onContextMenu={onCardContextMenu('current')} class="flex w-72 shrink-0 items-stretch overflow-hidden rounded-xl bg-white text-neutral-950">
      <button
        type="button"
        aria-haspopup="menu"
        aria-label={`${label}: ${cur.singer}, ${cur.title}. Abrir opções`}
        onClick={() => openCardMenu('current')}
        class="flex min-w-0 flex-1 items-center gap-3 pl-3 pr-2 text-left transition hover:bg-black/[0.04]"
      >
        <span class="grid size-9 shrink-0 place-items-center rounded-full bg-neutral-950 text-white">
          {playing ? (
            <span class="eq" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          ) : (
            <Play size={14} fill="currentColor" aria-hidden="true" />
          )}
        </span>
        <span class="min-w-0">
          <span class="block text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">{label}</span>
          <span class="block truncate font-bold leading-tight">{cur.singer}</span>
          <span class="block truncate text-sm leading-tight text-neutral-600">{cur.title}</span>
        </span>
      </button>
      <button
        type="button"
        onClick={confirmSkip}
        aria-label="Pular música"
        title="Pular música"
        class="grid w-11 shrink-0 place-items-center border-l border-black/10 text-neutral-700 transition hover:bg-black/[0.06] hover:text-neutral-950"
      >
        <SkipForward size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

function QueueCard({ item, index, position }: { item: QueueItem; index: number; position: number | null }) {
  const onHandleKey = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      reorderQueue(index, index - 1);
    } else if (event.key === 'ArrowRight' && index < queue.value.length - 1) {
      event.preventDefault();
      reorderQueue(index, index + 1);
    }
  };

  return (
    <li
      data-card-id={item.id}
      onContextMenu={onCardContextMenu(item.id)}
      class={`flex h-full w-64 shrink-0 items-stretch overflow-hidden rounded-xl border bg-raised transition-colors ${
        item.standby ? 'border-dashed border-white/15 bg-surface' : 'border-white/[0.06]'
      } ${cardMenu.value?.itemId === item.id ? 'ring-1 ring-white/40' : ''}`}
    >
      <button
        type="button"
        class="drag-handle grid w-8 shrink-0 cursor-grab touch-none place-items-center text-neutral-500 transition hover:bg-white/[0.06] hover:text-white active:cursor-grabbing"
        aria-label={`Reordenar ${item.title}. Arraste ou use as setas`}
        title="Arraste para reordenar"
        onKeyDown={onHandleKey}
      >
        <SortIcon />
      </button>
      <button
        type="button"
        aria-haspopup="menu"
        aria-label={`${item.singer}, ${item.title}${item.standby ? ', em standby' : ''}. Abrir opções`}
        onClick={() => openCardMenu(item.id)}
        class={`flex min-w-0 flex-1 items-center gap-2.5 pr-3 text-left transition hover:bg-white/[0.03] ${item.standby ? 'opacity-55' : ''}`}
      >
        <span class="grid w-5 shrink-0 place-items-center text-sm font-bold tabular-nums text-neutral-500">
          {position ?? <Snowflake size={14} aria-hidden="true" />}
        </span>
        <img src={item.thumb} alt="" loading="lazy" draggable={false} class="h-10 w-[71px] shrink-0 rounded-md bg-neutral-800 object-cover" />
        <span class="min-w-0">
          <span class="block truncate font-semibold leading-tight text-white">{item.singer}</span>
          <span class="block truncate text-sm leading-tight text-neutral-400">
            {item.standby ? 'Standby · ' : ''}
            {item.title}
          </span>
        </span>
      </button>
    </li>
  );
}
