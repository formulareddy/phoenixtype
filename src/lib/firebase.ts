import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, browserLocalPersistence, browserSessionPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasEnv = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);

export const app = hasEnv
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0])
  : null;

export const auth = hasEnv ? getAuth(app!) : null;
export const db = hasEnv ? getFirestore(app!) : null;

export const googleProvider = hasEnv ? new GoogleAuthProvider() : null;
export const githubProvider = hasEnv ? new GithubAuthProvider() : null;

export async function setFirebasePersistence(rememberMe: boolean) {
  if (!auth) return;
  await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
}

export function isAuthAvailable() {
  return auth !== null;
}
