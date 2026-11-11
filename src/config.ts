const env = import.meta.env;

const clean = (value: string | undefined) => (value ?? '').trim();

export const YT_API_KEY = clean(env.VITE_YT_API_KEY);
export const searchEnabled = YT_API_KEY.length > 0;

export const firebaseConfig = {
  apiKey: clean(env.VITE_FIREBASE_API_KEY),
  authDomain: clean(env.VITE_FIREBASE_AUTH_DOMAIN),
  databaseURL: clean(env.VITE_FIREBASE_DATABASE_URL),
  projectId: clean(env.VITE_FIREBASE_PROJECT_ID),
  appId: clean(env.VITE_FIREBASE_APP_ID),
};

export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId && firebaseConfig.appId,
);

/** URL pública do site (ex.: https://aglalberto.github.io/karaoke/). */
export const siteUrl = () => new URL(import.meta.env.BASE_URL, window.location.origin).href;
