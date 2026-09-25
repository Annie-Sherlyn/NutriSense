import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, PlusCircle, Sparkles } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { NutrientProgress } from '../../components/nutrition/NutrientProgress';
import { MealCard } from '../../components/food/MealCard';
import { Modal } from '../../components/common/Modal';
import { PortionControl } from '../../components/food/PortionControl';
import { useApp } from '../../context/AppContext';
import { nutritionService, getPortionMultiplier, getPrepMultiplier } from '../../services/nutrition.service';
import type { Meal, PortionSize, PreparationStyle } from '../../types';

export const TodayPage: React.FC = () => {
  const navigate = useNavigate();
  const { todaySummary, refreshSummary } = useApp();

  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [editQty, setEditQty] = useState(1);
  const [editPortion, setEditPortion] = useState<PortionSize>('regular');
  const [editPrep, setEditPrep] = useState<PreparationStyle>('normal');

  const handleDeleteMeal = async (mealId: string) => {
    await nutritionService.deleteMeal(mealId);
    await refreshSummary();
  };

  const handleOpenPortionEdit = (meal: Meal) => {
    setEditingMeal(meal);
    const item = meal.items[0];
    if (item) {
      setEditQty(item.quantity);
      setEditPortion(item.portion);
      setEditPrep(item.preparationStyle);
    }
  };

  const handleSavePortionEdit = async () => {
    if (!editingMeal) return;

    const item = editingMeal.items[0];
    const pMult = getPortionMultiplier(editPortion) * editQty;
    const prep = getPrepMultiplier(editPrep);

    // Recalculate item macros
    const updatedMacros = {
      calories: { min: Math.round(180 * pMult * prep.cal), max: Math.round(230 * pMult * prep.cal), unit: 'kcal' },
      protein: { min: Math.round(7 * pMult * 10) / 10, max: Math.round(10 * pMult * 10) / 10, unit: 'g' },
      carbs: { min: Math.round(30 * pMult * 10) / 10, max: Math.round(38 * pMult * 10) / 10, unit: 'g' },
      fat: { min: Math.round(5 * pMult * prep.fat * 10) / 10, max: Math.round(8 * pMult * prep.fat * 10) / 10, unit: 'g' },
      fiber: { min: Math.round(4 * pMult * 10) / 10, max: Math.round(6 * pMult * 10) / 10, unit: 'g' },
    };

    const updatedMeal: Meal = {
      ...editingMeal,
      items: [
        {
          ...item,
          quantity: editQty,
          portion: editPortion,
          preparationStyle: editPrep,
          macros: updatedMacros,
        },
      ],
      totalMacros: updatedMacros,
    };

    await nutritionService.updateMeal(updatedMeal);
    await refreshSummary();
    setEditingMeal(null);
  };

  const meals = todaySummary?.meals || [];
  const breakfastMeals = meals.filter((m) => m.mealType === 'breakfast');
  const lunchMeals = meals.filter((m) => m.mealType === 'lunch');
  const snackMeals = meals.filter((m) => m.mealType === 'snack');
  const dinnerMeals = meals.filter((m) => m.mealType === 'dinner');

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Today's Nutrition Tracking"
            subtitle="Based on meals you have logged today. Edit, remove, or adjust portions anytime."
            className="mb-0"
          />
        </div>

        {/* Date Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-surface-light dark:bg-surface-dark px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 shadow-soft text-xs font-semibold">
          <button className="p-1 hover:text-brand-light">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>Today, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          <button className="p-1 hover:text-brand-light">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bars Overview Card */}
      {todaySummary && (
        <Card padding="lg" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-ink-light dark:text-ink-dark">
              Daily Nutrient Targets
            </h3>
            <span className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
              Based on logged meals
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaySummary.gaps.slice(0, 6).map((gap) => (
              <NutrientProgress
                key={gap.nutrientKey}
                label={gap.nutrient}
                consumed={gap.consumed}
                target={gap.target}
                unit={gap.unit}
                color={
                  gap.nutrientKey === 'protein'
                    ? '#2E9E5B'
                    : gap.nutrientKey === 'iron'
                    ? '#E2582E'
                    : gap.nutrientKey === 'calcium'
                    ? '#2BB3CE'
                    : gap.nutrientKey === 'b12'
                    ? '#7B5CD6'
                    : '#F2B33D'
                }
              />
            ))}
          </div>
        </Card>
      )}

      {/* Meals By Slot */}
      <div className="flex flex-col gap-6">
        {/* Breakfast */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-display font-bold text-lg text-ink-light dark:text-ink-dark">
              Breakfast ({breakfastMeals.length})
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/log')}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Add
            </Button>
          </div>

          {breakfastMeals.length > 0 ? (
            <div className="flex flex-col gap-3">
              {breakfastMeals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onEditPortion={handleOpenPortionEdit}
                  onDelete={handleDeleteMeal}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark italic px-1">
              No breakfast logged yet.
            </p>
          )}
        </div>

        {/* Lunch */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-display font-bold text-lg text-ink-light dark:text-ink-dark">
              Lunch ({lunchMeals.length})
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/log')}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Add
            </Button>
          </div>

          {lunchMeals.length > 0 ? (
            <div className="flex flex-col gap-3">
              {lunchMeals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onEditPortion={handleOpenPortionEdit}
                  onDelete={handleDeleteMeal}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark italic px-1">
              No lunch logged yet.
            </p>
          )}
        </div>

        {/* Snack */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-display font-bold text-lg text-ink-light dark:text-ink-dark">
              Snacks & Beverages ({snackMeals.length})
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/log')}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Add
            </Button>
          </div>

          {snackMeals.length > 0 ? (
            <div className="flex flex-col gap-3">
              {snackMeals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onEditPortion={handleOpenPortionEdit}
                  onDelete={handleDeleteMeal}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark italic px-1">
              No snacks logged yet.
            </p>
          )}
        </div>

        {/* Dinner */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-display font-bold text-lg text-ink-light dark:text-ink-dark">
              Dinner ({dinnerMeals.length})
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/log')}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Add
            </Button>
          </div>

          {dinnerMeals.length > 0 ? (
            <div className="flex flex-col gap-3">
              {dinnerMeals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onEditPortion={handleOpenPortionEdit}
                  onDelete={handleDeleteMeal}
                />
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-surface-2-light dark:bg-surface-2-dark text-center">
              <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark mb-3">
                Dinner is not logged yet. Check recommendations to balance today's gaps!
              </p>
              <Button
                size="sm"
                onClick={() => navigate('/recommendations')}
                leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />}
              >
                Find Recommended Dinner
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Portion Modal */}
      <Modal
        isOpen={Boolean(editingMeal)}
        onClose={() => setEditingMeal(null)}
        title="Change Portion Size"
        maxWidth="sm"
      >
        {editingMeal && (
          <div className="flex flex-col gap-4 py-2">
            <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
              Update serving size for{' '}
              <strong className="text-ink-light dark:text-ink-dark">
                {editingMeal.items[0]?.foodName}
              </strong>
            </p>
            <PortionControl
              quantity={editQty}
              onQuantityChange={setEditQty}
              portion={editPortion}
              onPortionChange={setEditPortion}
              prepStyle={editPrep}
              onPrepStyleChange={setEditPrep}
            />
            <Button size="md" fullWidth onClick={handleSavePortionEdit} className="mt-2">
              Save Portion Update
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TodayPage;
