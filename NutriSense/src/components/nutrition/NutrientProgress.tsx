import React from 'react';
import { motion } from 'framer-motion';

interface NutrientProgressProps {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color?: string;
  projectedConsumed?: number; // For What-if preview
  showRemaining?: boolean;
  className?: string;
}

export const NutrientProgress: React.FC<NutrientProgressProps> = ({
  label,
  consumed,
  target,
  unit,
  color = '#2E9E5B',
  projectedConsumed,
  showRemaining = true,
  className = '',
}) => {
  const percentage = Math.min(150, Math.round((consumed / target) * 100));
  const remaining = Math.max(0, Math.round((target - consumed) * 10) / 10);

  const fillWidth = Math.min(100, (consumed / target) * 100);
  const projectedWidth = projectedConsumed
    ? Math.min(100, (projectedConsumed / target) * 100)
    : fillWidth;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-ink-light dark:text-ink-dark">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-ink-light dark:text-ink-dark">
            {consumed}
            <span className="text-ink-muted-light dark:text-ink-muted-dark font-normal">
              /{target} {unit}
            </span>
          </span>
          <span
            className="text-[11px] font-bold px-1.5 py-0.2 rounded-full"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress track */}
      <div className="relative w-full h-2.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
        {/* What-if projected bar (dashed / lighter) */}
        {projectedConsumed && projectedConsumed > consumed && (
          <motion.div
            initial={{ width: `${fillWidth}%` }}
            animate={{ width: `${projectedWidth}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute top-0 bottom-0 rounded-full opacity-50 bg-[repeating-linear-gradient(45deg,currentColor,currentColor_4px,transparent_4px,transparent_8px)]"
            style={{ color }}
          />
        )}

        {/* Current consumed bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${fillWidth}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute top-0 bottom-0 rounded-full shadow-sm"
          style={{ backgroundColor: color }}
        />
      </div>

      {showRemaining && (
        <div className="flex justify-between items-center text-[11px] text-ink-muted-light dark:text-ink-muted-dark">
          <span>{percentage >= 100 ? 'Target achieved ✓' : `~${remaining} ${unit} remaining`}</span>
          {projectedConsumed && projectedConsumed > consumed && (
            <span className="text-brand-light dark:text-brand-dark font-medium">
              +{Math.round((projectedConsumed - consumed) * 10) / 10} {unit} preview
            </span>
          )}
        </div>
      )}
    </div>
  );
};
