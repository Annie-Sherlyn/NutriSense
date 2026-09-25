import React from 'react';
import { motion } from 'framer-motion';
import type { MoteType, MoteMood } from '../../config/tokens';

interface NutriMoteImageProps {
  type: MoteType;
  mood?: MoteMood;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  glow?: boolean;
}

const sizeMap = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 68,
  xl: 96,
  '2xl': 140,
};

// Precise focal crop points for the 7 biological organisms on the master artwork
const CROP_PRESETS: Record<MoteType, { x: string; y: string; scale: number; glowColor: string }> = {
  protein: {
    x: '26%',
    y: '38%',
    scale: 2.7,
    glowColor: 'rgba(46, 158, 91, 0.65)', // Emerald
  },
  iron: {
    x: '72%',
    y: '30%',
    scale: 2.8,
    glowColor: 'rgba(226, 88, 46, 0.65)', // Amber-Rust
  },
  calcium: {
    x: '30%',
    y: '74%',
    scale: 2.7,
    glowColor: 'rgba(43, 179, 206, 0.65)', // Cyan Crystal
  },
  b12: {
    x: '50%',
    y: '18%',
    scale: 2.8,
    glowColor: 'rgba(123, 92, 214, 0.70)', // Violet Halo
  },
  fiber: {
    x: '52%',
    y: '53%',
    scale: 2.7,
    glowColor: 'rgba(47, 158, 143, 0.65)', // Teal Botanical
  },
  hydration: {
    x: '81%',
    y: '52%',
    scale: 3.0,
    glowColor: 'rgba(43, 179, 206, 0.70)', // Aqua Droplet
  },
  energy: {
    x: '67%',
    y: '75%',
    scale: 2.8,
    glowColor: 'rgba(242, 179, 61, 0.70)', // Golden Ember
  },
};

export const NutriMoteImage: React.FC<NutriMoteImageProps> = ({
  type,
  mood = 'idle',
  size = 'md',
  className = '',
  glow = true,
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];
  const crop = CROP_PRESETS[type] || CROP_PRESETS.protein;

  // Calm, static, elegant biological pulse (zero frantic jumping or bouncing)
  const floatAnim = {
    idle: {
      scale: [1, 1.015, 1],
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    },
    curious: {
      scale: [1, 1.025, 1],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
    happy: {
      scale: [1, 1.03, 1],
      transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    },
    celebrating: {
      scale: [1, 1.04, 1],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
    resting: {
      scale: 1,
    },
  };

  return (
    <motion.div
      variants={floatAnim}
      animate={mood}
      style={{
        width: pixelSize,
        height: pixelSize,
      }}
      className={`relative rounded-full flex-shrink-0 select-none ${className}`}
    >
      {/* Bioluminescent ambient glow aura */}
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-md opacity-75 pointer-events-none transition-all duration-300"
          style={{
            backgroundColor: crop.glowColor,
            transform: 'scale(1.15)',
          }}
        />
      )}

      {/* The high-resolution organic creature crop */}
      <div
        className="w-full h-full rounded-full overflow-hidden relative border border-white/25 shadow-sm"
        style={{
          boxShadow: `0 0 ${Math.max(6, pixelSize * 0.2)}px ${crop.glowColor}`,
        }}
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url('/images/motes/nutrimotes_banner.jpg')`,
            backgroundPosition: `${crop.x} ${crop.y}`,
            backgroundSize: `${crop.scale * 100}%`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      </div>
    </motion.div>
  );
};
