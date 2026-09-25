import React from 'react';
import type { NutritionRange } from '../../types';
import { ConfidenceBadge } from '../common/ConfidenceBadge';

interface RangeBarProps {
  label: string;
  range: NutritionRange;
  maxScale?: number;
  confidence?: number;
  color?: string;
  className?: string;
}

export const RangeBar: React.FC<RangeBarProps> = ({
  label,
  range,
  maxScale,
  confidence,
  color = '#1F5B45',
  className = '',
}) => {
  // If maxScale is not provided, estimate scale from range.max * 1.3
  const scale = maxScale || Math.max(range.max * 1.3, 10);
  const leftPct = Math.max(0, Math.min(100, (range.min / scale) * 100));
  const widthPct = Math.max(4, Math.min(100 - leftPct, ((range.max - range.min) / scale) * 100));
  const midPct = leftPct + widthPct / 2;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-ink-light dark:text-ink-dark">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium text-ink-muted-light dark:text-ink-muted-dark">
            {range.min}–{range.max} {range.unit}
          </span>
          {confidence !== undefined && (
            <ConfidenceBadge confidence={confidence} showPercentage={false} />
          )}
        </div>
      </div>

      {/* Uncertainty range track */}
      <div className="relative w-full h-3 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
        {/* Translucent uncertainty band */}
        <div
          className="absolute top-0 bottom-0 rounded-full transition-all duration-base opacity-40"
          style={{
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            backgroundColor: color,
          }}
        />

        {/* Expected midpoint marker */}
        <div
          className="absolute top-0 bottom-0 w-2.5 rounded-full transition-all duration-base shadow-sm -ml-1"
          style={{
            left: `${midPct}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};
