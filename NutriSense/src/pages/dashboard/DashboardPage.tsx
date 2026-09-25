import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  PlusCircle,
  Lightbulb,
  Flame,
  Compass,
  Zap,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { NutriMote } from '../../components/animations/NutriMote';
import { InteractiveNutrientEcosystem } from '../../components/nutrition/InteractiveNutrientEcosystem';
import { useApp } from '../../context/AppContext';
import type { NutrientGap, MealType } from '../../types';

const DID_YOU_KNOW_TIPS = [
  'Did you know? Pairing plant iron (like chana or spinach) with lemon increases iron absorption up to 3x.',
  'Did you know? Fermented batter in Idlis & Dosas enhances natural bioavailability of B-vitamins and aids gut microflora.',
  'Did you know? Sattu is prepared from roasted Bengal gram, offering high bioavailable protein and soluble fiber with zero cooking.',
  'Did you know? Strained hung curd (dahi) concentrates protein and active probiotic cultures while reducing whey lactose.',
  'Did you know? A teaspoon of pure A2 desi ghee enhances absorption of fat-soluble vitamins A, D, E, and K.',
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    todaySummary,
    profile,
    projectedGaps,
    streakCount,
    setStreakModalOpen,
  } = useApp();

  const [selectedGapForModal, setSelectedGapForModal] = useState<NutrientGap | null>(null);
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate tip every 15s
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % DID_YOU_KNOW_TIPS.length);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Determine current meal window and contextual greeting
  const getMealWindowInfo = (): { window: MealType; greeting: string; contextualLine: string } => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) {
      return {
        window: 'breakfast',
        greeting: 'Good morning',
        contextualLine: 'You usually log breakfast around this time.',
      };
    }
    if (hour >= 11 && hour < 15) {
      return {
        window: 'lunch',
        greeting: 'Good afternoon',
        contextualLine: 'You usually log lunch around 1:00 PM.',
      };
    }
    if (hour >= 15 && hour < 19) {
      return {
        window: 'snack',
        greeting: 'Good afternoon',
        contextualLine: 'Ideal window for a protein-rich evening snack.',
      };
    }
    return {
      window: 'dinner',
      greeting: 'Good evening',
      contextualLine: 'Time to balance your remaining daily nutrient targets.',
    };
  };

  const { greeting, contextualLine } = getMealWindowInfo();

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  // Calculate high-level macronutrient progress for the summary strip
  const caloriesConsumed = todaySummary?.consumed.calories || 0;
  const caloriesTarget = todaySummary?.targets.calories.target || 2000;
  const caloriesPct = Math.min(100, Math.round((caloriesConsumed / caloriesTarget) * 100));

  const proteinGap = todaySummary?.gaps.find((g) => g.nutrientKey === 'protein');
  const carbsGap = todaySummary?.gaps.find((g) => g.nutrientKey === 'carbs');
  const fatGap = todaySummary?.gaps.find((g) => g.nutrientKey === 'fat');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6 pb-12"
    >
      {/* 1. Header Greeting & Primary Flow Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider">
            {todayFormatted}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink-light dark:text-ink-dark mt-0.5">
            {greeting}, {profile?.name?.split(' ')[0] || 'Friend'}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mt-1">
            {contextualLine}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Action to Log Food */}
          <Button
            size="md"
            onClick={() => navigate('/log')}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Log Food
          </Button>

          {/* Quick Action to Recommendations */}
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/recommendations')}
            leftIcon={<Sparkles className="w-4 h-4 text-amber-500" />}
          >
            Recommendations
          </Button>

          {/* Streak Indicator */}
          <button
            onClick={() => setStreakModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 transition-all text-xs font-bold select-none min-h-[44px] cursor-pointer"
            title="View streak progress"
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>{streakCount} Days</span>
          </button>
        </div>
      </div>

      {/* 2. Key Daily Macronutrient Metric Strip (Compact 4-Pill Overview) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Calories */}
        <Card padding="sm" className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted-light dark:text-ink-muted-dark flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Energy</span>
            </span>
            <span className="text-[11px] font-semibold text-ink-muted-light dark:text-ink-muted-dark font-mono">
              {caloriesPct}%
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display font-bold text-xl text-ink-light dark:text-ink-dark">
              {caloriesConsumed}
            </span>
            <span className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
              / {caloriesTarget} kcal
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${caloriesPct}%` }}
            />
          </div>
        </Card>

        {/* Protein */}
        <Card padding="sm" className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted-light dark:text-ink-muted-dark flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-nutrient-protein" />
              <span>Protein</span>
            </span>
            <span className="text-[11px] font-semibold text-ink-muted-light dark:text-ink-muted-dark font-mono">
              {proteinGap ? Math.min(100, Math.round(proteinGap.percentage)) : 0}%
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display font-bold text-xl text-ink-light dark:text-ink-dark">
              {proteinGap?.consumed || 0}g
            </span>
            <span className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
              / {proteinGap?.target || 65}g
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-nutrient-protein transition-all duration-500"
              style={{ width: `${proteinGap ? Math.min(100, proteinGap.percentage) : 0}%` }}
            />
          </div>
        </Card>

        {/* Carbs */}
        <Card padding="sm" className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted-light dark:text-ink-muted-dark flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-nutrient-carbs" />
              <span>Carbs</span>
            </span>
            <span className="text-[11px] font-semibold text-ink-muted-light dark:text-ink-muted-dark font-mono">
              {carbsGap ? Math.min(100, Math.round(carbsGap.percentage)) : 0}%
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display font-bold text-xl text-ink-light dark:text-ink-dark">
              {carbsGap?.consumed || 0}g
            </span>
            <span className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
              / {carbsGap?.target || 250}g
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-nutrient-carbs transition-all duration-500"
              style={{ width: `${carbsGap ? Math.min(100, carbsGap.percentage) : 0}%` }}
            />
          </div>
        </Card>

        {/* Healthy Fats */}
        <Card padding="sm" className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted-light dark:text-ink-muted-dark flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-nutrient-fat" />
              <span>Healthy Fats</span>
            </span>
            <span className="text-[11px] font-semibold text-ink-muted-light dark:text-ink-muted-dark font-mono">
              {fatGap ? Math.min(100, Math.round(fatGap.percentage)) : 0}%
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-display font-bold text-xl text-ink-light dark:text-ink-dark">
              {fatGap?.consumed || 0}g
            </span>
            <span className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
              / {fatGap?.target || 55}g
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-nutrient-fat transition-all duration-500"
              style={{ width: `${fatGap ? Math.min(100, fatGap.percentage) : 0}%` }}
            />
          </div>
        </Card>
      </div>

      {/* 3. Hero Centerpiece: Creative Interactive Nutrient Ecosystem */}
      <Card padding="lg" className="relative overflow-hidden shadow-soft">
        {todaySummary ? (
          <InteractiveNutrientEcosystem
            summary={todaySummary}
            projectedGaps={projectedGaps}
            onNutrientClick={(gap) => setSelectedGapForModal(gap)}
          />
        ) : (
          <div className="py-20 text-center text-xs text-ink-muted-light">Loading ecosystem…</div>
        )}
      </Card>

      {/* 4. Single Rotating Indian Nutrition Science Fact */}
      <Card
        padding="md"
        className="bg-gradient-to-br from-surface-light to-surface-2-light dark:from-surface-dark dark:to-surface-2-dark border border-black/[0.05] dark:border-white/[0.06]"
      >
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Lightbulb className="w-4 h-4" />
          <span>Indian Nutritional Wisdom</span>
        </div>
        <p className="text-sm text-ink-light dark:text-ink-dark leading-relaxed font-medium">
          {DID_YOU_KNOW_TIPS[tipIndex]}
        </p>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
          <span className="text-[11px] text-ink-muted-light dark:text-ink-muted-dark">
            Science Tip {tipIndex + 1} of {DID_YOU_KNOW_TIPS.length}
          </span>
          <button
            type="button"
            onClick={() => setTipIndex((prev) => (prev + 1) % DID_YOU_KNOW_TIPS.length)}
            className="text-xs font-semibold text-brand-light dark:text-brand-dark hover:underline cursor-pointer"
          >
            Next tip →
          </button>
        </div>
      </Card>

      {/* 5. Deep Nutrient Modal (When user taps any nutrient on the ecosystem chart) */}
      <Modal
        isOpen={Boolean(selectedGapForModal)}
        onClose={() => setSelectedGapForModal(null)}
        maxWidth="sm"
        title={
          selectedGapForModal ? (
            <div className="flex items-center gap-2">
              <NutriMote
                type={
                  selectedGapForModal.nutrientKey === 'iron'
                    ? 'iron'
                    : selectedGapForModal.nutrientKey === 'calcium'
                    ? 'calcium'
                    : selectedGapForModal.nutrientKey === 'b12'
                    ? 'b12'
                    : selectedGapForModal.nutrientKey === 'fiber'
                    ? 'fiber'
                    : 'protein'
                }
                mood="curious"
                size={32}
              />
              <span>{selectedGapForModal.nutrient} Intake Target</span>
            </div>
          ) : undefined
        }
      >
        {selectedGapForModal && (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-baseline justify-between p-3 rounded-2xl bg-surface-2-light dark:bg-surface-2-dark">
              <div>
                <span className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
                  Consumed Today
                </span>
                <p className="font-mono text-xl font-bold text-ink-light dark:text-ink-dark">
                  {selectedGapForModal.consumed} {selectedGapForModal.unit}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
                  Daily Reference Target
                </span>
                <p className="font-mono text-xl font-bold text-brand-light dark:text-brand-dark">
                  {selectedGapForModal.target} {selectedGapForModal.unit}
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider block mb-1">
                Progress Status
              </span>
              <p className="text-xs sm:text-sm text-ink-light dark:text-ink-dark leading-relaxed">
                {selectedGapForModal.percentage >= 100
                  ? `You have reached 100% of your daily ${selectedGapForModal.nutrient.toLowerCase()} target!`
                  : `You have approximately ${selectedGapForModal.remaining} ${selectedGapForModal.unit} left to reach your reference benchmark.`}
              </p>
            </div>

            <Button
              fullWidth
              size="md"
              onClick={() => {
                setSelectedGapForModal(null);
                navigate('/recommendations');
              }}
              leftIcon={<Compass className="w-4 h-4" />}
            >
              Explore {selectedGapForModal.nutrient}-Rich Meals
            </Button>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default DashboardPage;
