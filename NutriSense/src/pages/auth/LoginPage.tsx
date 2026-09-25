import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { NutriMote } from '../../components/animations/NutriMote';
import { useAuth } from '../../context/AuthContext';
import { isFirebaseConfigured } from '../../config/env';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginAsDemo } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; action?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError({ message: 'Please enter both your email and password.' });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const appErr = err as { message?: string; action?: string };
      setError({
        message: appErr.message || 'Login failed. Please verify credentials.',
        action: appErr.action,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: unknown) {
      const appErr = err as { message?: string; action?: string };
      setError({
        message: appErr.message || 'Google sign-in was not completed.',
        action: appErr.action,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantDemo = async () => {
    setIsLoading(true);
    try {
      await loginAsDemo();
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-ink-light dark:text-ink-dark flex flex-col justify-center items-center p-4 sm:p-6 transition-colors">
      <div className="w-full max-w-md">
        {/* Logo and Greeting */}
        <div className="text-center mb-6">
          <Link to="/welcome" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-10 h-10 rounded-2xl bg-brand-light/10 dark:bg-brand-dark/15 flex items-center justify-center text-brand-light dark:text-brand-dark group-hover:scale-105 transition-transform">
              <NutriMote type="protein" mood="happy" size={30} />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-ink-light dark:text-ink-dark">
              NutriSense
            </span>
          </Link>
          <h2 className="font-display text-2xl font-bold text-ink-light dark:text-ink-dark">
            Welcome back
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mt-1">
            Log in to continue your personalized nutrition journey
          </p>
        </div>

        {/* 1-Tap Demo Banner for Judges */}
        <button
          type="button"
          onClick={handleInstantDemo}
          className="w-full flex items-center justify-between p-3.5 mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-left transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0" />
            <div>
              <span className="block text-xs font-bold text-ink-light dark:text-ink-dark">
                Evaluating as a Judge?
              </span>
              <span className="text-[11px] text-ink-muted-light dark:text-ink-muted-dark">
                Tap here to jump into Demo Mode instantly
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Card Form */}
        <Card padding="lg">
          {error && (
            <div className="p-3.5 mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{error.message}</p>
                {error.action && <p className="mt-0.5 opacity-90">{error.action}</p>}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3.5 text-ink-muted-light dark:text-ink-muted-dark pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface-2-light dark:bg-surface-2-dark border border-black/10 dark:border-white/10 text-sm text-ink-light dark:text-ink-dark placeholder:text-ink-muted-light dark:placeholder:text-ink-muted-dark focus:outline-none focus:ring-2 focus:ring-brand-light"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-light dark:text-brand-dark hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3.5 text-ink-muted-light dark:text-ink-muted-dark pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface-2-light dark:bg-surface-2-dark border border-black/10 dark:border-white/10 text-sm text-ink-light dark:text-ink-dark placeholder:text-ink-muted-light dark:placeholder:text-ink-muted-dark focus:outline-none focus:ring-2 focus:ring-brand-light"
                />
              </div>
            </div>

            <Button type="submit" isLoading={isLoading} fullWidth className="mt-2">
              Sign In
            </Button>
          </form>

          {/* Google Sign-in */}
          {isFirebaseConfigured && (
            <>
              <div className="relative my-5 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-black/[0.06] dark:border-white/[0.08]" />
                </div>
                <span className="relative px-3 bg-surface-light dark:bg-surface-dark text-xs text-ink-muted-light dark:text-ink-muted-dark">
                  or
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                isLoading={isLoading}
                fullWidth
              >
                Continue with Google
              </Button>
            </>
          )}

          {/* Footer switch */}
          <p className="text-center text-xs text-ink-muted-light dark:text-ink-muted-dark mt-6">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-brand-light dark:text-brand-dark hover:underline"
            >
              Create Account
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
