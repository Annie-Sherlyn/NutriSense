import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Dumbbell, Scale, Zap, Sparkles, Activity, Check } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useApp } from '../../context/AppContext';
import type { NutritionGoal } from '../../types';

interface GoalOption {
  id: NutritionGoal;
  title: string;
  description: string;
  icon: React.ElementType;
}

const GOALS: GoalOption[] = [
  {
    id: 'better-health',
    title: 'Better Health & Vitality',
    description: 'Ensure daily vitamin, mineral, and micronutrient adequacy without stress.',
    icon: Heart,
  },
  {
    id: 'build-muscle',
    title: 'Build Muscle & Strength',
    description: 'Prioritize high-protein Indian options, amino acid balance, and post-meal recovery.',
    icon: Dumbbell,
  },
  {
    id: 'manage-weight',
    title: 'Manage Weight',
    description: 'Mindful portion awareness, satiety tracking, and low caloric-density meal alternatives.',
    icon: Scale,
  },
  {
    id: 'more-energy',
    title: 'More Energy & Stamina',
    description: 'Avoid 3 PM carb slumps with balanced low-GI meals and sustained energy releases.',
    icon: Zap,
  },
  {
    id: 'improve-digestion',
    title: 'Improve Gut Health',
    description: 'Focus on fermented foods, prebiotic fiber, cooling spices, and gentle digestion.',
    icon: Sparkles,
  },
  {
    id: 'balanced-nutrition',
    title: 'Balanced Nutrition',
    description: 'Harmonize macros and micros across authentic thalis, tiffins, and home cooking.',
    icon: Activity,
  },
];

export const GoalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useApp();
  const [selectedGoal, setSelectedGoal] = useState<NutritionGoal>(
    profile?.goal || 'better-health'
  );

  const handleContinue = () => {
    updateProfile({ goal: selectedGoal });
    navigate('/onboarding/personalize');
  };

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-ink-light dark:text-ink-dark flex flex-col justify-between p-6 sm:p-10 transition-colors">
      <div className="max-w-xl mx-auto w-full pt-safe">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-brand-light dark:text-brand-dark uppercase tracking-wider">
            Step 2 of 6
          </span>
          <button
            onClick={handleContinue}
            className="text-xs font-semibold text-ink-muted-light hover:text-ink-light dark:text-ink-muted-dark dark:hover:text-ink-dark"
          >
            Skip
          </button>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink-light dark:text-ink-dark">
          What is your primary nutrition focus?
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mt-1 mb-6">
          NutriSense personalizes next-meal recommendations and prioritizes gaps around this goal.
        </p>

        {/* Goal Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {GOALS.map((g) => {
            const Icon = g.icon;
            const isSelected = selectedGoal === g.id;
            return (
              <Card
                key={g.id}
                onClick={() => setSelectedGoal(g.id)}
                padding="md"
                className={`cursor-pointer transition-all border-2 text-left relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-brand-light dark:border-brand-dark bg-brand-light/[0.04] dark:bg-brand-dark/[0.08] shadow-soft'
                    : 'border-black/[0.06] dark:border-white/[0.08] hover:border-brand-light/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-brand-light text-white dark:bg-brand-dark dark:text-ink-light'
                          : 'bg-surface-2-light dark:bg-surface-2-dark text-ink-muted-light dark:text-ink-muted-dark'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-brand-light dark:bg-brand-dark text-white dark:text-ink-light flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-sm sm:text-base text-ink-light dark:text-ink-dark">
                    {g.title}
                  </h3>
                  <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark mt-1 leading-relaxed">
                    {g.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="max-w-xl mx-auto w-full pt-8 pb-safe">
        <Button fullWidth size="lg" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default GoalsPage;
