import { Play, Snowflake, Trash2 } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { ConfirmModal } from '../components/ConfirmModal';
import { showToast } from '../lib/toast';
import type { QueueItem, Snapshot } from '../lib/types';

interface RemoteQueueProps {
  snapshot: Snapshot;
  myUid: string | null;
  onRemove: (itemId: string) => Promise<void>;
}

export function RemoteQueue({ snapshot, myUid, onRemove }: RemoteQueueProps) {
  const [confirming, setConfirming] = useState<QueueItem | null>(null);
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const { current, queue } = snapshot;
  const visibleRemoving = new Set([...removing].filter((id) => queue.some((i) => i.id === id)));

  // Posição de cada música entre as que vão tocar (standby não conta).
  let active = 0;
  const rows = queue.map((item) => ({ item, position: item.standby ? null : ++active }));
  const mineNext = rows.find((r) => r.item.ownerUid === myUid && r.position !== null);
  const isMine = (item: QueueItem) => !!myUid && item.ownerUid === myUid;

  const remove = async (item: QueueItem) => {
    setRemoving((prev) => new Set(prev).add(item.id));
    try {
      await onRemove(item.id);
    } catch {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      showToast('Não foi possível excluir. Tente de novo.');
    }
  };

  return (
    <div class="scroll-thin -mx-4 min-h-0 flex-1 overflow-y-auto px-4 pb-4">
      {current ? (
        <div class="mb-4 flex items-center gap-3 rounded-2xl bg-white p-3 text-neutral-950">
          <span class="grid size-10 shrink-0 place-items-center rounded-full bg-neutral-950 text-white">
            <Play size={15} fill="currentColor" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
              {current.startedAt ? 'Tocando agora' : 'É a vez de'}
            </p>
            <p class="truncate font-bold leading-tight">
              {current.singer}
              {isMine(current) && <span class="ml-1.5 text-xs font-semibold text-neutral-500">(você)</span>}
            </p>
            <p class="truncate text-sm leading-tight text-neutral-600">{current.title}</p>
          </div>
        </div>
      ) : null}

      {mineNext && (
        <p class="mb-3 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-neutral-200">
          {mineNext.position === 1
            ? 'Você é a próxima a cantar!'
            : `Faltam ${(mineNext.position ?? 1) - 1 + (current ? 1 : 0)} músicas para a sua vez`}
        </p>
      )}

      <h2 class="px-1 pb-2 text-xl font-bold tracking-tight">Fila</h2>

      {queue.length === 0 ? (
        <p class="px-2 py-8 text-center text-sm text-neutral-500">Nenhuma música na fila. Adicione pela busca ou pelas listas.</p>
      ) : (
        <ol class="flex flex-col gap-1.5">
          {rows.map(({ item, position }) => {
            const mine = isMine(item);
            const busy = visibleRemoving.has(item.id);
            return (
              <li
                key={item.id}
                class={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                  mine ? 'border-white/20 bg-raised' : 'border-white/[0.04] bg-surface'
                } ${item.standby || busy ? 'opacity-55' : ''}`}
              >
                <span class="grid w-5 shrink-0 place-items-center text-sm font-bold tabular-nums text-neutral-500">
                  {position ?? <Snowflake size={14} aria-label="Standby" />}
                </span>
                <img src={item.thumb} alt="" loading="lazy" class="h-10 w-[71px] shrink-0 rounded-md bg-neutral-800 object-cover" />
                <div class="min-w-0 flex-1">
                  <p class="flex items-center gap-1.5 truncate font-semibold leading-tight text-white">
                    <span class="truncate">{item.singer}</span>
                    {mine && <span class="shrink-0 rounded bg-white px-1.5 text-[10px] font-bold uppercase leading-4 text-neutral-950">Você</span>}
                  </p>
                  <p class="truncate text-sm leading-tight text-neutral-400">
                    {busy ? 'Removendo…' : `${item.standby ? 'Standby · ' : ''}${item.title}`}
                  </p>
                </div>
                {mine && !busy && (
                  <button
                    type="button"
                    onClick={() => setConfirming(item)}
                    aria-label={`Excluir ${item.title} da fila`}
                    class="grid size-10 shrink-0 place-items-center rounded-full text-neutral-400 transition active:bg-white/10 active:text-white"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {confirming && (
        <ConfirmModal
          title="Excluir da fila?"
          confirmLabel="Excluir"
          onConfirm={() => remove(confirming)}
          onClose={() => setConfirming(null)}
        >
          {`${confirming.title} (${confirming.singer}) será removida da fila.`}
        </ConfirmModal>
      )}
    </div>
  );
}
