import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import type { AppError } from '../../types';

interface ErrorStateProps {
  error?: AppError | Error | null;
  title?: string;
  message?: string;
  actionLabel?: string;
  onRetry?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title = 'Something went wrong',
  message,
  actionLabel = 'Try again',
  onRetry,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  const displayMessage =
    message ||
    (error && 'message' in error ? error.message : 'An unexpected error occurred. Please try again.');

  const recoveryAction =
    error && 'action' in error && (error as AppError).action ? (error as AppError).action : undefined;

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="font-display text-lg font-bold text-ink-light dark:text-ink-dark">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark max-w-sm mt-1 mb-2 leading-relaxed">
        {displayMessage}
      </p>
      {recoveryAction && (
        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-4">
          {recoveryAction}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button onClick={onSecondaryAction} variant="outline" size="sm">
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
