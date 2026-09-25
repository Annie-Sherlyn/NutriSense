import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { NutriMote } from '../../components/animations/NutriMote';
import { useAuth } from '../../context/AuthContext';

export const ForgotPasswordPage: React.FC = () => {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setIsSent(true);
    } catch (err: unknown) {
      const appErr = err as { message?: string };
      setError(appErr.message || 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-ink-light dark:text-ink-dark flex flex-col justify-center items-center p-4 sm:p-6 transition-colors">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-10 h-10 rounded-2xl bg-brand-light/10 dark:bg-brand-dark/15 flex items-center justify-center text-brand-light dark:text-brand-dark">
              <NutriMote type="calcium" mood="curious" size={30} />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-ink-light dark:text-ink-dark">
              NutriSense
            </span>
          </Link>
          <h2 className="font-display text-2xl font-bold text-ink-light dark:text-ink-dark">
            Reset Password
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mt-1">
            We'll send password recovery instructions to your email
          </p>
        </div>

        <Card padding="lg">
          {isSent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink-light dark:text-ink-dark">
                Check your inbox
              </h3>
              <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mt-1 max-w-xs mx-auto leading-relaxed">
                If an account exists for <span className="font-semibold text-ink-light dark:text-ink-dark">{email}</span>, you will receive a reset link shortly.
              </p>
              <Link to="/login" className="inline-block mt-6">
                <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 text-xs font-semibold">
                  {error}
                </div>
              )}

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

              <Button type="submit" isLoading={isLoading} fullWidth className="mt-2">
                Send Reset Link
              </Button>

              <div className="text-center mt-2">
                <Link
                  to="/login"
                  className="text-xs font-medium text-ink-muted-light hover:text-ink-light dark:text-ink-muted-dark dark:hover:text-ink-dark"
                >
                  Remember your password? Sign in
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
