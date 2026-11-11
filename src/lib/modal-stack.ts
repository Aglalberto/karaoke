import { signal } from '@preact/signals';

/** Quantidade de pop-ups abertos (o atalho de espaço não age enquanto houver algum). */
export const openModals = signal(0);
