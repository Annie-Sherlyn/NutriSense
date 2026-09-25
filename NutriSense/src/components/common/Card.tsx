import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'surface' | 'surface2' | 'glass' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'surface',
  padding = 'md',
  hoverEffect = false,
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    surface:
      'bg-surface-light dark:bg-surface-dark border border-black/[0.04] dark:border-white/[0.05] shadow-soft',
    surface2:
      'bg-surface-2-light dark:bg-surface-2-dark border border-black/[0.03] dark:border-white/[0.04]',
    glass: 'glass-panel shadow-soft',
    outline:
      'bg-transparent border border-black/10 dark:border-white/10 hover:border-brand-light/40',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3.5 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -3, transition: { duration: 0.2 } } : undefined}
      className={`rounded-3xl transition-shadow duration-base ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverEffect ? 'hover:shadow-soft-lg dark:hover:shadow-dark-lg' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
