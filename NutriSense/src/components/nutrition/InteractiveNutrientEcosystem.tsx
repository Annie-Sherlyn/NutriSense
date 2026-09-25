import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { NutriMote } from '../animations/NutriMote';
import type { DailyNutritionSummary, NutrientGap } from '../../types';
import type { MoteType } from '../../config/tokens';

interface InteractiveNutrientEcosystemProps {
  summary: DailyNutritionSummary;
  projectedGaps?: Record<string, number>;
  onNutrientClick?: (gap: NutrientGap) => void;
  className?: string;
}

type CategoryMode = 'all' | 'macros' | 'micros';

interface NutrientVisualMeta {
  key: string;
  name: string;
  category: 'macro' | 'micro';
  moteType: MoteType;
  color: string;
  glowColor: string;
  gradient: [string, string];
  sources: string[];
  bioTip: string;
}

const NUTRIENT_META: Record<string, NutrientVisualMeta> = {
  protein: {
    key: 'protein',
    name: 'Protein',
    category: 'macro',
    moteType: 'protein',
    color: '#2E9E5B',
    glowColor: 'rgba(46, 158, 91, 0.45)',
    gradient: ['#42B870', '#1F7A44'],
    sources: ['Sprouted Moong', 'Paneer', 'Sattu Drink', 'Chana Dal'],
    bioTip: 'Combine grains with lentils (like Idli or Khichdi) for a complete essential amino acid profile.',
  },
  carbs: {
    key: 'carbs',
    name: 'Complex Carbs',
    category: 'macro',
    moteType: 'energy',
    color: '#F2B33D',
    glowColor: 'rgba(242, 179, 61, 0.45)',
    gradient: ['#F5BE59', '#D98A19'],
    sources: ['Red Rice', 'Millet Roti', 'Ragi Mudde', 'Oats'],
    bioTip: 'Whole millets and unpolished red rice maintain steady post-meal glycemic response.',
  },
  fat: {
    key: 'fat',
    name: 'Healthy Fats',
    category: 'macro',
    moteType: 'energy',
    color: '#7C8CF0',
    glowColor: 'rgba(124, 140, 240, 0.45)',
    gradient: ['#93A0F5', '#5767D6'],
    sources: ['Desi Ghee', 'White Sesame (Til)', 'Groundnut Oil', 'Almonds'],
    bioTip: 'A teaspoon of pure A2 desi ghee enhances absorption of fat-soluble vitamins A, D, E, and K.',
  },
  fiber: {
    key: 'fiber',
    name: 'Dietary Fiber',
    category: 'macro',
    moteType: 'fiber',
    color: '#2F9E8F',
    glowColor: 'rgba(47, 158, 143, 0.45)',
    gradient: ['#42B8A7', '#1D7065'],
    sources: ['Methi Leaves', 'Guava', 'Flaxseed Podi', 'Bhindi'],
    bioTip: 'Soluble fiber from isabgol and chia binds cholesterol and feeds beneficial bifidobacteria.',
  },
  iron: {
    key: 'iron',
    name: 'Iron',
    category: 'micro',
    moteType: 'iron',
    color: '#E2582E',
    glowColor: 'rgba(226, 88, 46, 0.45)',
    gradient: ['#F06A41', '#B83A14'],
    sources: ['Palak', 'Garden Cress Seeds (Halim)', 'Jaggery (Gur)', 'Bajra'],
    bioTip: 'Squeeze fresh lemon (Vitamin C) on chana or dal to multiply non-heme iron absorption by up to 3x.',
  },
  calcium: {
    key: 'calcium',
    name: 'Calcium',
    category: 'micro',
    moteType: 'calcium',
    color: '#2BB3CE',
    glowColor: 'rgba(43, 179, 206, 0.45)',
    gradient: ['#48C6DF', '#167D91'],
    sources: ['Ragi Flour', 'Hung Curd (Dahi)', 'Til Chikki', 'Moringa (Drumstick)'],
    bioTip: 'Ragi has 10x the calcium of polished rice, supporting bone matrix density naturally.',
  },
  b12: {
    key: 'b12',
    name: 'Vitamin B12',
    category: 'micro',
    moteType: 'b12',
    color: '#7B5CD6',
    glowColor: 'rgba(123, 92, 214, 0.45)',
    gradient: ['#9275E5', '#5736B0'],
    sources: ['Homemade Fermented Kanji', 'Dahi', 'Fortified Milk', 'Paneer'],
    bioTip: 'Traditional lactic fermentation in Idli batter and buttermilk naturally creates bioavailable B-vitamins.',
  },
};

