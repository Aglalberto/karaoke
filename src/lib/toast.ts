import { signal } from '@preact/signals';

export interface Toast {
  id: number;
  message: string;
}

export const toasts = signal<Toast[]>([]);
let seq = 0;

export function showToast(message: string, durationMs = 3200) {
  const id = ++seq;
  toasts.value = [...toasts.value.slice(-2), { id, message }];
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, durationMs);
}
