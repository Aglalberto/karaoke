import type { Database } from 'firebase/database';
import { firebaseConfig } from '../config';

/**
 * Conexão com o Firebase (carregado sob demanda) usando login anônimo.
 *
 *   tvs/{tvId}/hostUid   uid anônimo da TV
 *   tvs/{tvId}/online    presença da TV
 *   tvs/{tvId}/inbox     pedidos dos celulares (add/remove)
 *   tvs/{tvId}/snapshot  cópia da fila publicada pela TV
 */
export type Fb = typeof import('firebase/database');

export interface Connection {
  fb: Fb;
  db: Database;
  uid: string;
}

let connection: Promise<Connection> | null = null;

export function connectFirebase(): Promise<Connection> {
  connection ??= (async () => {
    const [{ initializeApp, getApps }, authMod, dbMod] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/database'),
    ]);
    const app = getApps()[0] ?? initializeApp(firebaseConfig);
    const auth = authMod.getAuth(app);
    await auth.authStateReady();
    const user = auth.currentUser ?? (await authMod.signInAnonymously(auth)).user;
    return { fb: dbMod, db: dbMod.getDatabase(app), uid: user.uid };
  })();
  connection.catch(() => {
    connection = null;
  });
  return connection;
}
