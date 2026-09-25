import React from 'react';
import { Card } from '../common/Card';
import { FoodImage } from './FoodImage';
import { Badge } from '../common/Badge';
import type { Food } from '../../types';

interface FoodCardProps {
  food: Food;
  onClick?: () => void;
  actionButton?: React.ReactNode;
  className?: string;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  food,
  onClick,
  actionButton,
  className = '',
}) => {
  return (
    <Card
      onClick={onClick}
      hoverEffect={Boolean(onClick)}
      padding="none"
      className={`overflow-hidden flex flex-col justify-between cursor-pointer group ${className}`}
    >
      <div className="relative w-full h-36 sm:h-40 bg-surface-2-light dark:bg-surface-2-dark overflow-hidden">
        <FoodImage
          src={food.image}
          alt={food.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <Badge
            variant={food.dietType === 'vegetarian' ? 'protein' : 'neutral'}
            className="backdrop-blur-md bg-white/90 dark:bg-black/70 shadow-sm"
          >
            {food.dietType === 'vegetarian' ? 'Veg' : food.dietType}
          </Badge>
        </div>
        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white font-mono text-xs font-semibold">
          ₹{food.typicalPrice}
        </div>
      </div>

      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <h3 className="font-display font-semibold text-sm sm:text-base text-ink-light dark:text-ink-dark line-clamp-1">
            {food.name}
          </h3>
          {food.regionalName && (
            <p className="text-[11px] text-ink-muted-light dark:text-ink-muted-dark mt-0.5 line-clamp-1">
              {food.regionalName}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 text-xs font-mono text-ink-muted-light dark:text-ink-muted-dark">
            <span>
              {food.perServingMacros.calories.min}–{food.perServingMacros.calories.max} kcal
            </span>
            <span>•</span>
            <span className="text-nutrient-protein font-semibold">
              ~{food.perServingMacros.protein.min}–{food.perServingMacros.protein.max}g prot
            </span>
          </div>
        </div>

        {actionButton && <div className="mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.05]">{actionButton}</div>}
      </div>
    </Card>
  );
};
