import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/common/Toast';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { DietType, NutritionGoal, PriorityNutrient, ActivityLevel } from '../../types';

export const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useApp();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: profile?.name || 'Aarav Sharma',
    ageGroup: profile?.ageGroup || '25–34',
    activityLevel: (profile?.activityLevel || 'moderate') as ActivityLevel,
    dietType: (profile?.dietType || 'vegetarian') as DietType,
    goal: (profile?.goal || 'better-health') as NutritionGoal,
    priorityNutrients: profile?.priorityNutrients || (['protein', 'iron', 'calcium'] as PriorityNutrient[]),
    budgetPerMeal: profile?.budgetPerMeal || 150,
    location: profile?.location || 'Bengaluru, India',
    allergies: profile?.allergies || ['Peanuts'],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const availableGoals: { id: NutritionGoal; label: string }[] = [
    { id: 'better-health', label: 'Overall Better Health & Vitality' },
    { id: 'build-muscle', label: 'Build Muscle & Lean Protein' },
    { id: 'manage-weight', label: 'Weight Management & Satiety' },
    { id: 'more-energy', label: 'Sustained Daily Energy & Focus' },
    { id: 'improve-digestion', label: 'Gut Microbiome & Fiber' },
    { id: 'balanced-nutrition', label: 'Micro-Nutrient Balance (Iron & B12)' },
  ];

  const availableNutrients: { id: PriorityNutrient; label: string }[] = [
    { id: 'protein', label: 'Protein' },
    { id: 'iron', label: 'Iron' },
    { id: 'calcium', label: 'Calcium' },
    { id: 'b12', label: 'Vitamin B12' },
    { id: 'fiber', label: 'Dietary Fiber' },
    { id: 'hydration', label: 'Hydration' },
  ];

  const availableAllergies = [
    'Peanuts',
    'Tree Nuts',
    'Dairy / Lactose',
    'Gluten / Wheat',
    'Soy',
    'Shellfish',
  ];

  const handleNutrientToggle = (nutrient: PriorityNutrient) => {
    setFormData((prev) => {
      const exists = prev.priorityNutrients.includes(nutrient);
      return {
        ...prev,
        priorityNutrients: exists
          ? prev.priorityNutrients.filter((n) => n !== nutrient)
          : [...prev.priorityNutrients, nutrient],
      };
    });
  };

  const handleAllergyToggle = (allergy: string) => {
    setFormData((prev) => {
      const exists = prev.allergies.includes(allergy);
      return {
        ...prev,
        allergies: exists
          ? prev.allergies.filter((a) => a !== allergy)
          : [...prev.allergies, allergy],
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.name.trim()) {
      setValidationError('Please enter your name.');
      return;
    }

    if (formData.priorityNutrients.length === 0) {
      setValidationError('Please select at least one priority nutrient to track.');
      return;
    }

    setIsSaving(true);
    try {
      updateProfile({
        name: formData.name.trim(),
        ageGroup: formData.ageGroup,
        activityLevel: formData.activityLevel,
        dietType: formData.dietType,
        goal: formData.goal,
        priorityNutrients: formData.priorityNutrients,
        budgetPerMeal: formData.budgetPerMeal,
        location: formData.location.trim(),
        allergies: formData.allergies,
      });

      showToast({
        type: 'success',
        message: 'Nutrition profile and ICMR targets updated successfully!',
      });

      navigate('/profile');
    } catch {
      setValidationError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-sm text-charcoal-600 hover:text-forest-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>
        <span className="text-xs font-semibold text-forest-700 bg-forest-50 px-3 py-1 rounded-full">
          ICMR-NIN Calibration
        </span>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-forest-900">
          Edit Nutrition Profile
        </h1>
        <p className="text-sm text-charcoal-500 mt-1">
          Adjusting your biological parameters recalibrates all daily nutrient targets and recommendation formulas.
        </p>
      </div>

      {validationError && (
        <div className="p-4 rounded-xl bg-warm-50 border border-warm-200 text-warm-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal & Demographic Parameters */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-serif font-bold text-forest-900 border-b border-forest-100 pb-2">
            Personal Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-forest-200 bg-cream-50/50 focus:bg-cream focus:ring-2 focus:ring-forest-500 text-charcoal-900 text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">
                Age Demographic
              </label>
              <select
                value={formData.ageGroup}
                onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-forest-200 bg-cream-50/50 focus:bg-cream focus:ring-2 focus:ring-forest-500 text-charcoal-900 text-sm font-medium"
              >
                <option value="18–24">18–24 years</option>
                <option value="25–34">25–34 years</option>
                <option value="35–49">35–49 years</option>
                <option value="50+">50+ years</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">
                Physical Activity Level
              </label>
              <select
                value={formData.activityLevel}
                onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as ActivityLevel })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-forest-200 bg-cream-50/50 focus:bg-cream focus:ring-2 focus:ring-forest-500 text-charcoal-900 text-sm font-medium"
              >
                <option value="sedentary">Sedentary (Desk job, minimal movement)</option>
                <option value="moderate">Moderate (Walking, yoga, light gym 3x/wk)</option>
                <option value="active">Active (Intense workout 4-5x/wk)</option>
                <option value="very-active">Very Active (Manual labor or daily endurance)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">
                City / Region
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-forest-200 bg-cream-50/50 focus:bg-cream focus:ring-2 focus:ring-forest-500 text-charcoal-900 text-sm font-medium"
              />
            </div>
          </div>
        </Card>

        {/* Dietary Framework & Budget */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-serif font-bold text-forest-900 border-b border-forest-100 pb-2">
            Dietary Framework & Meal Budget
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">
                Dietary Preference
              </label>
              <select
                value={formData.dietType}
                onChange={(e) => setFormData({ ...formData, dietType: e.target.value as DietType })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-forest-200 bg-cream-50/50 focus:bg-cream focus:ring-2 focus:ring-forest-500 text-charcoal-900 text-sm font-medium"
              >
                <option value="vegetarian">Vegetarian (Dairy included)</option>
                <option value="eggitarian">Eggitarian (Eggs & Dairy, no meat)</option>
                <option value="non-vegetarian">Non-Vegetarian (Fish, Poultry, Meats)</option>
                <option value="vegan">Vegan (100% plant-based)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">
                Target Budget per Meal (₹)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={formData.budgetPerMeal}
                  onChange={(e) => setFormData({ ...formData, budgetPerMeal: Number(e.target.value) })}
                  className="w-full accent-forest-700"
                />
                <span className="font-bold font-serif text-forest-900 text-sm w-16 text-right">
                  ₹{formData.budgetPerMeal}
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">
                Primary Nutrition Goal
              </label>
              <select
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value as NutritionGoal })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-forest-200 bg-cream-50/50 focus:bg-cream focus:ring-2 focus:ring-forest-500 text-charcoal-900 text-sm font-medium"
              >
                {availableGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Priority Nutrients To Track */}
        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-forest-100 pb-2">
            <h2 className="text-base font-serif font-bold text-forest-900">
              Priority Nutrients to Track
            </h2>
            <span className="text-xs text-charcoal-400">Drives Next Best Food recommendations</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            {availableNutrients.map((nutrient) => {
              const selected = formData.priorityNutrients.includes(nutrient.id);
              return (
                <button
                  type="button"
                  key={nutrient.id}
                  onClick={() => handleNutrientToggle(nutrient.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                    selected
                      ? 'border-forest-600 bg-forest-50/80 text-forest-950 shadow-sm'
                      : 'border-forest-100 bg-cream-50/50 text-charcoal-600 hover:border-forest-300'
                  }`}
                >
                  <span>{nutrient.label}</span>
                  {selected ? (
                    <div className="w-5 h-5 rounded-full bg-forest-700 text-cream flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-forest-200" />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Dietary Allergies & Exclusions */}
        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-forest-100 pb-2">
            <h2 className="text-base font-serif font-bold text-forest-900">
              Allergens & Exclusions
            </h2>
            <span className="text-xs text-charcoal-400">Strictly excluded from suggestions</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {availableAllergies.map((allergy) => {
              const selected = formData.allergies.includes(allergy);
              return (
                <button
                  type="button"
                  key={allergy}
                  onClick={() => handleAllergyToggle(allergy)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selected
                      ? 'border-warm-400 bg-warm-50 text-warm-800 shadow-sm'
                      : 'border-forest-100 bg-cream text-charcoal-600 hover:border-forest-300'
                  }`}
                >
                  {allergy} {selected && '✓'}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate('/profile')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
