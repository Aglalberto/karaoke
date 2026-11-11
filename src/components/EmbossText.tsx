import type { ComponentChildren } from 'preact';

/** Texto com efeito bevel and emboss (relevo) sobre o fundo escuro. */
export function EmbossText({ children, class: className = '' }: { children: ComponentChildren; class?: string }) {
  return <p class={`text-emboss select-none font-extrabold tracking-tight ${className}`}>{children}</p>;
}
