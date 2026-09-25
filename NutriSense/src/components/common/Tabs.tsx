import React from 'react';
import { motion } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'pill' | 'underline';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'pill',
}) => {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1.5 p-1 rounded-full ${
        variant === 'pill'
          ? 'bg-surface-2-light dark:bg-surface-2-dark border border-black/[0.04] dark:border-white/[0.05]'
          : 'border-b border-black/10 dark:border-white/10'
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition-colors duration-fast select-none focus:outline-none focus:ring-2 focus:ring-brand-light ${
              isActive
                ? 'text-white dark:text-ink-light'
                : 'text-ink-muted-light dark:text-ink-muted-dark hover:text-ink-light dark:hover:text-ink-dark'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-brand-light dark:bg-brand-dark rounded-full shadow-soft"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};
