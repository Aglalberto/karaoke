import { signal } from '@preact/signals';

export type MenuView =
  | { type: 'home' }
  | { type: 'search'; query?: string; autoSearch?: boolean }
  | { type: 'list'; id: string }
  | { type: 'history' };

export const menuOpen = signal(true);
export const menuView = signal<MenuView>({ type: 'home' });

/** Menu de opções de um cartão da fila (posicionado acima do cartão). */
export interface CardMenuState {
  itemId: string; // 'current' para o cartão "Tocando agora"
}
export const cardMenu = signal<CardMenuState | null>(null);

export function openMenuView(view: MenuView) {
  menuView.value = view;
  menuOpen.value = true;
}

export function goHome() {
  menuView.value = { type: 'home' };
}
