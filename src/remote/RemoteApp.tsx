import { useSignal } from '@preact/signals';
import { History, ListMusic, ListOrdered, Mic, Search, type LucideIcon } from 'lucide-preact';
import { useMemo, useState } from 'preact/hooks';
import { SearchPanel } from '../components/SearchPanel';
import { SingerModal } from '../components/SingerModal';
import { Toasts } from '../components/Toasts';
import { createRemoteBridge, type RemoteStatus } from '../lib/remote-bridge';
import { showToast } from '../lib/toast';
import type { Video } from '../lib/types';
import { RemoteHistory } from './RemoteHistory';
import { RemoteLists } from './RemoteLists';
import { RemoteQueue } from './RemoteQueue';

type Tab = 'search' | 'lists' | 'queue' | 'history';

const TABS: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
  { id: 'search', label: 'Buscar', icon: Search },
  { id: 'lists', label: 'Listas', icon: ListMusic },
  { id: 'queue', label: 'Fila', icon: ListOrdered },
  { id: 'history', label: 'Histórico', icon: History },
];

export function RemoteApp({ tvId }: { tvId: string }) {
  const bridge = useMemo(() => createRemoteBridge(tvId), [tvId]);
  const tab = useSignal<Tab>('search');
  const [pending, setPending] = useState<Video | null>(null);
  const [searchFor, setSearchFor] = useState<string | undefined>(undefined);
  const status = bridge.status.value;
  const snapshot = bridge.snapshot.value;
  const myUid = bridge.uid.value;
  const queueCount = snapshot?.queue.length ?? 0;

  const send = async (video: Video, singer: string) => {
    setPending(null);
    try {
      await bridge.sendAdd(video, singer);
      showToast(bridge.tvOnline.value ? 'Enviada para a fila!' : 'Enviada! Entra na fila quando a TV abrir.');
    } catch {
      showToast('Não foi possível enviar. Tente de novo.');
    }
  };

  return (
    <div class="flex h-dvh flex-col bg-canvas text-neutral-100">
      <header class="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div class="flex items-center gap-2">
          <span class="grid size-8 place-items-center rounded-lg bg-white text-neutral-950">
            <Mic size={16} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <h1 class="text-lg font-extrabold tracking-tight">Karaokê</h1>
        </div>
        {status === 'ready' && (
          <span class="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-neutral-400">
            <span class={`size-1.5 rounded-full ${bridge.tvOnline.value ? 'bg-white' : 'bg-neutral-600'}`} aria-hidden="true" />
            {bridge.tvOnline.value ? 'TV conectada' : 'TV desligada'}
          </span>
        )}
      </header>

      {status !== 'ready' ? (
        <StatusScreen status={status} />
      ) : (
        <>
          <main class="flex min-h-0 flex-1 flex-col px-4 pt-4">
            {tab.value === 'search' && (
              <SearchPanel initialQuery={searchFor} autoSearch={!!searchFor} autoFocus={false} onAdd={setPending} />
            )}
            {tab.value === 'lists' && (
              <RemoteLists
                onAdd={setPending}
                onMissing={(song) => {
                  setSearchFor(`${song.artist} ${song.title}`);
                  tab.value = 'search';
                }}
              />
            )}
            {tab.value === 'queue' && snapshot && <RemoteQueue snapshot={snapshot} myUid={myUid} onRemove={bridge.sendRemove} />}
            {tab.value === 'history' && snapshot && <RemoteHistory items={snapshot.history} />}
          </main>

          <nav
            aria-label="Seções"
            class="grid shrink-0 grid-cols-4 border-t border-white/[0.06] bg-surface pb-[env(safe-area-inset-bottom)]"
          >
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab.value === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    if (id === 'search') setSearchFor(undefined);
                    tab.value = id;
                  }}
                  aria-current={active ? 'page' : undefined}
                  class={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                    active ? 'text-white' : 'text-neutral-500'
                  }`}
                >
                  <Icon size={21} strokeWidth={active ? 2.4 : 1.9} aria-hidden="true" />
                  {label}
                  {id === 'queue' && queueCount > 0 && (
                    <span class="absolute left-1/2 top-2 ml-2.5 min-w-4 rounded-full bg-white px-1 text-[10px] font-bold leading-4 text-neutral-950">
                      {queueCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </>
      )}

      {pending && <SingerModal video={pending} onClose={() => setPending(null)} onConfirm={(singer) => send(pending, singer)} />}
      <Toasts class="bottom-24" />
    </div>
  );
}

function StatusScreen({ status }: { status: RemoteStatus }) {
  const messages: Record<Exclude<RemoteStatus, 'ready'>, { title: string; body: string }> = {
    connecting: { title: 'Conectando à TV…', body: 'Só um instante.' },
    disabled: { title: 'Indisponível', body: 'O controle pelo celular ainda não foi configurado neste site.' },
    invalid: { title: 'Link inválido', body: 'Escaneie o QR Code da TV novamente.' },
    notfound: { title: 'TV não encontrada', body: 'Não foi possível conectar à TV. Escaneie o QR Code novamente.' },
    error: { title: 'Sem conexão', body: 'Verifique a internet do celular e recarregue a página.' },
  };
  const { title, body } = messages[status as Exclude<RemoteStatus, 'ready'>];
  return (
    <main class="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
      {status === 'connecting' && (
        <span class="mb-2 size-8 animate-spin rounded-full border-2 border-white/15 border-t-white" aria-hidden="true" />
      )}
      <h2 class="text-xl font-bold tracking-tight">{title}</h2>
      <p class="max-w-xs text-sm leading-relaxed text-neutral-400">{body}</p>
    </main>
  );
}