export const InteractiveNutrientEcosystem: React.FC<InteractiveNutrientEcosystemProps> = ({
  summary,
  projectedGaps,
  onNutrientClick,
  className = '',
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryMode>('all');
  const [selectedNutrientKey, setSelectedNutrientKey] = useState<string>('protein');
  const [isHoveringNutrient, setIsHoveringNutrient] = useState<string | null>(null);

  // Filtered nutrients list based on tab
  const displayedNutrients = useMemo(() => {
    const list = Object.values(NUTRIENT_META);
    if (activeCategory === 'macros') return list.filter((n) => n.category === 'macro');
    if (activeCategory === 'micros') return list.filter((n) => n.category === 'micro');
    return list;
  }, [activeCategory]);

  // Overall completion score (average of all 7 ICMR targets)
  const averageBalanceScore = useMemo(() => {
    if (!summary?.gaps?.length) return 68;
    const sum = summary.gaps.reduce((acc, g) => acc + Math.min(100, g.percentage), 0);
    return Math.round(sum / summary.gaps.length);
  }, [summary]);

  const activeKey = isHoveringNutrient || selectedNutrientKey;
  const activeMeta = NUTRIENT_META[activeKey] || NUTRIENT_META.protein;
  const activeGap = summary?.gaps?.find((g) => g.nutrientKey === activeKey);

  const activeProjectedAdd = projectedGaps?.[activeKey] || 0;
  const activeTarget = activeGap?.target || 65;
  const activeConsumed = (activeGap?.consumed || 0) + activeProjectedAdd;
  const activePercentage = Math.round((activeConsumed / activeTarget) * 100);

  // SVG Geometry constants
  const size = 360;
  const center = size / 2;
  const outerRadius = 145;
  const innerRadius = 88;

  return (
    <div className={`w-full flex flex-col gap-6 ${className}`}>
      {/* 1. Header Toolbar & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-black/[0.05] dark:border-white/[0.06]">
        <div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-ink-light dark:text-ink-dark flex items-center gap-2">
            <span>Nutrient Ecosystem</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-light/10 text-brand-light dark:bg-brand-dark/20 dark:text-brand-dark border border-brand-light/20">
              ICMR-NIN 2024
            </span>
          </h2>
          <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark mt-0.5">
            Interactive biological balance across essential Indian nutritional benchmarks
          </p>
        </div>

        {/* View Filters */}
        <div className="flex items-center p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] self-start sm:self-auto border border-black/[0.04] dark:border-white/[0.04]">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-surface-light dark:bg-surface-dark text-ink-light dark:text-ink-dark shadow-sm'
                : 'text-ink-muted-light dark:text-ink-muted-dark hover:text-ink-light'
            }`}
          >
            All Nutrients
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('macros')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === 'macros'
                ? 'bg-surface-light dark:bg-surface-dark text-ink-light dark:text-ink-dark shadow-sm'
                : 'text-ink-muted-light dark:text-ink-muted-dark hover:text-ink-light'
            }`}
          >
            Macros
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('micros')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === 'micros'
                ? 'bg-surface-light dark:bg-surface-dark text-ink-light dark:text-ink-dark shadow-sm'
                : 'text-ink-muted-light dark:text-ink-muted-dark hover:text-ink-light'
            }`}
          >
            Micros & Minerals
          </button>
        </div>
      </div>

      {/* 2. Interactive Chart Stage + Live Bioavailability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Visual Chart Canvas (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative select-none">
          {/* Ambient Glow corresponding to active nutrient */}
          <div
            className="absolute w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-700 opacity-25"
            style={{ backgroundColor: activeMeta.color }}
          />

          <div className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] flex items-center justify-center">
            {/* SVG Sunburst Radial Ecosystem */}
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
              <defs>
                {Object.values(NUTRIENT_META).map((item) => (
                  <linearGradient
                    key={`grad-${item.key}`}
                    id={`grad-${item.key}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={item.gradient[0]} />
                    <stop offset="100%" stopColor={item.gradient[1]} />
                  </linearGradient>
                ))}
              </defs>

              {/* Background Concentric Radial Grid Lines */}
              <circle
                cx={center}
                cy={center}
                r={outerRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 6"
                className="text-black/[0.08] dark:text-white/[0.08]"
              />
              <circle
                cx={center}
                cy={center}
                r={(outerRadius + innerRadius) / 2}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="3 5"
                className="text-black/[0.06] dark:text-white/[0.06]"
              />
              <circle
                cx={center}
                cy={center}
                r={innerRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-black/[0.08] dark:text-white/[0.08]"
              />

              {/* Radial Ray Pillars / Nutrient Arcs */}
              {displayedNutrients.map((item, idx) => {
                const count = displayedNutrients.length;
                const sliceAngle = (2 * Math.PI) / count;
                const startAngle = idx * sliceAngle - Math.PI / 2;
                const midAngle = startAngle + sliceAngle / 2;

                const gap = summary?.gaps?.find((g) => g.nutrientKey === item.key);
                const projectedAdd = projectedGaps?.[item.key] || 0;
                const target = gap?.target || 100;
                const consumed = (gap?.consumed || 0) + projectedAdd;
                const pct = Math.min(100, Math.max(8, Math.round((consumed / target) * 100)));

                // Calculate petal ray length
                const currentRadius = innerRadius + (outerRadius - innerRadius) * (pct / 100);

                const isSelected = activeKey === item.key;

                // Coordinates for line ray & end node
                const x1 = center + Math.cos(midAngle) * (innerRadius + 4);
                const y1 = center + Math.sin(midAngle) * (innerRadius + 4);
                const x2 = center + Math.cos(midAngle) * currentRadius;
                const y2 = center + Math.sin(midAngle) * currentRadius;

                // Outer boundary guide
                const xOuter = center + Math.cos(midAngle) * (outerRadius + 18);
                const yOuter = center + Math.sin(midAngle) * (outerRadius + 18);

                return (
                  <g
                    key={item.key}
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedNutrientKey(item.key);
                      if (gap && onNutrientClick) onNutrientClick(gap);
                    }}
                    onMouseEnter={() => setIsHoveringNutrient(item.key)}
                    onMouseLeave={() => setIsHoveringNutrient(null)}
                  >
                    {/* Hover hotspot wedge */}
                    <line
                      x1={center + Math.cos(midAngle) * innerRadius}
                      y1={center + Math.sin(midAngle) * innerRadius}
                      x2={center + Math.cos(midAngle) * (outerRadius + 24)}
                      y2={center + Math.sin(midAngle) * (outerRadius + 24)}
                      stroke="transparent"
                      strokeWidth={size / count}
                      strokeLinecap="round"
                    />

                    {/* Track Backing Ray */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={center + Math.cos(midAngle) * outerRadius}
                      y2={center + Math.sin(midAngle) * outerRadius}
                      stroke={item.color}
                      strokeWidth={isSelected ? 10 : 8}
                      strokeOpacity={isSelected ? 0.25 : 0.1}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />

                    {/* Active Progress Ray */}
                    <motion.line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={`url(#grad-${item.key})`}
                      strokeWidth={isSelected ? 12 : 8}
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{
                        filter: isSelected ? `drop-shadow(0 0 10px ${item.glowColor})` : 'none',
                      }}
                      className="transition-all duration-300"
                    />

                    {/* Tip Glowing Node */}
                    <motion.circle
                      cx={x2}
                      cy={y2}
                      r={isSelected ? 6.5 : 4.5}
                      fill="#FFFFFF"
                      stroke={item.color}
                      strokeWidth="2.5"
                      animate={isSelected ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                      transition={{ duration: 1.5, repeat: isSelected ? Infinity : 0 }}
                      className="transition-all duration-300"
                    />

                    {/* Outer Label */}
                    <text
                      x={xOuter}
                      y={yOuter}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={`text-[11px] font-sans font-semibold transition-all duration-200 select-none ${
                        isSelected
                          ? 'font-bold fill-ink-light dark:fill-ink-dark scale-110'
                          : 'fill-ink-muted-light dark:fill-ink-muted-dark opacity-75'
                      }`}
                    >
                      {item.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Living Central Biome / Core */}
            <div
              onClick={() => setSelectedNutrientKey('protein')}
              className="absolute w-36 h-36 rounded-full bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] shadow-xl flex flex-col items-center justify-center text-center p-2 cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="w-8 h-8 flex items-center justify-center mb-0.5">
                <NutriMote type={activeMeta.moteType} mood="happy" size={30} />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight text-ink-light dark:text-ink-dark leading-none">
                {averageBalanceScore}%
              </span>
              <span className="text-[10px] font-semibold text-brand-light dark:text-brand-dark uppercase tracking-wider mt-1">
                Daily Balance
              </span>
              <span className="text-[9px] text-ink-muted-light dark:text-ink-muted-dark leading-none mt-0.5">
                Tap node to inspect
              </span>
            </div>
          </div>

          {projectedGaps && (
            <div className="mt-3 px-3 py-1 rounded-full bg-brand-light/10 text-brand-light dark:bg-brand-dark/20 dark:text-brand-dark text-xs font-semibold flex items-center gap-1.5 border border-brand-light/20 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive What-If Simulation Active</span>
            </div>
          )}
        </div>

        {/* Live Bioavailability & Nutrient Inspector Card (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMeta.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl p-5 sm:p-6 bg-surface-light dark:bg-surface-dark border border-black/[0.06] dark:border-white/[0.08] shadow-soft relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: activeMeta.color }}
              />

              {/* Inspector Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-sm"
                    style={{ backgroundColor: activeMeta.color }}
                  >
                    <NutriMote type={activeMeta.moteType} mood="celebrating" size={26} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted-light dark:text-ink-muted-dark">
                      {activeMeta.category === 'macro' ? 'Macronutrient' : 'Vital Micronutrient'}
                    </span>
                    <h3 className="font-display font-bold text-xl text-ink-light dark:text-ink-dark leading-tight">
                      {activeMeta.name}
                    </h3>
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                  style={{
                    backgroundColor: `${activeMeta.color}15`,
                    color: activeMeta.color,
                  }}
                >
                  {activePercentage >= 90 ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Optimal</span>
                    </>
                  ) : activePercentage >= 60 ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>On Track</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Needs Boost</span>
                    </>
                  )}
                </div>
              </div>

              {/* Metric Progress Bar */}
              <div className="mb-5">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="font-display font-bold text-2xl text-ink-light dark:text-ink-dark">
                    {Math.round(activeConsumed * 10) / 10}
                    <span className="text-xs font-sans text-ink-muted-light dark:text-ink-muted-dark ml-1">
                      {activeGap?.unit || 'g'}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark">
                    Goal: {activeTarget} {activeGap?.unit || 'g'} ({activePercentage}%)
                  </span>
                </div>

                {/* Bar */}
                <div className="w-full h-3 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden p-0.5">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, activePercentage)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ backgroundColor: activeMeta.color }}
                  />
                </div>
              </div>

              {/* Bioavailability & Absorption Science */}
              <div className="p-3.5 rounded-2xl bg-surface-2-light dark:bg-surface-2-dark border border-black/[0.04] dark:border-white/[0.04] mb-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink-light dark:text-ink-dark mb-1">
                  <ShieldCheck className="w-4 h-4 text-brand-light dark:text-brand-dark" />
                  <span>Indian Bioavailability Science</span>
                </div>
                <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark leading-relaxed">
                  {activeMeta.bioTip}
                </p>
              </div>

              {/* Recommended Indian Food Sources */}
              <div>
                <span className="text-[11px] font-semibold text-ink-muted-light dark:text-ink-muted-dark block mb-2">
                  Top Indian Sources to Close Gap:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeMeta.sources.map((food) => (
                    <span
                      key={food}
                      className="px-2.5 py-1 rounded-xl text-xs font-medium bg-black/[0.04] dark:bg-white/[0.06] text-ink-light dark:text-ink-dark border border-black/[0.04] dark:border-white/[0.04]"
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Interactive Quick Nutrient Pills Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {displayedNutrients.map((item) => {
          const gap = summary?.gaps?.find((g) => g.nutrientKey === item.key);
          const target = gap?.target || 100;
          const consumed = gap?.consumed || 0;
          const pct = Math.min(100, Math.round((consumed / target) * 100));
          const isSelected = activeKey === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelectedNutrientKey(item.key)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl border transition-all flex-shrink-0 cursor-pointer text-left ${
                isSelected
                  ? 'bg-surface-light dark:bg-surface-dark border-brand-light dark:border-brand-dark shadow-sm scale-102 ring-2 ring-brand-light/20'
                  : 'bg-surface-2-light/60 dark:bg-surface-2-dark/60 border-black/[0.05] dark:border-white/[0.06] hover:bg-surface-light'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div>
                <span className="text-xs font-bold text-ink-light dark:text-ink-dark block leading-none">
                  {item.name}
                </span>
                <span className="text-[10px] text-ink-muted-light dark:text-ink-muted-dark font-mono">
                  {pct}% met
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InteractiveNutrientEcosystem;
