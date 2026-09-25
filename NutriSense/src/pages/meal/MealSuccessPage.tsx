import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, PlusCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ProgressRing } from '../../components/nutrition/ProgressRing';
import { NutriMote } from '../../components/animations/NutriMote';
import { triggerMoteBurst } from '../../components/animations/MoteBurst';
import { useApp } from '../../context/AppContext';
import type { Meal } from '../../types';

export const MealSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { todaySummary } = useApp();

  const state = location.state as { meal?: Meal } | null;
  const meal = state?.meal;

  useEffect(() => {
    triggerMoteBurst({ x: 0.5, y: 0.4 });
  }, []);

  const avgCompletion = todaySummary
    ? Math.round(
        todaySummary.gaps.reduce((acc, g) => acc + Math.min(100, g.percentage), 0) /
          todaySummary.gaps.length
      )
    : 72;

  return (
    <div className="max-w-md mx-auto flex flex-col items-center justify-center text-center py-8">
      {/* Mote & Success Icon */}
      <div className="relative mb-4">
        <NutriMote type="protein" mood="celebrating" size={80} />
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink-light dark:text-ink-dark">
        Meal Logged Successfully!
      </h1>
      <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mt-1 max-w-xs">
        {meal?.items[0]?.foodName || 'Your meal'} has been added to today's nutrition picture.
      </p>

      {/* Progress Ring Card */}
      <Card padding="lg" className="w-full my-6 flex flex-col items-center">
        <span className="text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider mb-4">
          Updated Daily Balance
        </span>

        <ProgressRing
          percentage={avgCompletion}
          size={140}
          strokeWidth={10}
          color="#2E9E5B"
        >
          <span className="font-display font-bold text-3xl text-ink-light dark:text-ink-dark">
            {avgCompletion}%
          </span>
          <span className="text-[10px] uppercase tracking-wider text-ink-muted-light dark:text-ink-muted-dark font-semibold">
            Daily Goal
          </span>
        </ProgressRing>

        <div className="mt-5 pt-4 border-t border-black/[0.04] dark:border-white/[0.06] w-full flex justify-around text-xs font-mono">
          <div>
            <span className="block text-ink-muted-light dark:text-ink-muted-dark text-[10px]">
              Calories Est.
            </span>
            <span className="font-bold">
              ~{meal?.totalMacros.calories.min}–{meal?.totalMacros.calories.max} kcal
            </span>
          </div>
          <div>
            <span className="block text-ink-muted-light dark:text-ink-muted-dark text-[10px]">
              Protein Added
            </span>
            <span className="font-bold text-nutrient-protein">
              ~{meal?.totalMacros.protein.min}–{meal?.totalMacros.protein.max}g
            </span>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="w-full flex flex-col gap-2.5">
        <Button
          size="lg"
          fullWidth
          onClick={() => navigate('/today')}
          rightIcon={<ArrowRight className="w-5 h-5" />}
        >
          View Today's Full Breakdown
        </Button>

        <Button
          size="md"
          variant="outline"
          fullWidth
          onClick={() => navigate('/log')}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Log Another Meal
        </Button>

        <Link
          to="/dashboard"
          className="text-xs font-semibold text-ink-muted-light hover:text-ink-light dark:text-ink-muted-dark dark:hover:text-ink-dark py-2"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default MealSuccessPage;
