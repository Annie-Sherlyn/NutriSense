import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User as UserIcon, Mail, Lock, AlertCircle, Check } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { NutriMote } from '../../components/animations/NutriMote';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMinLength = password.length >= 6;
  const hasNumber = /[0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (!hasMinLength) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await register(email, password, displayName);
      navigate('/onboarding');
    } catch (err: unknown) {
      const appErr = err as { message?: string };
      setError(appErr.message || 'Could not create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-ink-light dark:text-ink-dark flex flex-col justify-center items-center p-4 sm:p-6 transition-colors">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/welcome" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-10 h-10 rounded-2xl bg-brand-light/10 dark:bg-brand-dark/15 flex items-center justify-center text-brand-light dark:text-brand-dark group-hover:scale-105 transition-transform">
              <NutriMote type="iron" mood="happy" size={30} />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-ink-light dark:text-ink-dark">
              NutriSense
            </span>
          </Link>
          <h2 className="font-display text-2xl font-bold text-ink-light dark:text-ink-dark">
            Join NutriSense
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mt-1">
            Build mindful eating habits with explainable recommendations
          </p>
        </div>

        <Card padding="lg">
          {error && (
            <div className="p-3.5 mb-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 flex items-center gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 absolute left-3.5 text-ink-muted-light dark:text-ink-muted-dark pointer-events-none" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface-2-light dark:bg-surface-2-dark border border-black/10 dark:border-white/10 text-sm text-ink-light dark:text-ink-dark placeholder:text-ink-muted-light dark:placeholder:text-ink-muted-dark focus:outline-none focus:ring-2 focus:ring-brand-light"
                />
              </div>
            </div>

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
              <label className="block text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3.5 text-ink-muted-light dark:text-ink-muted-dark pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface-2-light dark:bg-surface-2-dark border border-black/10 dark:border-white/10 text-sm text-ink-light dark:text-ink-dark placeholder:text-ink-muted-light dark:placeholder:text-ink-muted-dark focus:outline-none focus:ring-2 focus:ring-brand-light"
                />
              </div>

              {/* Password hints */}
              {password && (
                <div className="flex items-center gap-3 mt-2 text-[11px] text-ink-muted-light dark:text-ink-muted-dark">
                  <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600' : ''}`}>
                    <Check className="w-3 h-3" /> 6+ chars
                  </span>
                  <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600' : ''}`}>
                    <Check className="w-3 h-3" /> number
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3.5 text-ink-muted-light dark:text-ink-muted-dark pointer-events-none" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface-2-light dark:bg-surface-2-dark border border-black/10 dark:border-white/10 text-sm text-ink-light dark:text-ink-dark placeholder:text-ink-muted-light dark:placeholder:text-ink-muted-dark focus:outline-none focus:ring-2 focus:ring-brand-light"
                />
              </div>
            </div>

            <Button type="submit" isLoading={isLoading} fullWidth className="mt-2">
              Create Account
            </Button>
          </form>

          <p className="text-center text-xs text-ink-muted-light dark:text-ink-muted-dark mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-brand-light dark:text-brand-dark hover:underline"
            >
              Sign In
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
