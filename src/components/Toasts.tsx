import { toasts } from '../lib/toast';

export function Toasts({ class: className = 'bottom-32' }: { class?: string }) {
  if (toasts.value.length === 0) return null;
  return (
    <div
      class={`pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      {toasts.value.map((toast) => (
        <div
          key={toast.id}
          class="animate-pop-in rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 shadow-xl shadow-black/50"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
