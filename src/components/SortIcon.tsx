import { ArrowUpDown } from 'lucide-preact';

/**
 * Ícone do botão de ordenar a fila. Isolado aqui para facilitar a troca
 * pelo ícone definitivo (ex.: SVG do Flaticon, com a devida atribuição).
 */
export function SortIcon({ size = 16 }: { size?: number }) {
  return <ArrowUpDown size={size} strokeWidth={2} aria-hidden="true" />;
}
