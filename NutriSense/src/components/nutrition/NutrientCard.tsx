import React from 'react';
import { Card } from '../common/Card';
import { NutriMote } from '../animations/NutriMote';
import { TOKENS, type MoteType } from '../../config/tokens';
import type { NutrientGap } from '../../types';

interface NutrientCardProps {
  gap: NutrientGap;
  onClick?: () => void;
  className?: string;
}

export const NutrientCard: React.FC<NutrientCardProps> = ({ gap, onClick, className = '' }) => {
  // Map nutrientKey to mote type
  let moteType: MoteType = 'protein';
  if (gap.nutrientKey === 'iron') moteType = 'iron';
  else if (gap.nutrientKey === 'calcium') moteType = 'calcium';
  else if (gap.nutrientKey === 'b12') moteType = 'b12';
  else if (gap.nutrientKey === 'fiber') moteType = 'fiber';
  else if (gap.nutrientKey === 'calories') moteType = 'energy';
  else if (gap.nutrientKey === 'hydration') moteType = 'hydration';

  const color =
    TOKENS.colors.nutrient[gap.nutrientKey as keyof typeof TOKENS.colors.nutrient] ||
    TOKENS.colors.nutrient.protein;

  return (
    <Card
      onClick={onClick}
      hoverEffect={Boolean(onClick)}
      padding="sm"
      className={`cursor-pointer transition-all flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <NutriMote
            type={moteType}
            mood={gap.percentage >= 100 ? 'celebrating' : 'idle'}
            size={28}
            progress={gap.percentage / 100}
          />
          <span className="text-xs font-bold text-ink-light dark:text-ink-dark truncate">
            {gap.nutrient}
          </span>
        </div>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {gap.percentage}%
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <span className="text-lg font-bold font-mono text-ink-light dark:text-ink-dark">
          {gap.consumed}
          <span className="text-xs font-normal text-ink-muted-light dark:text-ink-muted-dark ml-0.5">
            /{gap.target} {gap.unit}
          </span>
        </span>
        <span className="text-[10px] text-ink-muted-light dark:text-ink-muted-dark">
          {gap.percentage >= 100 ? 'Goal met' : `~${gap.remaining}${gap.unit} left`}
        </span>
      </div>

      {/* Mini progress line */}
      <div className="w-full h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] mt-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-base"
          style={{
            width: `${Math.min(100, gap.percentage)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </Card>
  );
};
