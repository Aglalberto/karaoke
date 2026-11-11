import { useEffect, useRef, useState } from 'preact/hooks';
import { EmbossText } from '../components/EmbossText';
import { current } from '../lib/state';
import { FullscreenButton } from './FullscreenButton';
import { NEXT_UP_SECONDS, mountPlayer, nextUp, playerError, playerState, startNow } from './playback';

export function Stage() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // O player do YouTube substitui este elemento por um iframe; o Preact nunca mexe nele.
    const target = document.createElement('div');
    host.current?.appendChild(target);
    mountPlayer(target);
  }, []);

  const cur = current.value;
  const showingNextUp = !!cur && !!nextUp.value;
  const waitingPlay = !!cur && !showingNextUp && cur.startedAt === null && playerState.value !== 1 && playerState.value !== 3;

  return (
    <main class="stage-glow relative min-h-0 flex-1 px-6 pb-5 pt-14">
      <FullscreenButton />
      <div class="stage-box grid h-full w-full place-items-center">
        <div class="video-frame relative overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/70 ring-1 ring-white/[0.06]">
          <div ref={host} class={`absolute inset-0 [&>iframe]:size-full ${cur ? '' : 'invisible'}`} />

          {!cur && (
            <div class="stage-glow absolute inset-0 grid place-items-center px-10 text-center">
              <EmbossText class="text-[clamp(1.75rem,4.4cqw,4.25rem)] leading-[1.15]">
                Fila vazia.
                <br />
                Adicione músicas para cantar.
              </EmbossText>
            </div>
          )}

          {cur && showingNextUp && <NextUp key={cur.id} />}

          {waitingPlay && (
            <div class="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
              <span class="animate-fade-in rounded-full bg-black/75 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 backdrop-blur">
                Aperte play ou espaço para começar
              </span>
            </div>
          )}

          {playerError.value && cur && (
            <div class="absolute inset-0 grid place-items-center bg-black/90 p-8 text-center text-neutral-400">
              {playerError.value}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function NextUp() {
  const cur = current.value!;
  const endsAt = nextUp.value?.endsAt ?? Date.now();
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    }, 200);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  const radius = 26;
  const length = 2 * Math.PI * radius;
  const elapsedMs = NEXT_UP_SECONDS * 1000 - Math.max(0, endsAt - Date.now());

  return (
    <div class="animate-fade-in absolute inset-0 z-10 flex flex-col items-center justify-center gap-[2.2cqh] bg-[#0b0b0b] px-10 text-center">
      <p class="text-[clamp(0.75rem,1.3cqw,1rem)] font-semibold uppercase tracking-[0.35em] text-neutral-500">Agora é a vez de</p>
      <h2 class="max-w-full truncate pb-[0.08em] text-[clamp(2.5rem,9cqw,8.5rem)] font-extrabold leading-none tracking-tight text-white">
        {cur.singer}
      </h2>
      <p class="max-w-[85%] truncate text-[clamp(1rem,2.1cqw,1.75rem)] text-neutral-400">
        <span class="font-semibold text-neutral-200">{cur.title}</span>
        {cur.channel ? ` — ${cur.channel}` : ''}
      </p>

      <div class="relative mt-[1.5cqh] grid size-16 place-items-center">
        <svg viewBox="0 0 64 64" class="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="rgb(255 255 255 / 0.1)" stroke-width="3" />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="white"
            stroke-width="3"
            stroke-linecap="round"
            stroke-dasharray={length}
            stroke-dashoffset={0}
            class="countdown-ring"
            style={{
              '--ring-length': `${length}px`,
              animationDuration: `${NEXT_UP_SECONDS * 1000}ms`,
              animationDelay: `-${elapsedMs}ms`,
            }}
          />
        </svg>
        <span class="text-xl font-bold tabular-nums text-white" aria-live="polite">
          {remaining}
        </span>
      </div>

      <button
        type="button"
        onClick={startNow}
        class="mt-[0.5cqh] rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-neutral-200 transition hover:border-white hover:bg-white hover:text-neutral-950"
      >
        Começar agora <span class="font-normal text-neutral-500">(espaço)</span>
      </button>
    </div>
  );
}
