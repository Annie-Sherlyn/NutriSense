import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { nutritionService } from '../../services/nutrition.service';
import type { WeeklyNutritionSummary } from '../../types';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<WeeklyNutritionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeNutrient, setActiveNutrient] = useState<
    'proteinPct' | 'ironPct' | 'calciumPct' | 'b12Pct' | 'fiberPct'
  >('proteinPct');

  useEffect(() => {
    nutritionService.getWeeklySummary().then((data) => {
      setSummary(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <div className="py-16 text-center text-xs text-ink-muted-light animate-pulse">Loading weekly trends…</div>;
  }

  if (!summary) {
    return (
      <EmptyState
        title="Weekly Trends"
        description="Log meals for a few days and your weekly patterns will appear here."
        moteType="protein"
        actionLabel="Log a meal"
        onAction={() => navigate('/log')}
      />
    );
  }

  const nutrientColorMap = {
    proteinPct: { name: 'Protein', color: '#2E9E5B' },
    ironPct: { name: 'Dietary Iron', color: '#E2582E' },
    calciumPct: { name: 'Calcium', color: '#2BB3CE' },
    b12Pct: { name: 'Vitamin B12', color: '#7B5CD6' },
    fiberPct: { name: 'Dietary Fiber', color: '#2F9E8F' },
  };

  const currentNutrient = nutrientColorMap[activeNutrient];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Weekly Nutrition Report"
            subtitle={`Consolidated weekly patterns for ${summary.weekLabel}.`}
            className="mb-0"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-surface-light dark:bg-surface-dark px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 shadow-soft text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5 text-brand-light dark:text-brand-dark" />
          <span>{summary.weekLabel}</span>
        </div>
      </div>

      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card padding="md">
          <span className="text-[11px] font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider block">
            Weekly Consistency
          </span>
          <span className="font-display font-bold text-2xl text-ink-light dark:text-ink-dark mt-1 block">
            {summary.consistencyScore}%
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Solid logging rhythm
          </span>
        </Card>

        <Card padding="md">
          <span className="text-[11px] font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider block">
            Most Improved
          </span>
          <span className="font-display font-bold text-lg text-emerald-600 dark:text-emerald-400 mt-1 block truncate">
            {summary.mostImprovedNutrient}
          </span>
          <span className="text-[11px] text-ink-muted-light dark:text-ink-muted-dark">
            Higher pulse density
          </span>
        </Card>

        <Card padding="md">
          <span className="text-[11px] font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider block">
            Persistent Gap
          </span>
          <span className="font-display font-bold text-lg text-amber-600 dark:text-amber-400 mt-1 block truncate">
            {summary.persistentGapNutrient}
          </span>
          <span className="text-[11px] text-ink-muted-light dark:text-ink-muted-dark">
            Requires focus next week
          </span>
        </Card>

        <Card padding="md">
          <span className="text-[11px] font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider block">
            Completeness
          </span>
          <span className="font-display font-bold text-2xl text-ink-light dark:text-ink-dark mt-1 block">
            {summary.loggingCompleteness}/7 Days
          </span>
          <span className="text-[11px] text-ink-muted-light dark:text-ink-muted-dark">
            Active daily records
          </span>
        </Card>
      </div>

      {/* Hand-Built SVG Trend Chart */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-display font-bold text-lg text-ink-light dark:text-ink-dark">
              Daily Nutrient Trend ({currentNutrient.name})
            </h3>
            <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
              Daily percentage of target achieved throughout the week
            </p>
          </div>

          {/* Nutrient Switcher Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {Object.entries(nutrientColorMap).map(([key, def]) => (
              <button
                key={key}
                onClick={() => setActiveNutrient(key as typeof activeNutrient)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeNutrient === key
                    ? 'bg-brand-light text-white dark:bg-brand-dark dark:text-ink-light shadow-soft'
                    : 'bg-surface-2-light dark:bg-surface-2-dark text-ink-light dark:text-ink-dark hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {def.name}
              </button>
            ))}
          </div>
        </div>

        {/* Hand-crafted SVG Bar Chart */}
        <div className="w-full h-56 relative flex items-end justify-between px-2 pt-8 pb-6 border-b border-black/[0.06] dark:border-white/[0.08]">
          {/* Target 100% reference line */}
          <div className="absolute inset-x-0 top-10 border-b border-dashed border-emerald-500/40 pointer-events-none flex justify-end pr-2">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono -mt-4">
              100% Target
            </span>
          </div>

          {summary.days.map((day) => {
            const pct = day[activeNutrient] as number;
            const barHeightPct = Math.min(100, Math.max(10, pct));
            const isTargetMet = pct >= 100;

            return (
              <div key={day.date} className="flex flex-col items-center flex-1 h-full justify-end group">
                {/* Hover value tooltip */}
                <span className="text-[10px] font-mono font-bold text-ink-muted-light dark:text-ink-muted-dark mb-1 group-hover:text-brand-light transition-colors">
                  {pct}%
                </span>

                {/* Vertical Bar */}
                <div className="w-7 sm:w-10 rounded-t-xl bg-surface-2-light dark:bg-surface-2-dark overflow-hidden flex items-end h-36">
                  <div
                    className="w-full rounded-t-xl transition-all duration-500 group-hover:opacity-90 shadow-sm"
                    style={{
                      height: `${barHeightPct}%`,
                      backgroundColor: isTargetMet ? '#2E9E5B' : currentNutrient.color,
                    }}
                  />
                </div>

                {/* Day Label */}
                <span
                  className={`text-xs mt-2 font-medium ${
                    day.isToday ? 'font-bold text-brand-light dark:text-brand-dark' : 'text-ink-muted-light'
                  }`}
                >
                  {day.day}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Careful Language Nutrient Gap Notice (Section 12 Non-Negotiable) */}
      <Card padding="lg" className="border-l-4 border-l-amber-500 bg-amber-500/[0.04]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
              Dietary Pattern Observation
            </span>
            <p className="text-sm font-semibold text-ink-light dark:text-ink-dark leading-relaxed">
              {summary.carefulGapNotice}
            </p>
            <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark mt-2 leading-relaxed">
              NutriSense observations are educational estimates derived from your logged items. This is not a clinical assessment or medical diagnosis.
            </p>
          </div>
        </div>
      </Card>

      {/* Suggested Indian Foods to Bridge Persistent Gaps */}
      <Card padding="md">
        <h3 className="font-display font-bold text-base text-ink-light dark:text-ink-dark mb-3">
          Suggested Foods to Balance Gaps Next Week
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {summary.foodSuggestions.map((sug, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-surface-2-light dark:bg-surface-2-dark border border-black/5 dark:border-white/5 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-brand-light dark:text-brand-dark uppercase tracking-wider block mb-1">
                  Rich in {sug.richIn}
                </span>
                <h4 className="font-display font-semibold text-sm text-ink-light dark:text-ink-dark">
                  {sug.foodName}
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-ink-muted-light mt-3 block">
                Typical cost: ₹{sug.price}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
