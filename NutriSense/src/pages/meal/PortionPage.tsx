import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { FoodImage } from '../../components/food/FoodImage';
import { PortionControl } from '../../components/food/PortionControl';
import { foodService } from '../../services/food.service';
import type { Food, PortionSize, PreparationStyle, DetectedPlateItem } from '../../types';

export const PortionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    capturedImage?: string;
    isMultiItem?: boolean;
    confirmedDishes?: DetectedPlateItem[];
  } | null;
  const capturedImage =
    state?.capturedImage ||
    sessionStorage.getItem('nutrisense_captured_image') ||
    '';

  const confirmedDishes = state?.confirmedDishes;
  const isMultiItem = Boolean(state?.isMultiItem && confirmedDishes && confirmedDishes.length > 1);
  const [activeDishIndex, setActiveDishIndex] = useState(0);

  const currentDishId = (isMultiItem && confirmedDishes ? confirmedDishes[activeDishIndex]?.id : null) || searchParams.get('foodId') || 'food-idli';
  const [food, setFood] = useState<Food | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [portion, setPortion] = useState<PortionSize>('regular');
  const [prepStyle, setPrepStyle] = useState<PreparationStyle>('normal');

  useEffect(() => {
    foodService.getNutrition(currentDishId).then((f) => {
      if (f) setFood(f);
    });
  }, [currentDishId]);

  const handleCalculate = () => {
    navigate('/log/nutrition', {
      state: {
        food,
        quantity,
        portion,
        prepStyle,
      },
    });
  };

  if (!food) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center text-xs text-ink-muted-light">
        Loading dish details…
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <PageHeader
        title={isMultiItem ? "Adjust Plate Portions" : "Adjust Portion & Style"}
        subtitle={
          isMultiItem
            ? `Configure portions for each dish on your plate (${activeDishIndex + 1} of ${confirmedDishes?.length}).`
            : "Specify serving size and preparation style for an accurate estimate."
        }
        showBack
      />

      {/* Multi-dish Switcher Chips */}
      {isMultiItem && confirmedDishes && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {confirmedDishes.map((dish, idx) => {
            const isActive = idx === activeDishIndex;
            return (
              <button
                key={dish.id + idx}
                type="button"
                onClick={() => setActiveDishIndex(idx)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-transparent shadow-sm'
                    : 'bg-surface-light dark:bg-surface-dark text-ink-muted-light dark:text-ink-muted-dark border-black/10 dark:border-white/10 hover:text-ink-light'
                }`}
              >
                <span>{dish.name.split(' (')[0]}</span>
                {dish.platePosition && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    isActive ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-ink-muted-light'
                  }`}>
                    {dish.platePosition}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Dish Header Card */}
      <Card padding="md" className="flex items-center gap-4">
        {/* Squared Outline Box for Dish / Uploaded Photo */}
        <div className="w-20 h-20 aspect-square rounded-2xl overflow-hidden bg-surface-2-light dark:bg-surface-2-dark flex-shrink-0 border-2 border-emerald-500/60 dark:border-emerald-400/60 p-0.5 shadow-sm">
          <div className="w-full h-full rounded-xl overflow-hidden relative">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt={food.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <FoodImage
                src={food.image}
                alt={food.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display font-bold text-lg text-ink-light dark:text-ink-dark truncate">
            {food.name}
          </h2>
          {food.regionalName && (
            <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
              {food.regionalName}
            </p>
          )}
          <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark mt-1">
            Standard: {food.servingDescription}
          </p>
        </div>
      </Card>

      {/* Portion Controls Component */}
      <Card padding="lg">
        <PortionControl
          quantity={quantity}
          onQuantityChange={setQuantity}
          portion={portion}
          onPortionChange={setPortion}
          prepStyle={prepStyle}
          onPrepStyleChange={setPrepStyle}
        />
      </Card>

      {/* Calculate CTA */}
      <div className="pt-2">
        <Button
          size="lg"
          fullWidth
          onClick={handleCalculate}
          rightIcon={<ChevronRight className="w-5 h-5" />}
        >
          Calculate Nutrition
        </Button>
      </div>
    </div>
  );
};

export default PortionPage;
