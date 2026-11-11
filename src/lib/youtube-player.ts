let apiPromise: Promise<typeof YT> | null = null;

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Carrega a YouTube IFrame Player API uma única vez. */
export function loadYouTubeApi(): Promise<typeof YT> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error('Não foi possível carregar o player do YouTube.'));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}
