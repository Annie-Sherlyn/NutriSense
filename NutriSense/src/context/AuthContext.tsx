import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth.service';
import { isFirebaseConfigured } from '../config/env';
import { initializeAuth } from '../lib/firebase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (email: string, pass: string, name: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  loginAsDemo: () => Promise<User>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. First, forcefully guarantee anonymous auth as per requirements
    initializeAuth()
      .then((fUser) => {
        const appUser: User = {
          id: fUser.uid,
          email: 'anonymous@nutrisense.app',
          displayName: 'Anonymous User',
          isAnonymous: true,
          isOnboarded: Boolean(localStorage.getItem('ns_profile')),
          createdAt: new Date().toISOString(),
        };
        setUser(appUser);
        setLoading(false);
        // Persist/touch into Supabase profiles
        import('../services/profile.service').then(({ profileService }) => {
          profileService.upsertProfile({ name: 'Anonymous User' });
        });
      })
      .catch((err) => {
        console.warn('Anonymous auth failed, falling back to Demo User', err);
        // Fallback to Demo User so the login screen is NEVER shown
        authService.loginAsDemo().then((demoUser) => {
          setUser(demoUser);
          setLoading(false);
          import('../services/profile.service').then(({ profileService }) => {
            profileService.upsertProfile({ name: demoUser.displayName || 'Demo User' });
          });
        });
      });
  }, []);

  const refreshUser = async () => {
    // No-op for now to preserve anonymous state
  };

  const login = async (email: string, pass: string) => {
    const logged = await authService.login(email, pass);
    setUser(logged);
    import('../services/profile.service').then(({ profileService }) => {
      profileService.upsertProfile({ name: logged.displayName || 'NutriSense User' });
    });
    return logged;
  };

  const register = async (email: string, pass: string, name: string) => {
    const registered = await authService.register(email, pass, name);
    setUser(registered);
    import('../services/profile.service').then(({ profileService }) => {
      profileService.upsertProfile({ name: name || registered.displayName || 'NutriSense User' });
    });
    return registered;
  };

  const loginWithGoogle = async () => {
    const logged = await authService.loginWithGoogle();
    setUser(logged);
    import('../services/profile.service').then(({ profileService }) => {
      profileService.upsertProfile({ name: logged.displayName || 'Google User' });
    });
    return logged;
  };

  const loginAsDemo = async () => {
    const demo = await authService.loginAsDemo();
    setUser(demo);
    import('../services/profile.service').then(({ profileService }) => {
      profileService.upsertProfile({ name: demo.displayName || 'Demo User' });
    });
    return demo;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const sendPasswordReset = async (email: string) => {
    await authService.sendPasswordReset(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoMode: !isFirebaseConfigured,
        login,
        register,
        loginWithGoogle,
        loginAsDemo,
        logout,
        sendPasswordReset,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
