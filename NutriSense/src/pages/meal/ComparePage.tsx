import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, X, HelpCircle } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { FoodImage } from '../../components/food/FoodImage';
import { foodService } from '../../services/food.service';
import type { Food } from '../../types';

export const ComparePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const foodAId = searchParams.get('foodA') || 'food-idli';
  const foodBId = searchParams.get('foodB') || 'food-masala-dosa';

  const [foods, setFoods] = useState<Food[]>([]);
  const [availableFoods, setAvailableFoods] = useState<Food[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([foodAId, foodBId]);
  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);

  useEffect(() => {
    foodService.getAllFoods().then((all) => {
      setAvailableFoods(all);
      const selected = all.filter((f) => selectedIds.includes(f.id));
      setFoods(selected);
    });
  }, [selectedIds]);

  const addFoodToCompare = (id: string) => {
    if (selectedIds.length < 4 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removeFood = (id: string) => {
    if (selectedIds.length > 1) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Compare Food Choices"
        subtitle="Side-by-side nutrient ranges. NutriSense focuses on which dish aligns with your current target, not generic 'good vs bad' food labels."
        showBack
      />

      {/* Goal-Based Nutritional Assessment Banner */}
      <Card padding="md" className="border-l-4 border-l-brand-light dark:border-l-brand-dark bg-surface-2-light/50 dark:bg-surface-2-dark/50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-brand-light dark:text-brand-dark uppercase tracking-wider block mb-1">
              Goal-Based Alignment Analysis
            </span>
            <p className="text-sm font-semibold text-ink-light dark:text-ink-dark leading-relaxed">
              <strong>Idli with Sambar</strong> aligns more closely with today's remaining protein target (~7g protein for ~200 kcal) with minimal fat, whereas <strong>Masala Dosa</strong> offers similar protein (~8g) with higher estimated energy density (~375 kcal) due to roasted oil and spiced potato filling.
            </p>
          </div>
          <button
            onClick={() => setIsWhyModalOpen(true)}
            className="text-xs font-bold text-brand-light dark:text-brand-dark hover:underline flex items-center gap-1 flex-shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why this insight?</span>
          </button>
        </div>
      </Card>

      {/* Add additional food chip bar (up to 4) */}
      {selectedIds.length < 4 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark whitespace-nowrap">
            Add dish to compare:
          </span>
          {availableFoods
            .filter((f) => !selectedIds.includes(f.id))
            .slice(0, 5)
            .map((f) => (
              <button
                key={f.id}
                onClick={() => addFoodToCompare(f.id)}
                className="px-3 py-1 rounded-full text-xs font-medium bg-surface-2-light dark:bg-surface-2-dark border border-black/5 dark:border-white/5 hover:border-brand-light/50 flex items-center gap-1 whitespace-nowrap"
              >
                <Plus className="w-3 h-3" />
                <span>{f.name.split('(')[0]}</span>
              </button>
            ))}
        </div>
      )}

      {/* Side-by-Side Comparative Table / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {foods.map((food) => (
          <Card key={food.id} padding="md" className="flex flex-col justify-between relative">
            {selectedIds.length > 2 && (
              <button
                onClick={() => removeFood(food.id)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-ink-muted-light hover:text-ink-light"
                aria-label="Remove from comparison"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <div>
              <div className="w-full h-32 rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 mb-3">
                <FoodImage src={food.image} alt={food.name} className="w-full h-full object-cover" />
              </div>

              <h3 className="font-display font-bold text-base text-ink-light dark:text-ink-dark truncate">
                {food.name}
              </h3>
              <p className="text-xs font-mono text-ink-muted-light dark:text-ink-muted-dark mt-0.5">
                Typical price: ₹{food.typicalPrice}
              </p>

              {/* Comparative rows */}
              <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-black/[0.03] dark:border-white/[0.04]">
                  <span className="text-ink-muted-light dark:text-ink-muted-dark">Calories:</span>
                  <span className="font-bold">
                    ~{food.perServingMacros.calories.min}–{food.perServingMacros.calories.max} kcal
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-black/[0.03] dark:border-white/[0.04]">
                  <span className="text-ink-muted-light dark:text-ink-muted-dark">Protein:</span>
                  <span className="font-bold text-nutrient-protein">
                    ~{food.perServingMacros.protein.min}–{food.perServingMacros.protein.max}g
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-black/[0.03] dark:border-white/[0.04]">
                  <span className="text-ink-muted-light dark:text-ink-muted-dark">Carbs:</span>
                  <span>
                    ~{food.perServingMacros.carbs.min}–{food.perServingMacros.carbs.max}g
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-black/[0.03] dark:border-white/[0.04]">
                  <span className="text-ink-muted-light dark:text-ink-muted-dark">Fat:</span>
                  <span>
                    ~{food.perServingMacros.fat.min}–{food.perServingMacros.fat.max}g
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-black/[0.03] dark:border-white/[0.04]">
                  <span className="text-ink-muted-light dark:text-ink-muted-dark">Dietary Iron:</span>
                  <span className="font-bold text-nutrient-iron">
                    ~{food.perServingMicros.iron.min}–{food.perServingMicros.iron.max}mg
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-muted-light dark:text-ink-muted-dark">Calcium:</span>
                  <span className="font-bold text-nutrient-calcium">
                    ~{food.perServingMicros.calcium.min}–{food.perServingMicros.calcium.max}mg
                  </span>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              fullWidth
              onClick={() => navigate(`/log/portion?foodId=${food.id}`)}
              className="mt-4"
            >
              Choose This Dish
            </Button>
          </Card>
        ))}
      </div>

      {/* Why this insight Modal */}
      <Modal
        isOpen={isWhyModalOpen}
        onClose={() => setIsWhyModalOpen(false)}
        title="Why this comparative analysis?"
      >
        <div className="space-y-3 text-sm text-ink-light dark:text-ink-dark">
          <p>
            NutriSense evaluates foods based on your remaining daily gaps and active health goals according to ICMR-NIN standards.
          </p>
          <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
            • <strong>Steamed vs. Pan-fried:</strong> Steaming preserves micronutrients without adding cooking oil lipids.
          </p>
          <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
            • <strong>Bioavailability:</strong> Lentil fermentation in traditional South Indian batters lowers phytic acid, improving iron and zinc bioavailability.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ComparePage;
