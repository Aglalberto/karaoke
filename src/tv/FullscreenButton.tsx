import { Maximize, Minimize } from 'lucide-preact';
import { fullscreenSupported, isFullscreen, toggleFullscreen } from '../lib/fullscreen';

export function FullscreenButton() {
  if (!fullscreenSupported()) return null;
  const active = isFullscreen.value;
  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      aria-label={active ? 'Sair da tela cheia' : 'Tela cheia'}
      aria-keyshortcuts="F"
      title={active ? 'Sair da tela cheia (F)' : 'Tela cheia (F)'}
      class="ml-auto grid size-9 shrink-0 place-items-center rounded-lg text-neutral-500 transition hover:bg-white/[0.06] hover:text-white"
    >
      {active ? <Minimize size={20} aria-hidden="true" /> : <Maximize size={20} aria-hidden="true" />}
    </button>
  );
}
