import React from 'react';
import { motion } from 'framer-motion';

interface ScanLineProps {
  label?: string;
  className?: string;
}

export const ScanLine: React.FC<ScanLineProps> = ({
  label = 'Analyzing dish…',
  className = '',
}) => {
  return (
    <div className={`relative overflow-hidden rounded-3xl w-full h-full min-h-[220px] flex items-center justify-center bg-black/20 backdrop-blur-sm border border-brand-light/30 ${className}`}>
      {/* Moving scan beam */}
      <motion.div
        className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-dark to-transparent shadow-[0_0_15px_#5FBF95]"
        animate={{
          top: ['5%', '92%', '5%'],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1F5B4515_1px,transparent_1px),linear-gradient(to_bottom,#1F5B4515_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Center status pill */}
      <div className="relative z-10 flex items-center gap-2.5 px-4 py-2 rounded-full bg-surface-light/90 dark:bg-surface-dark/90 shadow-soft text-xs font-semibold text-brand-light dark:text-brand-dark tracking-wide">
        <span className="w-2 h-2 rounded-full bg-brand-light dark:bg-brand-dark animate-ping" />
        <span>{label}</span>
      </div>
    </div>
  );
};
