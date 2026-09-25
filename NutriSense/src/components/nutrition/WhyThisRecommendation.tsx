import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Reason } from '../../types';

interface WhyThisRecommendationProps {
  reasons: Reason[];
  whySummary?: string;
  className?: string;
}

export const WhyThisRecommendation: React.FC<WhyThisRecommendationProps> = ({
  reasons,
  whySummary,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const handleFieldClick = (profileField?: string) => {
    if (!profileField) return;
    navigate(`/profile/edit?field=${profileField}`);
  };

  return (
    <div
      className={`rounded-2xl bg-surface-2-light/60 dark:bg-surface-2-dark/50 border border-black/[0.04] dark:border-white/[0.05] p-3 text-xs ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between font-semibold text-brand-light dark:text-brand-dark hover:opacity-90 select-none text-left"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-light dark:bg-brand-dark" />
          <span>Why this recommendation?</span>
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-ink-muted-light dark:text-ink-muted-dark" />
        ) : (
          <ChevronDown className="w-4 h-4 text-ink-muted-light dark:text-ink-muted-dark" />
        )}
      </button>

      {whySummary && !isExpanded && (
        <p className="text-ink-muted-light dark:text-ink-muted-dark text-[11px] mt-1.5 leading-relaxed">
          {whySummary}
        </p>
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-2.5 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.06] flex flex-col gap-2"
          >
            {reasons.map((reason, idx) => (
              <motion.div
                key={reason.key || idx}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className="flex items-start justify-between gap-2 text-ink-light dark:text-ink-dark group"
              >
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span className="text-[11px] sm:text-xs leading-snug">{reason.label}</span>
                </div>

                {reason.profileField && (
                  <button
                    onClick={() => handleFieldClick(reason.profileField)}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-brand-light dark:text-brand-dark font-medium underline underline-offset-2 transition-opacity flex-shrink-0"
                    title={`Edit ${reason.profileField} in profile`}
                  >
                    <span>Edit</span>
                    <Edit3 className="w-2.5 h-2.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
