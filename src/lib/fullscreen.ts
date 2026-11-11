import { signal } from '@preact/signals';

export const isFullscreen = signal(typeof document !== 'undefined' && !!document.fullscreenElement);

if (typeof document !== 'undefined') {
  document.addEventListener('fullscreenchange', () => {
    // Fullscreen do próprio player do YouTube não conta como fullscreen do site.
    isFullscreen.value = document.fullscreenElement === document.documentElement;
  });
}

export const fullscreenSupported = () =>
  typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;

export async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
  } catch {
    /* navegador recusou (ex.: sem gesto do usuário) */
  }
}
