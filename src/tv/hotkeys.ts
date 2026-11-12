import { toggleFullscreen } from '../lib/fullscreen';
import { openModals } from '../lib/modal-stack';
import { togglePlay } from './playback';
import { cardMenu, goHome, menuView } from './ui';

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
};

function onKeyDown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

  if (event.key === 'Escape') {
    if (openModals.value > 0) return; // o pop-up cuida do próprio Esc
    if (cardMenu.value) {
      cardMenu.value = null;
      event.preventDefault();
    } else if (menuView.value.type !== 'home' && !isTypingTarget(event.target)) {
      goHome();
      event.preventDefault();
    }
    return;
  }

  if ((event.key === 'f' || event.key === 'F') && !event.repeat) {
    if (openModals.value > 0 || isTypingTarget(event.target)) return;
    event.preventDefault();
    void toggleFullscreen();
    return;
  }

  if (event.code === 'Space' || event.key === ' ') {
    if (openModals.value > 0 || isTypingTarget(event.target)) return;
    event.preventDefault(); // evita acionar o botão focado ou rolar
    cardMenu.value = null;
    togglePlay();
  }
}

export function installHotkeys() {
  document.addEventListener('keydown', onKeyDown);
  return () => document.removeEventListener('keydown', onKeyDown);
}
