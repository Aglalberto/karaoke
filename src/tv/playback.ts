import { effect, signal } from '@preact/signals';
import { loadYouTubeApi } from '../lib/youtube-player';
import { current, finishCurrent, markStarted } from '../lib/state';
import { showToast } from '../lib/toast';
import { menuOpen, cardMenu } from './ui';

export const NEXT_UP_SECONDS = 8;

/** Tela "Agora é a vez de" ativa para o item atual. */
export const nextUp = signal<{ itemId: string; endsAt: number } | null>(null);
/** Estado do player do YouTube (YT.PlayerState) ou -2 enquanto não está pronto. */
export const playerState = signal<number>(-2);
export const playerError = signal<string | null>(null);

let player: YT.Player | null = null;
let ready = false;
let loadedVideoId: string | null = null;
let nextUpTimer: number | undefined;
let lastHandledId: string | null = current.value?.id ?? null; // ao recarregar, não repete a tela de vez
let started = false;

function cue(videoId: string) {
  if (!player || !ready) return;
  if (loadedVideoId === videoId) return;
  loadedVideoId = videoId;
  player.cueVideoById({ videoId });
}

function stop() {
  if (!player || !ready) return;
  loadedVideoId = null;
  player.stopVideo();
}

function clearNextUp() {
  window.clearTimeout(nextUpTimer);
  nextUp.value = null;
}

export function mountPlayer(element: HTMLElement) {
  if (started) return;
  started = true;
  loadYouTubeApi()
    .then((api) => {
      player = new api.Player(element, {
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          playsinline: 1,
          rel: 0,
          fs: 1,
          iv_load_policy: 3,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            ready = true;
            playerState.value = -1;
            const cur = current.value;
            if (cur) cue(cur.videoId);
          },
          onStateChange: (event) => {
            playerState.value = event.data;
            if (event.data === api.PlayerState.PLAYING) {
              clearNextUp();
              markStarted();
              menuOpen.value = false;
              cardMenu.value = null;
            } else if (event.data === api.PlayerState.ENDED) {
              loadedVideoId = null;
              finishCurrent('ended');
            }
          },
          onError: () => {
            loadedVideoId = null;
            showToast('Vídeo indisponível. Pulando para a próxima…');
            finishCurrent('error');
          },
        },
      });
    })
    .catch((error: Error) => {
      playerError.value = error.message;
    });
}

/** Reage à troca da música atual: mostra "Agora é a vez de" e carrega o vídeo pausado por trás. */
effect(() => {
  const cur = current.value;
  if (!cur) {
    lastHandledId = null;
    clearNextUp();
    stop();
    return;
  }
  if (cur.id === lastHandledId) return;
  lastHandledId = cur.id;
  cue(cur.videoId);
  window.clearTimeout(nextUpTimer);
  nextUp.value = { itemId: cur.id, endsAt: Date.now() + NEXT_UP_SECONDS * 1000 };
  nextUpTimer = window.setTimeout(() => {
    nextUp.value = null;
  }, NEXT_UP_SECONDS * 1000);
});

/** Começa agora (pula a contagem). */
export function startNow() {
  clearNextUp();
  const cur = current.value;
  if (!player || !ready || !cur) return;
  if (loadedVideoId !== cur.videoId) {
    loadedVideoId = cur.videoId;
    player.loadVideoById({ videoId: cur.videoId });
  } else {
    player.playVideo();
  }
}

export function togglePlay() {
  if (!current.value) return;
  if (nextUp.value) {
    startNow();
    return;
  }
  if (!player || !ready) return;
  const state = player.getPlayerState();
  if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) player.pauseVideo();
  else startNow();
}

export function skipCurrent() {
  loadedVideoId = null;
  finishCurrent('skipped');
}
