import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HelpCircle, PlusCircle } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Tabs } from '../../components/common/Tabs';
import { RangeBar } from '../../components/nutrition/RangeBar';
import { ConfidenceBadge } from '../../components/common/ConfidenceBadge';
import { FoodImage } from '../../components/food/FoodImage';
import { Modal } from '../../components/common/Modal';
import { getPortionMultiplier, getPrepMultiplier } from '../../services/nutrition.service';
import type { Food, PortionSize, PreparationStyle } from '../../types';

export const NutritionEstimatePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as {
    food?: Food;
    quantity?: number;
    portion?: PortionSize;
    prepStyle?: PreparationStyle;
  } | null;

  const food = state?.food;
  const quantity = state?.quantity || 1;
  const portion = state?.portion || 'regular';
  const prepStyle = state?.prepStyle || 'normal';

  const [activeTab, setActiveTab] = useState<'macros' | 'micros'>('macros');
  const [basisUnit, setBasisUnit] = useState<'serving' | '100g'>('serving');
  const [isWhyRangeModalOpen, setIsWhyRangeModalOpen] = useState(false);

  if (!food) {
    navigate('/log');
    return null;
  }

  // Calculate adjusted ranges based on portion and prep
  const pMult = getPortionMultiplier(portion) * quantity;
  const prep = getPrepMultiplier(prepStyle);

  const rawMacros = basisUnit === 'serving' ? food.perServingMacros : food.per100gMacros;
  const rawMicros = basisUnit === 'serving' ? food.perServingMicros : food.per100gMicros;

  const mult = basisUnit === 'serving' ? pMult : 1;

  const adjustedCalories = {
    min: Math.round(rawMacros.calories.min * mult * prep.cal),
    max: Math.round(rawMacros.calories.max * mult * prep.cal),
    unit: 'kcal',
  };

  const adjustedProtein = {
    min: Math.round(rawMacros.protein.min * mult * 10) / 10,
    max: Math.round(rawMacros.protein.max * mult * 10) / 10,
    unit: 'g',
  };

  const adjustedCarbs = {
    min: Math.round(rawMacros.carbs.min * mult * 10) / 10,
    max: Math.round(rawMacros.carbs.max * mult * 10) / 10,
    unit: 'g',
  };

  const adjustedFat = {
    min: Math.round(rawMacros.fat.min * mult * prep.fat * 10) / 10,
    max: Math.round(rawMacros.fat.max * mult * prep.fat * 10) / 10,
    unit: 'g',
  };

  const adjustedFiber = {
    min: Math.round(rawMacros.fiber.min * mult * 10) / 10,
    max: Math.round(rawMacros.fiber.max * mult * 10) / 10,
    unit: 'g',
  };

  const adjustedIron = {
    min: Math.round(rawMicros.iron.min * mult * 10) / 10,
    max: Math.round(rawMicros.iron.max * mult * 10) / 10,
    unit: 'mg',
  };

  const adjustedCalcium = {
    min: Math.round(rawMicros.calcium.min * mult),
    max: Math.round(rawMicros.calcium.max * mult),
    unit: 'mg',
  };

  const adjustedB12 = {
    min: Math.round(rawMicros.b12.min * mult * 100) / 100,
    max: Math.round(rawMicros.b12.max * mult * 100) / 100,
    unit: 'mcg',
  };

  const handleProceedToSave = () => {
    navigate('/log/save', {
      state: {
        food,
        quantity,
        portion,
        prepStyle,
        macros: {
          calories: adjustedCalories,
          protein: adjustedProtein,
          carbs: adjustedCarbs,
          fat: adjustedFat,
          fiber: adjustedFiber,
        },
        micros: {
          iron: adjustedIron,
          calcium: adjustedCalcium,
          b12: adjustedB12,
        },
      },
    });
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Nutrition Estimate"
        subtitle="Estimated range reflecting cooking variations, portion size, and oil level."
        showBack
      />

      {/* Dish Summary Banner */}
      <Card padding="md" className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 flex-shrink-0">
          <FoodImage src={food.image} alt={food.name} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base sm:text-lg text-ink-light dark:text-ink-dark truncate">
              {quantity > 1 ? `${quantity}× ` : ''}
              {food.name}
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-ink-muted-light dark:text-ink-muted-dark capitalize">
              {portion} portion • {prepStyle.replace('-', ' ')}
            </span>
            <ConfidenceBadge confidence={0.92} showPercentage />
          </div>
        </div>
      </Card>

      {/* Basis Switcher & Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <Tabs
          tabs={[
            { id: 'macros', label: 'Macronutrients' },
            { id: 'micros', label: 'Micronutrients' },
          ]}
          activeTab={activeTab}
          onChange={(t) => setActiveTab(t as 'macros' | 'micros')}
        />

        {/* Per serving / Per 100g toggle */}
        <div className="flex items-center bg-surface-2-light dark:bg-surface-2-dark rounded-full p-1 border border-black/5 dark:border-white/5 text-xs font-semibold">
          <button
            onClick={() => setBasisUnit('serving')}
            className={`px-3 py-1 rounded-full transition-colors ${
              basisUnit === 'serving'
                ? 'bg-brand-light text-white dark:bg-brand-dark dark:text-ink-light'
                : 'text-ink-muted-light dark:text-ink-muted-dark hover:text-ink-light'
            }`}
          >
            Per serving
          </button>
          <button
            onClick={() => setBasisUnit('100g')}
            className={`px-3 py-1 rounded-full transition-colors ${
              basisUnit === '100g'
                ? 'bg-brand-light text-white dark:bg-brand-dark dark:text-ink-light'
                : 'text-ink-muted-light dark:text-ink-muted-dark hover:text-ink-light'
            }`}
          >
            Per 100g
          </button>
        </div>
      </div>

      {/* Estimated Ranges Card */}
      <Card padding="lg" className="flex flex-col gap-5">
        {activeTab === 'macros' ? (
          <>
            <RangeBar label="Calories" range={adjustedCalories} color="#F2B33D" maxScale={700} />
            <RangeBar label="Protein" range={adjustedProtein} color="#2E9E5B" maxScale={30} />
            <RangeBar label="Carbohydrates" range={adjustedCarbs} color="#F2B33D" maxScale={100} />
            <RangeBar label="Healthy Fats" range={adjustedFat} color="#7C8CF0" maxScale={35} />
            <RangeBar label="Dietary Fiber" range={adjustedFiber} color="#2F9E8F" maxScale={16} />
          </>
        ) : (
          <>
            <RangeBar label="Dietary Iron" range={adjustedIron} color="#E2582E" maxScale={8} />
            <RangeBar label="Calcium" range={adjustedCalcium} color="#2BB3CE" maxScale={400} />
            <RangeBar label="Vitamin B12" range={adjustedB12} color="#7B5CD6" maxScale={1.5} />
          </>
        )}

        {/* Basis Note & Why this is a range button */}
        <div className="pt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs text-ink-muted-light dark:text-ink-muted-dark">
          <span className="italic">
            Estimate based on typical Indian home/tiffin preparation and selected portion.
          </span>
          <button
            type="button"
            onClick={() => setIsWhyRangeModalOpen(true)}
            className="font-bold text-brand-light dark:text-brand-dark hover:underline flex items-center gap-1 flex-shrink-0 ml-2"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why a range?</span>
          </button>
        </div>
      </Card>

      {/* Action to Save */}
      <Button
        size="lg"
        fullWidth
        onClick={handleProceedToSave}
        leftIcon={<PlusCircle className="w-5 h-5" />}
      >
        Add to Log
      </Button>

      {/* Why is this a range Modal */}
      <Modal
        isOpen={isWhyRangeModalOpen}
        onClose={() => setIsWhyRangeModalOpen(false)}
        maxWidth="sm"
        title="Why does NutriSense show ranges?"
      >
        <div className="flex flex-col gap-3 py-2 text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark leading-relaxed">
          <p>
            Real-world Indian cooking is wonderfully diverse. A single masala dosa or katori of sambar varies by:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5 text-ink-light dark:text-ink-dark">
            <li>Quantity of ghee, groundnut, or sesame oil used in tempering</li>
            <li>Fermentation time and dal-to-rice proportion in the batter</li>
            <li>Restaurant tiffin density versus lighter homemade preparations</li>
            <li>Serving vessel volumes (katoris range from 120ml to 220ml)</li>
          </ul>
          <p>
            Claiming an exact figure like "421.3 calories" provides false precision. Range bands respect real-world biological and culinary variance.
          </p>
          <Button fullWidth size="sm" onClick={() => setIsWhyRangeModalOpen(false)} className="mt-2">
            Understood
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default NutritionEstimatePage;
