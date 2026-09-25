import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Filter } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Tabs } from '../../components/common/Tabs';
import { FilterChip } from '../../components/common/FilterChip';
import { RecommendationCard } from '../../components/food/RecommendationCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Card } from '../../components/common/Card';
import { useApp } from '../../context/AppContext';
import { recommendationService } from '../../services/recommendation.service';
import type { Recommendation, MealType } from '../../types';

const SNACK_FILTERS = [
  'All',
  'High Protein',
  'Iron Rich',
  'Under ₹100',
  'Vegetarian',
  'Low Calorie',
  'Quick',
];

export const RecommendationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { todaySummary, setProjectedGaps } = useApp();

  const [activeTab, setActiveTab] = useState<'next-meal' | 'smart-snacks'>('next-meal');
  const [activeFilter, setActiveFilter] = useState('All');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [smartSnacks, setSmartSnacks] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Determine current meal window
  const getCurrentWindow = (): { name: string; type: MealType } => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 11) return { name: 'Breakfast time', type: 'breakfast' };
    if (hr >= 11 && hr < 15) return { name: 'Lunch time', type: 'lunch' };
    if (hr >= 15 && hr < 19) return { name: 'Evening snack time', type: 'snack' };
    return { name: 'Dinner time', type: 'dinner' };
  };

  const currentWindow = getCurrentWindow();

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      recommendationService.getRecommendations(),
      recommendationService.getSmartSnacks(activeFilter),
    ]).then(([recs, snacks]) => {
      setRecommendations(recs);
      setSmartSnacks(snacks);
      setIsLoading(false);
    });
  }, [activeFilter]);

  const proteinGap = todaySummary?.gaps.find((g) => g.nutrientKey === 'protein');

  const handlePreviewImpact = (rec: Recommendation, active: boolean) => {
    if (active) {
      setProjectedGaps({
        protein: (rec.estimatedProtein.min + rec.estimatedProtein.max) / 2,
        calories: (rec.estimatedCalories.min + rec.estimatedCalories.max) / 2,
      });
    } else {
      setProjectedGaps(undefined);
    }
  };

  const handleAddToMeal = (rec: Recommendation) => {
    navigate(`/log/portion?foodId=${rec.foodId}`);
  };

  const handleCompare = (rec: Recommendation) => {
    navigate(`/compare?foodA=${rec.foodId}`);
  };

  const displayList = activeTab === 'next-meal' ? recommendations : smartSnacks;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Personalized Recommendations"
        subtitle="Explainable food choices calibrated to what you have already eaten today."
      />

      {/* Eating Window & Protein Gap Status Card */}
      <Card padding="md" className="bg-gradient-to-br from-brand-light/10 to-transparent border-brand-light/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-light dark:bg-brand-dark text-white dark:text-ink-light flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-brand-light dark:text-brand-dark uppercase tracking-wider">
                {currentWindow.name}
              </span>
              <h3 className="font-display font-bold text-base sm:text-lg text-ink-light dark:text-ink-dark">
                {proteinGap ? `~${proteinGap.consumed}g protein logged so far` : 'Tracking your intake'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold">
              ~{proteinGap?.remaining || 35}g Protein remaining today
            </span>
          </div>
        </div>
      </Card>

      {/* Main Mode Tabs: Next Meal vs Smart Snacks */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs
          tabs={[
            { id: 'next-meal', label: 'Next-Meal Recommendations' },
            { id: 'smart-snacks', label: 'Smart Indian Snacks', badge: smartSnacks.length },
          ]}
          activeTab={activeTab}
          onChange={(t) => setActiveTab(t as 'next-meal' | 'smart-snacks')}
        />

        {activeTab === 'next-meal' && (
          <span className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
            Ranked by priority nutrient gaps
          </span>
        )}
      </div>

      {/* Smart Snacks Sub-filter Chips */}
      {activeTab === 'smart-snacks' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <Filter className="w-4 h-4 text-ink-muted-light dark:text-ink-muted-dark ml-1 mr-1 flex-shrink-0" />
          {SNACK_FILTERS.map((f) => (
            <FilterChip
              key={f}
              label={f}
              isSelected={activeFilter === f}
              onClick={() => setActiveFilter(f)}
            />
          ))}
        </div>
      )}

      {/* Recommendations Cards Grid (Animated layout reorder) */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-ink-muted-light animate-pulse">
          Building personalized recommendations…
        </div>
      ) : displayList.length > 0 ? (
        <motion.div layout className="flex flex-col gap-4">
          <AnimatePresence>
            {displayList.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onAddToMeal={handleAddToMeal}
                onPreviewImpact={handlePreviewImpact}
                onCompare={handleCompare}
                onViewDetails={(r) => navigate(`/log/portion?foodId=${r.foodId}`)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState
          title="No recommendations match this filter"
          description="We need at least one logged meal or a selected nutrition goal before generating personalized suggestions."
          moteType="fiber"
          actionLabel="Log a meal"
          onAction={() => navigate('/log')}
          secondaryActionLabel="Reset filters"
          onSecondaryAction={() => setActiveFilter('All')}
        />
      )}
    </div>
  );
};

export default RecommendationsPage;
