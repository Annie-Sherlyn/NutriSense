import React from 'react';
import { NutriMote } from '../animations/NutriMote';
import { Button } from './Button';
import type { MoteType } from '../../config/tokens';

interface EmptyStateProps {
  title: string;
  description: string;
  moteType?: MoteType;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  moteType = 'fiber',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-surface-2-light/50 dark:bg-surface-2-dark/40 border border-black/[0.04] dark:border-white/[0.04] ${className}`}
    >
      <div className="mb-4">
        <NutriMote type={moteType} mood="curious" size={54} />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink-light dark:text-ink-dark">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark max-w-sm mt-1 mb-5 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {actionLabel && onAction && (
          <Button onClick={onAction} size="sm">
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
