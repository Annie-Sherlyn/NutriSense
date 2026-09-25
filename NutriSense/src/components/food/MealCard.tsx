import React from 'react';
import { Trash2, Sliders } from 'lucide-react';
import { Card } from '../common/Card';
import { FoodImage } from './FoodImage';
import { Badge } from '../common/Badge';
import { IconButton } from '../common/Button';
import type { Meal } from '../../types';

interface MealCardProps {
  meal: Meal;
  onEditPortion: (meal: Meal) => void;
  onDelete: (mealId: string) => void;
  className?: string;
}

export const MealCard: React.FC<MealCardProps> = ({
  meal,
  onEditPortion,
  onDelete,
  className = '',
}) => {
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const mealTypeVariants = {
    breakfast: 'accent',
    lunch: 'protein',
    snack: 'brand',
    dinner: 'calcium',
  } as const;

  return (
    <Card padding="md" className={`flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Badge
            variant={mealTypeVariants[meal.mealType] || 'neutral'}
            className="capitalize font-bold"
          >
            {meal.mealType}
          </Badge>
          <span className="text-xs text-ink-muted-light dark:text-ink-muted-dark font-mono">
            {formatTime(meal.loggedAt)}
          </span>
          <span className="text-[11px] text-ink-muted-light dark:text-ink-muted-dark capitalize px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5">
            via {meal.inputMethod}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <IconButton
            icon={<Sliders className="w-4 h-4" />}
            aria-label="Change portion"
            size="sm"
            onClick={() => onEditPortion(meal)}
            title="Change portion size"
          />
          <IconButton
            icon={<Trash2 className="w-4 h-4 text-rose-500" />}
            aria-label="Delete meal"
            size="sm"
            onClick={() => onDelete(meal.id)}
            title="Delete meal"
          />
        </div>
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-3 py-3">
        {meal.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-2-light dark:bg-surface-2-dark flex-shrink-0">
              <FoodImage src={item.image} alt={item.foodName} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between">
                <h4 className="text-sm font-semibold text-ink-light dark:text-ink-dark truncate">
                  {item.quantity > 1 ? `${item.quantity}× ` : ''}
                  {item.foodName}
                </h4>
              </div>
              <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark mt-0.5">
                <span className="capitalize">{item.portion}</span> portion •{' '}
                <span className="capitalize">{item.preparationStyle.replace('-', ' ')}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Totals */}
      <div className="flex items-center justify-between pt-3 border-t border-black/[0.04] dark:border-white/[0.06] text-xs font-mono">
        <span className="text-ink-muted-light dark:text-ink-muted-dark">
          Total: ~{meal.totalMacros.calories.min}–{meal.totalMacros.calories.max} kcal
        </span>
        <span className="text-nutrient-protein font-semibold">
          ~{meal.totalMacros.protein.min}–{meal.totalMacros.protein.max}g Protein
        </span>
      </div>
    </Card>
  );
};
