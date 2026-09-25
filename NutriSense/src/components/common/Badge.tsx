import React from 'react';

interface BadgeProps {
  variant?: 'neutral' | 'brand' | 'accent' | 'protein' | 'iron' | 'calcium' | 'b12' | 'fiber' | 'success' | 'warning';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  icon,
  children,
  className = '',
}) => {
  const variantStyles = {
    neutral:
      'bg-black/5 dark:bg-white/10 text-ink-muted-light dark:text-ink-muted-dark border border-black/5 dark:border-white/5',
    brand:
      'bg-brand-light/10 dark:bg-brand-dark/15 text-brand-light dark:text-brand-dark border border-brand-light/20',
    accent:
      'bg-accent-amber/15 text-[#9A6208] dark:text-accent-amber border border-accent-amber/30',
    protein:
      'bg-nutrient-protein/10 text-nutrient-protein border border-nutrient-protein/20',
    iron:
      'bg-nutrient-iron/10 text-nutrient-iron border border-nutrient-iron/20',
    calcium:
      'bg-nutrient-calcium/10 text-nutrient-calcium border border-nutrient-calcium/20',
    b12:
      'bg-nutrient-b12/10 text-nutrient-b12 border border-nutrient-b12/20',
    fiber:
      'bg-nutrient-fiber/10 text-nutrient-fiber border border-nutrient-fiber/20',
    success:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    warning:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 font-medium gap-1',
    md: 'text-xs px-3 py-1 font-medium gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
