import type { ComponentChildren } from 'preact';
import { Modal, btnGhost, btnPrimary } from './Modal';

interface ConfirmModalProps {
  title: string;
  children?: ComponentChildren;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({ title, children, confirmLabel, onConfirm, onClose }: ConfirmModalProps) {
  return (
    <Modal title={title} onClose={onClose} initialFocus="[data-confirm]">
      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-2">
          <h2 class="text-xl font-bold tracking-tight text-white">{title}</h2>
          {children && <div class="text-neutral-400">{children}</div>}
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" class={btnGhost} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            data-confirm
            class={btnPrimary}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
