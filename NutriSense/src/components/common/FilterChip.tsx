import React from 'react';
import { motion } from 'framer-motion';

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  count?: number;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isSelected,
  onClick,
  icon,
  count,
  className = '',
}) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-fast select-none focus:outline-none focus:ring-2 focus:ring-brand-light ${
        isSelected
          ? 'bg-brand-light text-white shadow-soft dark:bg-brand-dark dark:text-ink-light'
          : 'bg-surface-2-light dark:bg-surface-2-dark text-ink-light dark:text-ink-dark border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/10'
      } ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            isSelected ? 'bg-white/25 text-white' : 'bg-black/10 dark:bg-white/10'
          }`}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
};
