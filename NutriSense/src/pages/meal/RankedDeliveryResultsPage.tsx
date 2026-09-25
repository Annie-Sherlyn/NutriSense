import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { WhyThisRecommendation } from '../../components/nutrition/WhyThisRecommendation';
import { useApp } from '../../context/AppContext';

export const RankedDeliveryResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setProjectedGaps } = useApp();

  const state = location.state as {
    restaurantName?: string;
    items?: Array<{ id: string; name: string; price: number; quantity: number; matchedFoodId?: string }>;
  } | null;

  const [previewId, setPreviewId] = useState<string | null>(null);

  const rankedItems = [
    {
      id: 'deliv-1',
      name: 'Special Crispy Masala Dosa',
      price: 90,
      matchedFoodId: 'food-masala-dosa',
      rank: 1,
      matchScore: 92,
      protein: { min: 7, max: 9.5, unit: 'g' },
      calories: { min: 340, max: 410, unit: 'kcal' },
      whySummary: 'Balanced fermented carbs with satisfying spiced potato filling within budget.',
      reasons: [
        { key: 'budget', label: '₹90 fits your ₹150 budget', passed: true, profileField: 'budgetPerMeal' },
        { key: 'diet', label: '100% vegetarian', passed: true, profileField: 'dietType' },
        { key: 'satiety', label: 'High satiety index, prevents evening over-snacking', passed: true },
      ],
    },
    {
      id: 'deliv-2',
      name: 'Medu Vada (1 pc)',
      price: 35,
      matchedFoodId: 'food-vada',
      rank: 2,
      matchScore: 81,
      protein: { min: 3.5, max: 5, unit: 'g' },
      calories: { min: 140, max: 180, unit: 'kcal' },
      whySummary: 'Crisp pulse protein snack, best paired with sambar for fiber.',
      reasons: [
        { key: 'protein', label: 'Provides ~4g pulse protein', passed: true, profileField: 'priorityNutrients' },
        { key: 'budget', label: 'Very economical addition', passed: true, profileField: 'budgetPerMeal' },
      ],
    },
  ];

  const handleTogglePreview = (id: string, prot: number, cal: number) => {
    if (previewId === id) {
      setPreviewId(null);
      setProjectedGaps(undefined);
    } else {
      setPreviewId(id);
      setProjectedGaps({ protein: prot, calories: cal });
    }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Ranked Delivery Choices"
        subtitle={`Optimized for your nutritional balance from ${state?.restaurantName || 'Cart'}.`}
        showBack
      />

      <div className="flex flex-col gap-4">
        {rankedItems.map((item) => {
          const isPreviewing = previewId === item.id;
          const avgProt = (item.protein.min + item.protein.max) / 2;
          const avgCal = (item.calories.min + item.calories.max) / 2;

          return (
            <Card
              key={item.id}
              padding="lg"
              className={`border-2 ${
                item.rank === 1
                  ? 'border-brand-light dark:border-brand-dark shadow-soft'
                  : 'border-black/[0.06] dark:border-white/[0.08]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.rank === 1
                          ? 'bg-brand-light text-white dark:bg-brand-dark dark:text-ink-light'
                          : 'bg-black/5 dark:bg-white/10 text-ink-muted-light'
                      }`}
                    >
                      #{item.rank} Choice
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {item.matchScore}% Balance Score
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-ink-light dark:text-ink-dark">
                    {item.name}
                  </h3>
                </div>
                <span className="font-mono font-bold text-base">₹{item.price}</span>
              </div>

              <div className="flex items-center gap-2 my-2 text-xs font-mono">
                <span className="text-nutrient-protein font-semibold">
                  ~{item.protein.min}–{item.protein.max}g Protein
                </span>
                <span>•</span>
                <span className="text-ink-muted-light dark:text-ink-muted-dark">
                  ~{item.calories.min}–{item.calories.max} kcal
                </span>
              </div>

              <div className="my-3">
                <WhyThisRecommendation reasons={item.reasons} whySummary={item.whySummary} />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => handleTogglePreview(item.id, avgProt, avgCal)}
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
                  onClick={() => navigate(`/log/portion?foodId=${item.matchedFoodId}`)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Log This Choice
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RankedDeliveryResultsPage;
