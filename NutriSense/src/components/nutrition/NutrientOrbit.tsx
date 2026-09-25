import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { NutriMote } from '../animations/NutriMote';
import type { DailyNutritionSummary, NutrientGap } from '../../types';
import type { MoteType } from '../../config/tokens';

interface NutrientOrbitProps {
  summary: DailyNutritionSummary;
  projectedGaps?: Record<string, number>; // What-if projected additions e.g. { protein: 12, iron: 2 }
  onRingClick: (gap: NutrientGap) => void;
  className?: string;
}

interface OrbitRingDef {
  key: string;
  name: string;
  moteType: MoteType;
  radius: number;
  strokeWidth: number;
  color: string;
}

const RINGS: OrbitRingDef[] = [
  { key: 'protein', name: 'Protein', moteType: 'protein', radius: 140, strokeWidth: 8, color: '#2E9E5B' },
  { key: 'carbs', name: 'Carbs', moteType: 'energy', radius: 124, strokeWidth: 7, color: '#F2B33D' },
  { key: 'fat', name: 'Fat', moteType: 'energy', radius: 109, strokeWidth: 7, color: '#7C8CF0' },
  { key: 'fiber', name: 'Fiber', moteType: 'fiber', radius: 95, strokeWidth: 7, color: '#2F9E8F' },
  { key: 'iron', name: 'Iron', moteType: 'iron', radius: 81, strokeWidth: 7, color: '#E2582E' },
  { key: 'calcium', name: 'Calcium', moteType: 'calcium', radius: 68, strokeWidth: 7, color: '#2BB3CE' },
  { key: 'b12', name: 'B12', moteType: 'b12', radius: 55, strokeWidth: 7, color: '#7B5CD6' },
];

export const NutrientOrbit: React.FC<NutrientOrbitProps> = ({
  summary,
  projectedGaps,
  onRingClick,
  className = '',
}) => {
  const [hoveredRing, setHoveredRing] = useState<string | null>(null);

  const getGapForRing = (key: string): NutrientGap | undefined => {
    return summary.gaps.find((g) => g.nutrientKey === key);
  };

  const centerSize = 340;
  const center = centerSize / 2;

  // Calculate average daily completion
  const averageBalance = Math.round(
    summary.gaps.reduce((acc, g) => acc + Math.min(100, g.percentage), 0) / summary.gaps.length
  );

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* SVG Canvas */}
      <div className="relative w-[320px] h-[320px] sm:w-[350px] sm:h-[350px] flex items-center justify-center">
        <svg
          viewBox={`0 0 ${centerSize} ${centerSize}`}
          className="w-full h-full rotate-[-90deg] overflow-visible"
        >
          {RINGS.map((ring) => {
            const gap = getGapForRing(ring.key);
            const pct = gap ? Math.min(100, gap.percentage) : 0;
            const circumference = 2 * Math.PI * ring.radius;
            const strokeDashoffset = circumference - (pct / 100) * circumference;

            // Projected What-if fill
            const projectedAdd = projectedGaps?.[ring.key] || 0;
            const target = gap ? gap.target : 100;
            const currentVal = gap ? gap.consumed : 0;
            const projectedPct = Math.min(100, ((currentVal + projectedAdd) / target) * 100);
            const projectedOffset = circumference - (projectedPct / 100) * circumference;

            const isHovered = hoveredRing === ring.key;

            return (
              <g
                key={ring.key}
                className="cursor-pointer transition-opacity"
                onClick={() => gap && onRingClick(gap)}
                onMouseEnter={() => setHoveredRing(ring.key)}
                onMouseLeave={() => setHoveredRing(null)}
              >
                {/* Background Ring Track */}
                <circle
                  cx={center}
                  cy={center}
                  r={ring.radius}
                  fill="none"
                  stroke={isHovered ? ring.color : 'currentColor'}
                  strokeWidth={ring.strokeWidth}
                  strokeOpacity={isHovered ? 0.25 : 0.08}
                  className="text-black dark:text-white transition-all duration-base"
                />

                {/* What-if Projected Ring (Dashed) */}
                {projectedAdd > 0 && projectedPct > pct && (
                  <motion.circle
                    cx={center}
                    cy={center}
                    r={ring.radius}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={ring.strokeWidth}
                    strokeDasharray="4 4"
                    strokeDashoffset={projectedOffset}
                    strokeLinecap="round"
                    className="opacity-70"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: projectedOffset }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ strokeDasharray: `${circumference} ${circumference}` }}
                  />
                )}

                {/* Actual Consumed Ring Arc */}
                <motion.circle
                  cx={center}
                  cy={center}
                  r={ring.radius}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={isHovered ? ring.strokeWidth + 2 : ring.strokeWidth}
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  strokeLinecap="round"
                  className="transition-all duration-base"
                />

                {/* Orbiting indicator dot */}
                {pct > 5 && (
                  <circle
                    cx={
                      center +
                      ring.radius * Math.cos((pct / 100) * 2 * Math.PI)
                    }
                    cy={
                      center +
                      ring.radius * Math.sin((pct / 100) * 2 * Math.PI)
                    }
                    r={ring.strokeWidth / 2 + 1}
                    fill={ring.color}
                    className="shadow-sm"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Center Core Hub */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center justify-center p-2 rounded-full"
          >
            <NutriMote
              type="protein"
              mood={averageBalance >= 80 ? 'celebrating' : 'curious'}
              size={42}
            />
            <span className="font-display font-bold text-xl sm:text-2xl text-ink-light dark:text-ink-dark mt-1">
              {averageBalance}%
            </span>
            <span className="text-[10px] font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider">
              Balance
            </span>
          </motion.div>
        </div>
      </div>

      {/* Orbit Rings Quick Legend */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 px-2 max-w-sm sm:max-w-md">
        {RINGS.map((ring) => {
          const gap = getGapForRing(ring.key);
          const isHovered = hoveredRing === ring.key;
          return (
            <button
              key={ring.key}
              onClick={() => gap && onRingClick(gap)}
              onMouseEnter={() => setHoveredRing(ring.key)}
              onMouseLeave={() => setHoveredRing(null)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-fast ${
                isHovered
                  ? 'bg-black/10 dark:bg-white/15 scale-105'
                  : 'bg-surface-2-light dark:bg-surface-2-dark hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: ring.color }}
              />
              <span className="text-ink-light dark:text-ink-dark text-[11px] font-semibold">
                {ring.name}
              </span>
              <span className="text-ink-muted-light dark:text-ink-muted-dark text-[10px] font-mono">
                {gap ? `${gap.percentage}%` : '0%'}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-ink-muted-light dark:text-ink-muted-dark mt-2">
        Tap any ring to inspect nutrient gap & food sources
      </p>
    </div>
  );
};
