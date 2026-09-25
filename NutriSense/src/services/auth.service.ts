import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { isFirebaseConfigured } from '../config/env';
import { TOKENS } from '../config/tokens';
import type { User, AppError } from '../types';

export interface AuthService {
  login(email: string, password: string): Promise<User>;
  register(email: string, password: string, displayName: string): Promise<User>;
  loginWithGoogle(): Promise<User>;
  loginAsDemo(): Promise<User>;
  logout(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}

// Convert Firebase User to App User
function mapFirebaseUser(fUser: FirebaseUser): User {
  const profileRaw = localStorage.getItem(TOKENS.storageKeys.profile);
  const isOnboarded = Boolean(profileRaw);
  return {
    id: fUser.uid,
    email: fUser.email || '',
    displayName: fUser.displayName || fUser.email?.split('@')[0] || 'NutriSense Member',
    photoURL: fUser.photoURL || undefined,
    isAnonymous: fUser.isAnonymous,
    isOnboarded,
    createdAt: fUser.metadata.creationTime || new Date().toISOString(),
  };
}

// Friendly Firebase error mapping
function mapFirebaseError(error: unknown): AppError {
  const err = error as { code?: string; message?: string };
  const code = err.code || '';

  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return {
        code: 'UNAUTHORIZED',
        message: 'The password you entered is incorrect.',
        recoverable: true,
        action: 'Please recheck your password or click "Forgot Password".',
      };
    case 'auth/user-not-found':
      return {
        code: 'UNAUTHORIZED',
        message: 'No NutriSense account found with this email address.',
        recoverable: true,
        action: 'Check your email spelling or create a new account.',
      };
    case 'auth/email-already-in-use':
      return {
        code: 'UNAUTHORIZED',
        message: 'An account with this email address already exists.',
        recoverable: true,
        action: 'Log in with your existing password or reset it.',
      };
    case 'auth/weak-password':
      return {
        code: 'UNAUTHORIZED',
        message: 'The password is too short. Please use at least 6 characters.',
        recoverable: true,
        action: 'Choose a stronger password.',
      };
    case 'auth/too-many-requests':
      return {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Access temporarily blocked due to multiple failed login attempts.',
        recoverable: true,
        action: 'Please wait a few minutes or reset your password.',
      };
    case 'auth/network-request-failed':
      return {
        code: 'NETWORK',
        message: 'Network error connecting to authentication service.',
        recoverable: true,
        action: 'Check your internet connection and try again.',
      };
    default:
      return {
        code: 'UNKNOWN',
        message: err.message || 'Authentication error occurred.',
        recoverable: true,
        action: 'Please try again or use Demo Mode.',
      };
  }
}

// -------------------------------------------------------------
// Firebase Auth Service
// -------------------------------------------------------------
// TODO(BACKEND): Attach backend session verification or custom token verification if needed
class FirebaseAuthService implements AuthService {
  async login(email: string, password: string): Promise<User> {
    if (!auth) throw new Error('Firebase is not initialized');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return mapFirebaseUser(cred.user);
    } catch (e) {
      throw mapFirebaseError(e);
    }
  }

  async register(email: string, password: string, displayName: string): Promise<User> {
    if (!auth) throw new Error('Firebase is not initialized');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      return mapFirebaseUser({ ...cred.user, displayName });
    } catch (e) {
      throw mapFirebaseError(e);
    }
  }

  async loginWithGoogle(): Promise<User> {
    if (!auth) throw new Error('Firebase is not initialized');
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      return mapFirebaseUser(cred.user);
    } catch (e) {
      throw mapFirebaseError(e);
    }
  }

  async loginAsDemo(): Promise<User> {
    // Fallback demo user even when in Firebase mode
    const demoUser: User = {
      id: 'demo-guest-judge',
      email: 'judge.guest@nutrisense.demo',
      displayName: 'Guest Judge',
      isOnboarded: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(TOKENS.storageKeys.auth, JSON.stringify(demoUser));
    return demoUser;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(TOKENS.storageKeys.auth);
    if (auth) {
      await signOut(auth);
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    if (!auth) throw new Error('Firebase is not initialized');
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      throw mapFirebaseError(e);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (auth && auth.currentUser) {
      return mapFirebaseUser(auth.currentUser);
    }
    const raw = localStorage.getItem(TOKENS.storageKeys.auth);
    return raw ? JSON.parse(raw) : null;
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!auth) {
      const raw = localStorage.getItem(TOKENS.storageKeys.auth);
      callback(raw ? JSON.parse(raw) : null);
      return () => {};
    }
    return firebaseOnAuthStateChanged(auth, (fUser) => {
      if (fUser) {
        callback(mapFirebaseUser(fUser));
      } else {
        const raw = localStorage.getItem(TOKENS.storageKeys.auth);
        callback(raw ? JSON.parse(raw) : null);
      }
    });
  }
}

// -------------------------------------------------------------
// Demo Auth Service (Offline / Fallback)
// -------------------------------------------------------------
class DemoAuthService implements AuthService {
  private subscribers: Array<(user: User | null) => void> = [];

  private notify(user: User | null) {
    this.subscribers.forEach((cb) => cb(user));
  }

  async login(email: string): Promise<User> {
    const user: User = {
      id: `demo-${Date.now()}`,
      email: email.trim().toLowerCase(),
      displayName: email.split('@')[0] || 'NutriSense Member',
      isOnboarded: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(TOKENS.storageKeys.auth, JSON.stringify(user));
    this.notify(user);
    return user;
  }

  async register(email: string, _password: string, displayName: string): Promise<User> {
    const user: User = {
      id: `demo-${Date.now()}`,
      email: email.trim().toLowerCase(),
      displayName: displayName || 'NutriSense Explorer',
      isOnboarded: false,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(TOKENS.storageKeys.auth, JSON.stringify(user));
    this.notify(user);
    return user;
  }

  async loginWithGoogle(): Promise<User> {
    return this.loginAsDemo();
  }

  async loginAsDemo(): Promise<User> {
    const user: User = {
      id: 'demo-judge-session',
      email: 'judge@nutrisense.demo',
      displayName: 'Judge Evaluator',
      isOnboarded: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(TOKENS.storageKeys.auth, JSON.stringify(user));
    this.notify(user);
    return user;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(TOKENS.storageKeys.auth);
    this.notify(null);
  }

  async sendPasswordReset(_email: string): Promise<void> {
    return Promise.resolve();
  }

  async getCurrentUser(): Promise<User | null> {
    const raw = localStorage.getItem(TOKENS.storageKeys.auth);
    return raw ? JSON.parse(raw) : null;
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.subscribers.push(callback);
    this.getCurrentUser().then(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }
}

// Factory export
export const authService: AuthService = isFirebaseConfigured
  ? new FirebaseAuthService()
  : new DemoAuthService();
