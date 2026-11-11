import { effect, signal } from '@preact/signals';
import type { Database } from 'firebase/database';
import { firebaseEnabled } from '../config';
import { connectFirebase, type Fb } from './firebase';
import { addToQueue, current, getSnapshot, history, queue, removeOwnedFromQueue } from './state';
import { getTvId, rotateTvId } from './tv-id';
import { SINGER_MAX, isVideoId, thumbFor, type Video } from './types';

/**
 * Lado da TV na ponte celular ↔ TV.
 * A fila "oficial" vive no localStorage da TV; o Firebase só leva pedidos (inbox)
 * e uma cópia somente leitura da fila (snapshot) para os celulares.
 */

const REQUEST_MAX_AGE = 12 * 60 * 60 * 1000;

export type HostStatus = 'disabled' | 'connecting' | 'ready' | 'error';
export const hostStatus = signal<HostStatus>(firebaseEnabled ? 'connecting' : 'disabled');
export const hostTvId = signal<string>(getTvId());

async function claim(fb: Fb, db: Database, tvId: string, uid: string): Promise<boolean> {
  const hostRef = fb.ref(db, `tvs/${tvId}/hostUid`);
  const existing = await fb.get(hostRef);
  if (existing.exists()) return existing.val() === uid;
  await fb.set(hostRef, uid);
  return true;
}

const str = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

function handleRequest(raw: unknown) {
  if (!raw || typeof raw !== 'object') return;
  const req = raw as Record<string, unknown>;
  const uid = str(req.uid, 128);
  if (!uid) return;
  if (typeof req.sentAt === 'number' && Date.now() - req.sentAt > REQUEST_MAX_AGE) return;

  if (req.type === 'add') {
    const singer = str(req.singer, SINGER_MAX);
    if (!isVideoId(req.videoId) || !singer) return;
    const thumb = str(req.thumb, 300);
    const video: Video = {
      videoId: req.videoId,
      title: str(req.title, 200) || 'Música',
      channel: str(req.channel, 120),
      thumb: thumb.startsWith('https://i.ytimg.com/') ? thumb : thumbFor(req.videoId),
    };
    addToQueue(video, singer, uid);
  } else if (req.type === 'remove') {
    const itemId = str(req.itemId, 40);
    if (itemId) removeOwnedFromQueue(itemId, uid);
  }
}

let hostStarted = false;

export async function startHostBridge() {
  if (!firebaseEnabled || hostStarted) return;
  hostStarted = true;
  try {
    const { fb, db, uid } = await connectFirebase();

    let tvId = hostTvId.value;
    if (!(await claim(fb, db, tvId, uid))) {
      // O navegador perdeu a identidade anônima antiga: gera um novo QR.
      tvId = rotateTvId();
      if (!(await claim(fb, db, tvId, uid))) throw new Error('Não foi possível registrar esta TV.');
      hostTvId.value = tvId;
    }
    const base = `tvs/${tvId}`;

    // Presença: o celular sabe se a TV está aberta.
    const onlineRef = fb.ref(db, `${base}/online`);
    fb.onValue(fb.ref(db, '.info/connected'), (snap) => {
      if (snap.val() !== true) return;
      fb.onDisconnect(onlineRef)
        .remove()
        .then(() => fb.set(onlineRef, true))
        .catch(() => undefined);
    });

    // Pedidos dos celulares.
    fb.onChildAdded(fb.ref(db, `${base}/inbox`), (snap) => {
      handleRequest(snap.val());
      fb.remove(snap.ref).catch(() => undefined);
    });

    // Cópia da fila para os celulares.
    const snapshotRef = fb.ref(db, `${base}/snapshot`);
    let timer: number | undefined;
    effect(() => {
      // Lê os sinais para reagir a qualquer mudança da fila.
      void current.value;
      void queue.value;
      void history.value;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        fb.set(snapshotRef, JSON.parse(JSON.stringify(getSnapshot()))).catch(() => undefined);
      }, 250);
    });

    hostStatus.value = 'ready';
  } catch (error) {
    console.error('[karaoke] Firebase indisponível:', error);
    hostStatus.value = 'error';
  }
}

