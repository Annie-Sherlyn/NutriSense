import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  percentage: number; // 0 to 100+
  projectedPercentage?: number; // What-if projected preview
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  projectedPercentage,
  size = 120,
  strokeWidth = 10,
  color = '#2E9E5B',
  backgroundColor,
  children,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Clamp display percentage
  const fillPct = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (fillPct / 100) * circumference;

  // Projected offset if What-if is active
  const projectedPct = projectedPercentage
    ? Math.min(100, Math.max(fillPct, projectedPercentage))
    : fillPct;
  const projectedOffset = circumference - (projectedPct / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg] overflow-visible">
        {/* Track background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor || 'currentColor'}
          strokeWidth={strokeWidth}
          className="text-black/[0.06] dark:text-white/[0.08]"
        />

        {/* Projected What-if dashed arc */}
        {projectedPercentage && projectedPercentage > percentage && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray="4 4"
            strokeDashoffset={projectedOffset}
            strokeLinecap="round"
            className="opacity-75"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: projectedOffset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ strokeDasharray: `${circumference} ${circumference}` }}
          />
        )}

        {/* Actual progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        {children}
      </div>
    </div>
  );
};
