import { randomId } from './id';
import { loadString, saveString } from './storage';

const KEY = 'karaoke:tvId';
export const TV_ID_PATTERN = /^[A-Za-z0-9]{12,40}$/;

/** Identificador invisível deste navegador/TV, usado só dentro do QR Code. */
export function getTvId(): string {
  const saved = loadString(KEY);
  if (saved && TV_ID_PATTERN.test(saved)) return saved;
  return rotateTvId();
}

/** Gera um novo identificador (usado se o anterior não puder mais ser usado). */
export function rotateTvId(): string {
  const id = randomId(16);
  saveString(KEY, id);
  return id;
}
