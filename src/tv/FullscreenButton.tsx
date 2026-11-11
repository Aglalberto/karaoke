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
      title={active ? 'Sair da tela cheia' : 'Tela cheia'}
      class="absolute right-3 top-3 z-20 grid size-10 place-items-center rounded-xl text-neutral-500 transition hover:bg-white/[0.06] hover:text-white"
    >
      {active ? <Minimize size={20} aria-hidden="true" /> : <Maximize size={20} aria-hidden="true" />}
    </button>
  );
}
