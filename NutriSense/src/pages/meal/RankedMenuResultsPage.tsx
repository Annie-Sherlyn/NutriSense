import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { WhyThisRecommendation } from '../../components/nutrition/WhyThisRecommendation';
import { useApp } from '../../context/AppContext';
import type { OCRResult, MenuItem } from '../../types';

interface RankedMenuItem {
  item: MenuItem;
  rank: number;
  matchScore: number; // e.g. 94%
  estimatedCalories: { min: number; max: number; unit: string };
  estimatedProtein: { min: number; max: number; unit: string };
  whySummary: string;
  reasons: Array<{ key: string; label: string; passed: boolean; profileField?: string }>;
}

export const RankedMenuResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setProjectedGaps } = useApp();

  const state = location.state as { ocrResult?: OCRResult } | null;
  const ocrResult = state?.ocrResult;

  const [previewingId, setPreviewingId] = useState<string | null>(null);

  // Ranked items based on current nutrient gap & budget
  const rankedItems: RankedMenuItem[] = [
    {
      item: { id: 'm-1', name: 'Idli (2 pcs) with Sambar & Chutney', price: 60, matchedFoodId: 'food-idli' },
      rank: 1,
      matchScore: 95,
      estimatedCalories: { min: 180, max: 220, unit: 'kcal' },
      estimatedProtein: { min: 6, max: 8, unit: 'g' },
      whySummary: 'Steamed, low oil, and provides fermented gut-friendly carbs and toor dal protein.',
      reasons: [
        { key: 'goal', label: 'Aligns with your primary health goal', passed: true, profileField: 'goal' },
        { key: 'budget', label: '₹60, fits comfortably within your budget', passed: true, profileField: 'budgetPerMeal' },
        { key: 'diet', label: 'Strictly vegetarian and peanut allergen safe', passed: true, profileField: 'allergies' },
        { key: 'fermentation', label: 'Fermentation enhances bioavailability of B-vitamins', passed: true },
      ],
    },
    {
      item: { id: 'm-2', name: 'Ven Pongal with Ghee & Cashews', price: 75, matchedFoodId: 'food-pongal' },
      rank: 2,
      matchScore: 88,
      estimatedCalories: { min: 310, max: 380, unit: 'kcal' },
      estimatedProtein: { min: 8, max: 11, unit: 'g' },
      whySummary: 'High plant protein from yellow moong dal with soothing black pepper tempering.',
      reasons: [
        { key: 'protein', label: 'Provides ~9g clean moong dal protein toward your gap', passed: true, profileField: 'priorityNutrients' },
        { key: 'budget', label: '₹75, within budget', passed: true, profileField: 'budgetPerMeal' },
        { key: 'satiety', label: 'Warm and comforting low-glycemic meal', passed: true },
      ],
    },
    {
      item: { id: 'm-3', name: 'Medu Vada (1 pc)', price: 35, matchedFoodId: 'food-vada' },
      rank: 3,
      matchScore: 78,
      estimatedCalories: { min: 140, max: 180, unit: 'kcal' },
      estimatedProtein: { min: 3.5, max: 5, unit: 'g' },
      whySummary: 'Good pulse protein but higher caloric fat due to deep frying.',
      reasons: [
        { key: 'budget', label: '₹35 economical option', passed: true, profileField: 'budgetPerMeal' },
        { key: 'fat-note', label: 'Higher fat content than steamed idli', passed: false },
      ],
    },
  ];

  const handleTogglePreview = (id: string, prot: number, cal: number) => {
    if (previewingId === id) {
      setPreviewingId(null);
      setProjectedGaps(undefined);
    } else {
      setPreviewingId(id);
      setProjectedGaps({
        protein: prot,
        calories: cal,
      });
    }
  };

  const handleSelectToLog = (item: MenuItem) => {
    const foodId = item.matchedFoodId || 'food-idli';
    navigate(`/log/portion?foodId=${foodId}`);
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Ranked Menu Choices"
        subtitle={`Ranked for your goals & gaps from ${ocrResult?.restaurantName || 'Menu'}.`}
        showBack
      />

      <div className="flex flex-col gap-4">
        {rankedItems.map((ranked) => {
          const isPreviewing = previewingId === ranked.item.id;
          const avgProt = (ranked.estimatedProtein.min + ranked.estimatedProtein.max) / 2;
          const avgCal = (ranked.estimatedCalories.min + ranked.estimatedCalories.max) / 2;

          return (
            <Card
              key={ranked.item.id}
              padding="lg"
              className={`border-2 transition-all ${
                ranked.rank === 1
                  ? 'border-brand-light dark:border-brand-dark shadow-soft'
                  : 'border-black/[0.06] dark:border-white/[0.08]'
              }`}
            >
              {/* Header with Rank Badge */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        ranked.rank === 1
                          ? 'bg-brand-light text-white dark:bg-brand-dark dark:text-ink-light'
                          : 'bg-black/5 dark:bg-white/10 text-ink-muted-light dark:text-ink-muted-dark'
                      }`}
                    >
                      #{ranked.rank} Match
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {ranked.matchScore}% Match Score
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base sm:text-lg text-ink-light dark:text-ink-dark">
                    {ranked.item.name}
                  </h3>
                </div>

                <span className="font-mono font-bold text-base text-ink-light dark:text-ink-dark">
                  ₹{ranked.item.price}
                </span>
              </div>

              {/* Macro estimate tags */}
              <div className="flex items-center gap-2 my-2 text-xs font-mono">
                <span className="text-nutrient-protein font-semibold">
                  ~{ranked.estimatedProtein.min}–{ranked.estimatedProtein.max}g Protein
                </span>
                <span>•</span>
                <span className="text-ink-muted-light dark:text-ink-muted-dark">
                  ~{ranked.estimatedCalories.min}–{ranked.estimatedCalories.max} kcal
                </span>
              </div>

              {/* Explainability component */}
              <div className="my-3">
                <WhyThisRecommendation reasons={ranked.reasons} whySummary={ranked.whySummary} />
              </div>

              {/* Actions Bar */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => handleTogglePreview(ranked.item.id, avgProt, avgCal)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isPreviewing
                      ? 'bg-brand-light text-white shadow-soft dark:bg-brand-dark dark:text-ink-light'
                      : 'bg-surface-2-light dark:bg-surface-2-dark text-ink-light dark:text-ink-dark hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isPreviewing ? 'Previewing on Orbit' : 'Preview impact'}</span>
                </button>

                <Button
                  size="sm"
                  onClick={() => handleSelectToLog(ranked.item)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add to Meal
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RankedMenuResultsPage;
