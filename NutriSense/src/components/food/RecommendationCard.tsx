import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Eye, Sparkles, Scale } from 'lucide-react';
import { Card } from '../common/Card';
import { FoodImage } from './FoodImage';
import { Button } from '../common/Button';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import { WhyThisRecommendation } from '../nutrition/WhyThisRecommendation';
import type { Recommendation } from '../../types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAddToMeal: (rec: Recommendation) => void;
  onPreviewImpact?: (rec: Recommendation, active: boolean) => void;
  onCompare?: (rec: Recommendation) => void;
  onViewDetails?: (rec: Recommendation) => void;
  className?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onAddToMeal,
  onPreviewImpact,
  onCompare,
  onViewDetails,
  className = '',
}) => {
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  const togglePreview = () => {
    const next = !isPreviewActive;
    setIsPreviewActive(next);
    onPreviewImpact?.(recommendation, next);
  };

  return (
    <motion.div layout layoutId={`rec-card-${recommendation.id}`} className={className}>
      <Card
        padding="none"
        className="overflow-hidden border border-black/[0.06] dark:border-white/[0.08] flex flex-col justify-between"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Dish Image */}
          <div className="relative w-full sm:w-44 h-40 sm:h-auto bg-surface-2-light dark:bg-surface-2-dark flex-shrink-0">
            <FoodImage
              src={recommendation.image}
              alt={recommendation.dishName}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 left-2.5">
              <ConfidenceBadge confidence={recommendation.confidence} showPercentage />
            </div>
            <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-white font-mono text-xs font-semibold">
              ₹{recommendation.estimatedPrice}
            </div>
          </div>

          {/* Details */}
          <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-ink-light dark:text-ink-dark">
                    {recommendation.dishName}
                  </h3>
                  {recommendation.regionalName && (
                    <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
                      {recommendation.regionalName}
                    </p>
                  )}
                </div>
              </div>

              {/* Estimates as ranges (never false precision) */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono">
                  ~{recommendation.estimatedProtein.min}–{recommendation.estimatedProtein.max}{' '}
                  {recommendation.estimatedProtein.unit} protein
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono">
                  ~{recommendation.estimatedCalories.min}–{recommendation.estimatedCalories.max}{' '}
                  {recommendation.estimatedCalories.unit}
                </span>
              </div>

              {/* Explainability section */}
              <div className="mt-3.5">
                <WhyThisRecommendation
                  reasons={recommendation.reasons}
                  whySummary={recommendation.whySummary}
                />
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                {onPreviewImpact && (
                  <button
                    type="button"
                    onClick={togglePreview}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all select-none min-h-[36px] ${
                      isPreviewActive
                        ? 'bg-brand-light text-white shadow-soft dark:bg-brand-dark dark:text-ink-light'
                        : 'bg-surface-2-light dark:bg-surface-2-dark text-ink-light dark:text-ink-dark hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                    aria-label="Preview impact on nutrient rings"
                  >
                    {isPreviewActive ? (
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>{isPreviewActive ? 'Previewing' : 'Preview impact'}</span>
                  </button>
                )}

                {onCompare && (
                  <button
                    type="button"
                    onClick={() => onCompare(recommendation)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-2-light dark:bg-surface-2-dark text-ink-muted-light hover:text-ink-light dark:text-ink-muted-dark dark:hover:text-ink-dark transition-all select-none min-h-[36px]"
                    aria-label="Compare food with others"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Compare</span>
                  </button>
                )}

                {onViewDetails && (
                  <button
                    type="button"
                    onClick={() => onViewDetails(recommendation)}
                    className="text-xs text-ink-muted-light dark:text-ink-muted-dark hover:text-ink-light dark:hover:text-ink-dark font-medium underline underline-offset-2 ml-1"
                  >
                    Nutrition
                  </button>
                )}
              </div>

              <Button
                size="sm"
                onClick={() => onAddToMeal(recommendation)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add to Meal
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
