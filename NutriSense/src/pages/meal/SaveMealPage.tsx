import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { FoodImage } from '../../components/food/FoodImage';
import { nutritionService } from '../../services/nutrition.service';
import { useApp } from '../../context/AppContext';
import type { MealType, Food, PortionSize, PreparationStyle, MacroNutrients, MicroNutrients } from '../../types';

export const SaveMealPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshSummary, incrementStreak } = useApp();

  const state = location.state as {
    food: Food;
    quantity: number;
    portion: PortionSize;
    prepStyle: PreparationStyle;
    macros: MacroNutrients;
    micros: MicroNutrients;
  } | null;

  // Auto-suggest meal type by current hour
  const getDefaultMealType = (): MealType => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 11) return 'breakfast';
    if (hr >= 11 && hr < 15) return 'lunch';
    if (hr >= 15 && hr < 19) return 'snack';
    return 'dinner';
  };

  const [mealType, setMealType] = useState<MealType>(getDefaultMealType());
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!state || !state.food) {
    navigate('/log');
    return null;
  }

  const { food, quantity, portion, prepStyle, macros, micros } = state;

  const mealTypes: Array<{ id: MealType; label: string }> = [
    { id: 'breakfast', label: 'Breakfast' },
    { id: 'lunch', label: 'Lunch' },
    { id: 'snack', label: 'Evening Snack' },
    { id: 'dinner', label: 'Dinner' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const newMeal = await nutritionService.logMeal({
        userId: 'demo-user-1',
        mealType,
        loggedAt: new Date().toISOString(),
        notes: notes.trim() || undefined,
        inputMethod: 'photo',
        items: [
          {
            id: `item-${Date.now()}`,
            foodId: food.id,
            foodName: food.name,
            image: food.image,
            quantity,
            portion,
            preparationStyle: prepStyle,
            macros,
            micros,
          },
        ],
        totalMacros: macros,
        totalMicros: micros,
      });

      await refreshSummary();
      incrementStreak();

      navigate('/log/success', {
        state: { meal: newMeal },
      });
    } catch (e) {
      console.error(e);
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Log This Meal"
        subtitle="Confirm meal slot and timestamp to update your daily balance."
        showBack
      />

      {/* Item Summary */}
      <Card padding="md" className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 flex-shrink-0">
          <FoodImage src={food.image} alt={food.name} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display font-bold text-base text-ink-light dark:text-ink-dark truncate">
            {quantity > 1 ? `${quantity}× ` : ''}
            {food.name}
          </h2>
          <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark font-mono mt-0.5">
            ~{macros.calories.min}–{macros.calories.max} kcal •{' '}
            <span className="text-nutrient-protein font-semibold">
              ~{macros.protein.min}–{macros.protein.max}g Protein
            </span>
          </p>
        </div>
      </Card>

      {/* Meal Slot Selection */}
      <Card padding="md">
        <label className="block text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider mb-2.5">
          Meal Category
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {mealTypes.map((m) => {
            const isSelected = mealType === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMealType(m.id)}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all min-h-[44px] ${
                  isSelected
                    ? 'bg-brand-light text-white shadow-soft dark:bg-brand-dark dark:text-ink-light border-brand-light'
                    : 'bg-surface-2-light dark:bg-surface-2-dark border-black/5 dark:border-white/5 text-ink-light dark:text-ink-dark'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Date / Time */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-light dark:text-ink-dark">
            <Clock className="w-4 h-4 text-brand-light dark:text-brand-dark" />
            <span>Logged Time:</span>
          </div>
          <span className="text-xs font-mono font-bold text-ink-muted-light dark:text-ink-muted-dark">
            Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </Card>

      {/* Optional Notes */}
      <Card padding="md">
        <label className="block text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
          Notes (Optional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Sambar made at home with drumstick & toor dal"
          className="w-full px-4 py-2.5 rounded-full bg-surface-2-light dark:bg-surface-2-dark border border-black/10 dark:border-white/10 text-xs text-ink-light dark:text-ink-dark placeholder:text-ink-muted-light dark:placeholder:text-ink-muted-dark focus:outline-none focus:ring-2 focus:ring-brand-light"
        />
      </Card>

      {/* Save CTA */}
      <Button size="lg" fullWidth isLoading={isSaving} onClick={handleSave}>
        Save Meal to Daily Log
      </Button>
    </div>
  );
};

export default SaveMealPage;
