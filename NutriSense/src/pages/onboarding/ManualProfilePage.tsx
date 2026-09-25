import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useApp } from '../../context/AppContext';
import type { DietType, PriorityNutrient, ActivityLevel, NutritionGoal } from '../../types';

const DIET_TYPES: Array<{ id: DietType; label: string }> = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'eggitarian', label: 'Eggitarian' },
  { id: 'non-vegetarian', label: 'Non-Vegetarian' },
];

const COMMON_ALLERGENS = [
  'Dairy / Lactose',
  'Peanuts',
  'Tree Nuts',
  'Gluten / Wheat',
  'Soy',
  'Eggs',
  'Shellfish',
];

const NUTRIENT_OPTIONS: Array<{ id: PriorityNutrient; label: string }> = [
  { id: 'protein', label: 'Protein' },
  { id: 'iron', label: 'Dietary Iron' },
  { id: 'calcium', label: 'Calcium' },
  { id: 'b12', label: 'Vitamin B12' },
  { id: 'fiber', label: 'Dietary Fiber' },
  { id: 'hydration', label: 'Hydration' },
];

export const ManualProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useApp();

  const [dietType, setDietType] = useState<DietType>(profile?.dietType || 'vegetarian');
  const [allergies, setAllergies] = useState<string[]>(profile?.allergies || []);
  const [customAllergy, setCustomAllergy] = useState('');
  const goal: NutritionGoal = profile?.goal || 'better-health';
  const [priorityNutrients, setPriorityNutrients] = useState<PriorityNutrient[]>(
    profile?.priorityNutrients || ['protein', 'iron']
  );
  const [budgetPerMeal, setBudgetPerMeal] = useState<number>(profile?.budgetPerMeal || 150);
  const [ageGroup, setAgeGroup] = useState<string>(profile?.ageGroup || '25–34');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    profile?.activityLevel || 'moderate'
  );
  const location: string = profile?.location || 'Bengaluru, India';

  const toggleAllergy = (allergy: string) => {
    setAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
      setAllergies((prev) => [...prev, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const toggleNutrient = (n: PriorityNutrient) => {
    setPriorityNutrients((prev) =>
      prev.includes(n) ? prev.filter((item) => item !== n) : [...prev, n]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      dietType,
      allergies,
      goal,
      priorityNutrients,
      budgetPerMeal,
      ageGroup,
      activityLevel,
      location,
    });
    navigate('/onboarding/confirm');
  };

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-ink-light dark:text-ink-dark p-6 sm:p-10 transition-colors">
      <div className="max-w-xl mx-auto w-full pt-safe">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-brand-light dark:text-brand-dark uppercase tracking-wider">
            Step 4 of 6
          </span>
          <button
            onClick={() => navigate('/onboarding/confirm')}
            className="text-xs font-semibold text-ink-muted-light hover:text-ink-light dark:text-ink-muted-dark dark:hover:text-ink-dark"
          >
            Skip to review
          </button>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink-light dark:text-ink-dark mb-1">
          Your Nutrition Profile
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mb-6">
          Every recommendation strictly adheres to these preferences.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* 1. Diet Type */}
          <Card padding="md">
            <label className="block text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider mb-2.5">
              Diet Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DIET_TYPES.map((dt) => {
                const isSelected = dietType === dt.id;
                return (
                  <button
                    key={dt.id}
                    type="button"
                    onClick={() => setDietType(dt.id)}
                    className={`p-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                      isSelected
                        ? 'bg-brand-light text-white shadow-soft dark:bg-brand-dark dark:text-ink-light border-brand-light'
                        : 'bg-surface-2-light dark:bg-surface-2-dark border-black/5 dark:border-white/5 text-ink-light dark:text-ink-dark hover:border-brand-light/40'
                    }`}
                  >
                    {dt.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* 2. Budget Per Meal Slider */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider">
                Average Meal Budget
              </label>
              <span className="font-mono text-base font-bold text-brand-light dark:text-brand-dark">
                ₹{budgetPerMeal}
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={budgetPerMeal}
              onChange={(e) => setBudgetPerMeal(parseInt(e.target.value, 10))}
              className="w-full accent-brand-light dark:accent-brand-dark cursor-pointer h-2 bg-black/10 dark:bg-white/10 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-ink-muted-light dark:text-ink-muted-dark mt-2 font-mono">
              <span>₹50 (Pocket snack)</span>
              <span>₹250 (Full Thali)</span>
              <span>₹500 (Dine out)</span>
            </div>
          </Card>

          {/* 3. Priority Nutrients */}
          <Card padding="md">
            <label className="block text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider mb-2.5">
              Priority Nutrients to Focus On
            </label>
            <div className="flex flex-wrap gap-2">
              {NUTRIENT_OPTIONS.map((no) => {
                const isSelected = priorityNutrients.includes(no.id);
                return (
                  <button
                    key={no.id}
                    type="button"
                    onClick={() => toggleNutrient(no.id)}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all min-h-[38px] ${
                      isSelected
                        ? 'bg-brand-light text-white shadow-soft dark:bg-brand-dark dark:text-ink-light'
                        : 'bg-surface-2-light dark:bg-surface-2-dark text-ink-light dark:text-ink-dark border border-black/5 dark:border-white/5'
                    }`}
                  >
                    {isSelected ? `✓ ${no.label}` : `+ ${no.label}`}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* 4. Allergies & Dislikes */}
          <Card padding="md">
            <label className="block text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider mb-2.5">
              Allergies & Sensitivities
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_ALLERGENS.map((allergy) => {
                const isSelected = allergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleAllergy(allergy)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-rose-500 text-white shadow-soft'
                        : 'bg-surface-2-light dark:bg-surface-2-dark text-ink-light dark:text-ink-dark border border-black/5 dark:border-white/5'
                    }`}
                  >
                    {isSelected ? `✕ ${allergy}` : `+ ${allergy}`}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                placeholder="Add custom allergen (e.g. Mustard, Sesame)"
                className="flex-1 px-3.5 py-2 rounded-full text-xs bg-surface-2-light dark:bg-surface-2-dark border border-black/10 dark:border-white/10 text-ink-light dark:text-ink-dark placeholder:text-ink-muted-light dark:placeholder:text-ink-muted-dark focus:outline-none focus:ring-2 focus:ring-brand-light"
              />
              <Button type="button" size="sm" variant="outline" onClick={addCustomAllergy}>
                Add
              </Button>
            </div>
          </Card>

          {/* 5. Demographics & Context */}
          <Card padding="md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
                  Age Group
                </label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-full bg-surface-2-light dark:bg-surface-2-dark border border-black/10 dark:border-white/10 text-xs font-medium text-ink-light dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-light"
                >
                  <option value="18–24">18–24 years</option>
                  <option value="25–34">25–34 years</option>
                  <option value="35–44">35–44 years</option>
                  <option value="45+">45+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">
                  Daily Activity
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                  className="w-full px-3.5 py-2.5 rounded-full bg-surface-2-light dark:bg-surface-2-dark border border-black/10 dark:border-white/10 text-xs font-medium text-ink-light dark:text-ink-dark focus:outline-none focus:ring-2 focus:ring-brand-light"
                >
                  <option value="sedentary">Sedentary (Desk work)</option>
                  <option value="moderate">Moderate (30m walking / workout)</option>
                  <option value="active">Active (Heavy physical activity)</option>
                </select>
              </div>
            </div>
          </Card>

          <Button type="submit" size="lg" fullWidth className="mt-4 mb-8">
            Review Profile
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ManualProfilePage;
