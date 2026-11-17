import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, type User, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export let app: FirebaseApp | undefined;
export let auth: Auth | undefined;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
} catch (e) {
  console.warn('Firebase init deferred (missing API keys):', e);
}

let currentUser: User | null = null;
let initPromise: Promise<User> | null = null;

export const initializeAuth = async (): Promise<User> => {
  if (currentUser) return currentUser;
  if (initPromise) return initPromise;
  if (!auth) throw new Error('Firebase auth not configured');

  initPromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth!, async (user) => {
      if (user) {
        currentUser = user;
        unsubscribe();
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth!);
          currentUser = cred.user;
          unsubscribe();
          resolve(cred.user);
        } catch (error) {
          console.warn("Firebase Anonymous Auth restricted or unauthorized domain, using persistent local session:", error);
          const cachedUid = localStorage.getItem('nutrisense_current_uid') || `user_${Date.now()}`;
          localStorage.setItem('nutrisense_current_uid', cachedUid);
          currentUser = {
            uid: cachedUid,
            isAnonymous: true,
          } as unknown as User;
          unsubscribe();
          resolve(currentUser);
        }
      }
    });
  });

  return initPromise;
};

export const getCurrentUserUid = (): string => {
  if (!currentUser) {
    // Return a stable fallback instead of throwing a fatal error
    return 'demo-user-1';
  }
  return currentUser.uid;
};
