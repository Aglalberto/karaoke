import { signal } from '@preact/signals';
import type { Video } from '../lib/types';

export const singerFor = signal<Video | null>(null);

export interface ConfirmState {
  title: string;
  body?: string;
  confirmLabel: string;
  onConfirm: () => void;
}
export const confirmDialog = signal<ConfirmState | null>(null);

export const requestAdd = (video: Video) => {
  singerFor.value = video;
};

export const requestConfirm = (state: ConfirmState) => {
  confirmDialog.value = state;
};
