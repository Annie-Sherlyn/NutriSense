import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { ENV, isFirebaseConfigured } from './env';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    if (!getApps().length) {
      app = initializeApp({
        apiKey: ENV.FIREBASE_API_KEY,
        authDomain: ENV.FIREBASE_AUTH_DOMAIN,
        projectId: ENV.FIREBASE_PROJECT_ID,
        storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
        appId: ENV.FIREBASE_APP_ID,
      });
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
  } catch (error) {
    console.warn('Failed to initialize Firebase Auth, falling back to Demo Mode:', error);
  }
}

export { app, auth };
