import React from 'react';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence: number; // 0 to 1
  showPercentage?: boolean;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  showPercentage = true,
  className = '',
}) => {
  const pct = Math.round(confidence * 100);

  if (confidence >= 0.8) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 select-none ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{showPercentage ? `${pct}% Confidence` : 'High confidence'}</span>
      </span>
    );
  }

  if (confidence >= 0.5) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 select-none ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{showPercentage ? `${pct}% Moderate` : 'Moderate estimate'}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20 select-none ${className}`}
    >
      <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{showPercentage ? `${pct}% Low` : 'Uncertain'}</span>
    </span>
  );
};
