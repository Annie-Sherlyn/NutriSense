import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth.service';
import { isFirebaseConfigured } from '../config/env';
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
    const unsubscribe = authService.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    const current = await authService.getCurrentUser();
    setUser(current);
  };

  const login = async (email: string, pass: string) => {
    const logged = await authService.login(email, pass);
    setUser(logged);
    return logged;
  };

  const register = async (email: string, pass: string, name: string) => {
    const registered = await authService.register(email, pass, name);
    setUser(registered);
    return registered;
  };

  const loginWithGoogle = async () => {
    const logged = await authService.loginWithGoogle();
    setUser(logged);
    return logged;
  };

  const loginAsDemo = async () => {
    const demo = await authService.loginAsDemo();
    setUser(demo);
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
