import { ChevronLeft, ChevronRight, History, Mic, Search } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { HistoryListView } from '../components/HistoryListView';
import { SearchPanel } from '../components/SearchPanel';
import { SongListView } from '../components/SongListView';
import { getList, songLists } from '../lib/songs';
import { clearHistory, history } from '../lib/state';
import { requestAdd, requestConfirm } from './dialogs';
import { FullscreenButton } from './FullscreenButton';
import { QrCard } from './QrCard';
import { goHome, menuOpen, menuView, openMenuView } from './ui';

const WIDTH_HOME = 312;
const WIDTH_CONTENT = 408;

export function Menu() {
  const open = menuOpen.value;
  const view = menuView.value;
  const width = view.type === 'home' ? WIDTH_HOME : WIDTH_CONTENT;

  return (
    <aside
      id="menu"
      aria-label="Menu"
      aria-hidden={!open}
      inert={!open}
      class="h-full shrink-0 overflow-hidden bg-surface transition-[width] duration-300 ease-out"
      style={{ width: open ? width : 0 }}
    >
      <div class="flex h-full flex-col border-r border-white/[0.06]" style={{ width }}>
        {view.type === 'home' ? <MenuHome /> : <MenuContent />}
        <QrCard />
      </div>
    </aside>
  );
}

function MenuHome() {
  const played = history.value.length;
  return (
    <div class="scroll-thin flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pb-4 pt-6">
      <header class="flex items-center gap-2.5 px-1">
        <span class="grid size-9 place-items-center rounded-xl bg-white text-neutral-950">
          <Mic size={18} strokeWidth={2.5} aria-hidden="true" />
        </span>
        <h1 class="text-2xl font-extrabold tracking-tight text-white">Karaokê</h1>
        <FullscreenButton />
      </header>

      <button
        type="button"
        onClick={() => openMenuView({ type: 'search' })}
        class="flex h-12 shrink-0 items-center gap-3 rounded-xl border border-white/10 bg-canvas px-4 text-left text-[15px] text-neutral-400 transition hover:border-white/25 hover:text-neutral-100"
      >
        <Search size={18} aria-hidden="true" />
        Buscar no YouTube
      </button>

      <nav aria-label="Listas" class="flex flex-col gap-1">
        <p class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-600">Listas</p>
        {songLists.map((list) => (
          <NavButton key={list.id} meta={list.songs.length} onClick={() => openMenuView({ type: 'list', id: list.id })}>
            {list.title}
          </NavButton>
        ))}
      </nav>

      <div class="flex flex-col gap-1">
        <NavButton icon={<History size={18} aria-hidden="true" />} meta={played || undefined} onClick={() => openMenuView({ type: 'history' })}>
          Histórico
        </NavButton>
      </div>
    </div>
  );
}

function NavButton({
  children,
  meta,
  icon,
  onClick,
}: {
  children: ComponentChildren;
  meta?: number;
  icon?: ComponentChildren;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      class="group flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] font-medium text-neutral-300 transition hover:bg-white/[0.05] hover:text-white"
    >
      {icon && <span class="text-neutral-500 group-hover:text-neutral-300">{icon}</span>}
      <span class="min-w-0 flex-1 truncate">{children}</span>
      {meta !== undefined && <span class="text-xs font-medium tabular-nums text-neutral-600">{meta}</span>}
      <ChevronRight size={16} aria-hidden="true" class="-mr-1 text-neutral-700 transition group-hover:translate-x-0.5 group-hover:text-neutral-400" />
    </button>
  );
}

function confirmClearHistory() {
  const count = history.value.length;
  requestConfirm({
    title: 'Limpar histórico?',
    body: `${count === 1 ? 'A música cantada será apagada' : `As ${count} músicas cantadas serão apagadas`} do histórico, na TV e nos celulares. Isso não pode ser desfeito.`,
    confirmLabel: 'Limpar histórico',
    onConfirm: clearHistory,
  });
}

function MenuContent() {
  const view = menuView.value;
  const title =
    view.type === 'search' ? 'Buscar no YouTube' : view.type === 'history' ? 'Histórico' : view.type === 'list' ? getList(view.id)?.title ?? '' : '';

  return (
    <div class="flex min-h-0 flex-1 flex-col px-5 pt-5">
      <button
        type="button"
        onClick={goHome}
        class="-ml-2 inline-flex h-9 w-fit items-center gap-1 rounded-lg pl-1 pr-3 text-sm font-medium text-neutral-400 transition hover:bg-white/5 hover:text-white"
      >
        <ChevronLeft size={18} aria-hidden="true" />
        Voltar
      </button>
      <div class="flex items-center gap-3 px-1 pb-4 pt-3">
        <h2 class="min-w-0 flex-1 truncate text-xl font-bold tracking-tight text-white">{title}</h2>
        {view.type === 'history' && history.value.length > 0 && (
          <button
            type="button"
            onClick={confirmClearHistory}
            class="h-8 shrink-0 rounded-lg border border-white/10 px-3 text-sm font-medium text-neutral-300 transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white"
          >
            Limpar histórico
          </button>
        )}
      </div>

      {view.type === 'search' ? (
        <SearchPanel initialQuery={view.query} autoSearch={view.autoSearch} onAdd={requestAdd} />
      ) : (
        <div class="scroll-thin -mx-3 min-h-0 flex-1 overflow-y-auto px-3">
          {view.type === 'list' && (
            <SongListView
              listId={view.id}
              onAdd={requestAdd}
              onMissing={(song) => openMenuView({ type: 'search', query: `${song.artist} ${song.title}`, autoSearch: true })}
            />
          )}
          {view.type === 'history' && <HistoryListView items={history.value} />}
        </div>
      )}
    </div>
  );
}
