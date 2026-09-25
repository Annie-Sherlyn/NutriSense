import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'text' }) => {
  const variantStyles = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-2xl',
    card: 'h-48 w-full rounded-3xl',
  };

  return (
    <div
      className={`animate-pulse bg-black/[0.06] dark:bg-white/[0.08] ${variantStyles[variant]} ${className}`}
    />
  );
};
