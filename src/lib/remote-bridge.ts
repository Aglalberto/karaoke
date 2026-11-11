import { signal, type Signal } from '@preact/signals';
import { firebaseEnabled } from '../config';
import { connectFirebase, type Connection } from './firebase';
import { TV_ID_PATTERN } from './tv-id';
import { SINGER_MAX, type CurrentItem, type HistoryItem, type QueueItem, type Snapshot, type Video } from './types';

/** Lado do celular na ponte celular ↔ TV: lê a cópia da fila e envia pedidos. */

export type RemoteStatus = 'disabled' | 'invalid' | 'connecting' | 'ready' | 'notfound' | 'error';

export interface RemoteBridge {
  status: Signal<RemoteStatus>;
  snapshot: Signal<Snapshot | null>;
  tvOnline: Signal<boolean>;
  uid: Signal<string | null>;
  sendAdd: (video: Video, singer: string) => Promise<void>;
  sendRemove: (itemId: string) => Promise<void>;
}

function normalizeSnapshot(raw: unknown): Snapshot {
  const r = (raw ?? {}) as Partial<Record<keyof Snapshot, unknown>>;
  const list = <T,>(value: unknown): T[] =>
    Array.isArray(value) ? (value.filter(Boolean) as T[]) : value && typeof value === 'object' ? (Object.values(value) as T[]) : [];
  return {
    current: (r.current as CurrentItem | null) ?? null,
    queue: list<QueueItem>(r.queue).map((item) => ({ ...item, standby: item.standby === true })),
    history: list<HistoryItem>(r.history),
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : 0,
  };
}

export function createRemoteBridge(tvId: string): RemoteBridge {
  const status = signal<RemoteStatus>(
    !firebaseEnabled ? 'disabled' : TV_ID_PATTERN.test(tvId) ? 'connecting' : 'invalid',
  );
  const snapshot = signal<Snapshot | null>(null);
  const tvOnline = signal(false);
  const uid = signal<string | null>(null);

  let ready: Promise<Connection> | null = null;

  if (status.value === 'connecting') {
    ready = connectFirebase();
    ready
      .then(({ fb, db, uid: myUid }) => {
        uid.value = myUid;
        fb.onValue(
          fb.ref(db, `tvs/${tvId}/snapshot`),
          (snap) => {
            if (!snap.exists()) {
              status.value = 'notfound';
              return;
            }
            snapshot.value = normalizeSnapshot(snap.val());
            status.value = 'ready';
          },
          () => {
            status.value = 'error';
          },
        );
        fb.onValue(fb.ref(db, `tvs/${tvId}/online`), (snap) => {
          tvOnline.value = snap.val() === true;
        });
      })
      .catch((error) => {
        console.error('[karaoke] Firebase indisponível:', error);
        status.value = 'error';
      });
  }

  const send = async (payload: Record<string, unknown>) => {
    if (!ready) throw new Error('Sem conexão com a TV.');
    const { fb, db, uid: myUid } = await ready;
    await fb.push(fb.ref(db, `tvs/${tvId}/inbox`), { ...payload, uid: myUid, sentAt: fb.serverTimestamp() });
  };

  return {
    status,
    snapshot,
    tvOnline,
    uid,
    sendAdd: (video, singer) =>
      send({
        type: 'add',
        videoId: video.videoId,
        title: video.title.slice(0, 200),
        channel: video.channel.slice(0, 120),
        thumb: video.thumb.slice(0, 300),
        singer: singer.trim().slice(0, SINGER_MAX),
      }),
    sendRemove: (itemId) => send({ type: 'remove', itemId }),
  };
}
