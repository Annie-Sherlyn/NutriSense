import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { WhyThisRecommendation } from '../../components/nutrition/WhyThisRecommendation';

import type { OCRResult, MenuItem } from '../../types';

interface RankedMenuItem {
  item: MenuItem;
  rank: number;
  matchScore: number;
  estimatedCalories: { min: number; max: number; unit: string };
  estimatedProtein: { min: number; max: number; unit: string };
  whySummary: string;
  reasons: Array<{ key: string; label: string; passed: boolean; profileField?: string }>;
}

export const RankedMenuResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as { ocrResult?: OCRResult } | null;
  const ocrResult = state?.ocrResult;

  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [budget, setBudget] = useState<string>('');

  const baseItems = ocrResult?.items || [];
  
  const rankedItems: RankedMenuItem[] = baseItems.map((item, idx) => ({
    item,
    rank: idx + 1,
    matchScore: 90 - (idx * 2),
    estimatedCalories: { min: 200, max: 400, unit: 'kcal' },
    estimatedProtein: { min: 5, max: 15, unit: 'g' },
    whySummary: 'Matches your nutrient gaps well.',
    reasons: [
      { key: 'protein', label: 'Decent protein', passed: true },
      { key: 'calories', label: 'Fits calorie gap', passed: true }
    ]
  }));

  const handleSelectToLog = (item: MenuItem) => {
    const foodId = item.matchedFoodId || item.id || item.name;
    navigate(`/log/portion?foodId=${encodeURIComponent(foodId)}`);
  };

  const budgetVal = parseFloat(budget);
  const filteredItems = !isNaN(budgetVal) && budgetVal > 0 
      ? rankedItems.filter(r => (r.item.price || 0) <= budgetVal)
      : rankedItems;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Menu Choices"
        subtitle={`Dishes from ${ocrResult?.restaurantName || 'Menu'}.`}
      />

      <div className="flex flex-col gap-2 mb-4 p-4 bg-white dark:bg-black rounded-xl border border-black/5 dark:border-white/10">
        <label className="text-sm font-semibold text-ink-light dark:text-ink-dark">
          Set Maximum Budget (Rs)
        </label>
        <input 
          type="number" 
          value={budget} 
          onChange={(e) => setBudget(e.target.value)} 
          placeholder="e.g. 150"
          className="px-4 py-2 bg-black/5 dark:bg-white/10 rounded-lg text-ink-light dark:text-ink-dark outline-none border border-transparent focus:border-brand-light dark:focus:border-brand-dark"
        />
      </div>

      <div className="flex flex-col gap-4">
        {filteredItems.map((result) => {
          const { item, estimatedCalories, whySummary, reasons } = result;
          const isPreviewing = previewingId === item.id;
          
          return (
            <Card key={item.id} padding="none" className="overflow-hidden border border-black/[0.06] dark:border-white/[0.08]">
              <div className="p-4 sm:p-5 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-base sm:text-lg text-ink-light dark:text-ink-dark truncate">
                      {item.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-ink-muted-light dark:text-ink-muted-dark">
                    {item.price ? <span className="font-semibold text-brand-light dark:text-brand-dark">₹{item.price}</span> : null}
                    <span className="w-1 h-1 rounded-full bg-black/20 dark:bg-white/20" />
                    <span>~{estimatedCalories.min}-{estimatedCalories.max} {estimatedCalories.unit}</span>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-5 py-3 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
                <button
                  onClick={() => setPreviewingId(isPreviewing ? null : (item.id || ''))}
                  className="text-xs sm:text-sm font-semibold text-brand-light dark:text-brand-dark flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  <Eye className="w-4 h-4" />
                  {isPreviewing ? 'Hide Nutrition' : 'Preview Nutrition'}
                </button>
                <Button variant="primary" size="sm" onClick={() => handleSelectToLog(item)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Log Dish
                </Button>
              </div>
              
              {isPreviewing && (
                <div className="border-t border-black/[0.04] dark:border-white/[0.04] bg-white dark:bg-black p-4 sm:p-5">
                  <WhyThisRecommendation
                    whySummary={whySummary}
                    reasons={reasons as any}
                  />
                </div>
              )}
            </Card>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="p-8 text-center text-ink-muted-light dark:text-ink-muted-dark bg-white dark:bg-black rounded-xl border border-dashed border-black/10 dark:border-white/10">
            No dishes found matching your budget.
          </div>
        )}
      </div>
    </div>
  );
};

export default RankedMenuResultsPage;
