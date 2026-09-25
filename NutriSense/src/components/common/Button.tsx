import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-full transition-all duration-base select-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-9 px-3.5 text-xs gap-1.5 min-w-[36px]',
    md: 'h-11 px-5 text-sm gap-2 min-h-[44px]',
    lg: 'h-13 px-6 py-3 text-base gap-2.5 min-h-[48px]',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-brand-light text-white hover:bg-brand-hover shadow-soft hover:shadow-soft-lg dark:bg-brand-dark dark:text-ink-light dark:hover:bg-[#74CCA5] focus:ring-brand-light',
    secondary:
      'bg-surface-2-light text-ink-light hover:bg-surface-2-light/80 dark:bg-surface-2-dark dark:text-ink-dark dark:hover:bg-surface-2-dark/85 border border-black/5 dark:border-white/5 focus:ring-brand-light',
    outline:
      'bg-transparent text-ink-light dark:text-ink-dark border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 focus:ring-brand-light',
    ghost:
      'bg-transparent text-ink-light dark:text-ink-dark hover:bg-black/5 dark:hover:bg-white/5 focus:ring-brand-light',
    danger:
      'bg-[#E2582E] text-white hover:bg-[#C94720] shadow-soft focus:ring-[#E2582E]',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};

interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
  variant?: 'ghost' | 'secondary' | 'outline' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  'aria-label': ariaLabel,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'w-9 h-9 min-w-[36px] min-h-[36px]',
    md: 'w-11 h-11 min-w-[44px] min-h-[44px]',
    lg: 'w-13 h-13 min-w-[48px] min-h-[48px]',
  };

  const variantStyles = {
    ghost: 'text-ink-light dark:text-ink-dark hover:bg-black/5 dark:hover:bg-white/5',
    secondary: 'bg-surface-2-light dark:bg-surface-2-dark text-ink-light dark:text-ink-dark shadow-soft',
    outline: 'border border-black/10 dark:border-white/15 text-ink-light dark:text-ink-dark',
    primary: 'bg-brand-light text-white dark:bg-brand-dark dark:text-ink-light shadow-soft',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      aria-label={ariaLabel}
      className={`rounded-full flex items-center justify-center transition-all duration-base select-none focus:outline-none focus:ring-2 focus:ring-brand-light ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon}
    </motion.button>
  );
};
