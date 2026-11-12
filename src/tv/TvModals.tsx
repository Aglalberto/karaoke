import { ConfirmModal } from '../components/ConfirmModal';
import { SingerModal } from '../components/SingerModal';
import { recentSingers } from '../lib/singers';
import { addToQueue, current, history, queue } from '../lib/state';
import { showToast } from '../lib/toast';
import { confirmDialog, singerFor } from './dialogs';

export function TvModals() {
  const video = singerFor.value;
  const confirm = confirmDialog.value;
  return (
    <>
      {video && (
        <SingerModal
          video={video}
          names={recentSingers({ current: current.value, queue: queue.value, history: history.value })}
          onClose={() => (singerFor.value = null)}
          onConfirm={(singer) => {
            const wasIdle = !current.value;
            const item = addToQueue(video, singer);
            singerFor.value = null;
            if (!item) return;
            if (wasIdle && current.value?.id === item.id) showToast(`Próximo(a) a cantar: ${singer.trim()}`);
            else showToast(`Adicionada à fila · ${queue.value.filter((i) => !i.standby).length}ª posição`);
          }}
        />
      )}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.onConfirm}
          onClose={() => (confirmDialog.value = null)}
        >
          {confirm.body}
        </ConfirmModal>
      )}
    </>
  );
}
