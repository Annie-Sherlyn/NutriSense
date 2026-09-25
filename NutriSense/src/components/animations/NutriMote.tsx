import React from 'react';
import { motion, type Variants } from 'framer-motion';
import type { MoteType, MoteMood } from '../../config/tokens';
import { NutriMoteImage } from './NutriMoteImage';

interface NutriMoteProps {
  type: MoteType;
  mood?: MoteMood;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  progress?: number; // 0 to 1 (brightness/reactivity)
  className?: string;
  showLabel?: boolean;
  mode?: 'artwork' | 'svg';
}

const sizeMap = {
  xs: 20,
  sm: 28,
  md: 44,
  lg: 64,
  xl: 96,
  '2xl': 128,
};

export const NutriMote: React.FC<NutriMoteProps> = ({
  type,
  mood = 'idle',
  size = 'md',
  progress = 0.5,
  className = '',
  showLabel = false,
  mode = 'artwork',
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];

  if (mode === 'artwork') {
    return (
      <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
        <NutriMoteImage type={type} mood={mood} size={pixelSize} />
        {showLabel && (
          <span className="text-[10px] font-semibold tracking-wider text-ink-muted-light dark:text-ink-muted-dark uppercase capitalize">
            {type}
          </span>
        )}
      </div>
    );
  }

  // Motion variants based on mood - calm, static, elegant
  const floatVariants: Variants = {
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

  const glowIntensity = Math.min(1, Math.max(0.3, progress));

  // Render SVG based on organism type
  const renderOrganism = () => {
    switch (type) {
      case 'protein':
        // Linked chain of 3 rounded hexagon beads that flex
        return (
          <g>
            <defs>
              <linearGradient id="protGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#42B870" />
                <stop offset="100%" stop-color="#216E3F" />
              </linearGradient>
              <filter id="protGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <motion.path
              d="M 22 50 L 32 32 L 48 32 L 58 50 L 48 68 L 32 68 Z"
              fill="url(#protGrad)"
              filter="url(#protGlow)"
              animate={{ rotate: [-2, 3, -2] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '40px 50px' }}
            />
            <motion.path
              d="M 46 50 L 56 34 L 70 34 L 80 50 L 70 66 L 56 66 Z"
              fill="url(#protGrad)"
              animate={{ rotate: [2, -4, 2] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '63px 50px' }}
            />
            <motion.path
              d="M 68 50 L 78 36 L 90 36 L 98 50 L 90 64 L 78 64 Z"
              fill="#2E9E5B"
              animate={{ rotate: [-3, 2, -3] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '83px 50px' }}
            />
            {/* Soft glowing cores */}
            <circle cx="40" cy="50" r="3" fill="#D5EEE1" opacity={0.9 * glowIntensity} />
            <circle cx="63" cy="50" r="3" fill="#D5EEE1" opacity={0.9 * glowIntensity} />
            <circle cx="83" cy="50" r="2.5" fill="#D5EEE1" opacity={0.8 * glowIntensity} />
          </g>
        );

      case 'iron':
        // Warm rust-orange faceted pebble with a metallic sheen
        return (
          <g>
            <defs>
              <linearGradient id="ironGrad" x1="15%" y1="15%" x2="85%" y2="85%">
                <stop offset="0%" stop-color="#F5855A" />
                <stop offset="50%" stop-color="#E2582E" />
                <stop offset="100%" stop-color="#9C3212" />
              </linearGradient>
            </defs>
            <path
              d="M 50 20 L 78 32 L 86 64 L 62 82 L 32 72 L 24 44 Z"
              fill="url(#ironGrad)"
            />
            {/* Facet planes */}
            <path d="M 50 20 L 56 50 L 78 32 Z" fill="#FFA785" opacity={0.4} />
            <path d="M 56 50 L 86 64 L 78 32 Z" fill="#75220A" opacity={0.3} />
            <path d="M 56 50 L 62 82 L 32 72 Z" fill="#C4441D" opacity={0.5} />
            <path d="M 24 44 L 56 50 L 32 72 Z" fill="#FFA785" opacity={0.3} />
            {/* Metallic shimmer point */}
            <motion.circle
              cx="54"
              cy="42"
              r="3.5"
              fill="#FFFFFF"
              animate={{ opacity: [0.3, 0.95, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </g>
        );

      case 'calcium':
        // Pale translucent crystal shard cluster
        return (
          <g>
            <defs>
              <linearGradient id="calcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#BDECF5" />
                <stop offset="50%" stop-color="#2BB3CE" />
                <stop offset="100%" stop-color="#147285" />
              </linearGradient>
            </defs>
            {/* Shard 1 */}
            <polygon points="50,14 62,48 50,84 38,48" fill="url(#calcGrad)" opacity={0.9} />
            {/* Shard 2 left */}
            <polygon points="34,32 46,58 36,80 24,54" fill="#67D3E8" opacity={0.75} />
            {/* Shard 3 right */}
            <polygon points="66,30 78,56 68,78 56,52" fill="#1C8BA1" opacity={0.8} />
            {/* Crystalline light catch */}
            <polygon points="50,16 54,48 50,80 48,48" fill="#FFFFFF" opacity={0.6 * glowIntensity} />
            <circle cx="50" cy="46" r="2.5" fill="#FFFFFF" opacity={0.95} />
          </g>
        );

      case 'b12':
        // Indigo-violet glowing orb with a thin orbiting halo ring
        return (
          <g>
            <defs>
              <radialGradient id="b12Core" cx="45%" cy="40%" r="55%">
                <stop offset="0%" stop-color="#BAA5FA" />
                <stop offset="60%" stop-color="#7B5CD6" />
                <stop offset="100%" stop-color="#41278C" />
              </radialGradient>
            </defs>
            {/* Orbit ring */}
            <motion.ellipse
              cx="50"
              cy="50"
              rx="40"
              ry="16"
              fill="none"
              stroke="#B298FC"
              strokeWidth="2.5"
              strokeDasharray="4 4"
              transform="rotate(-24 50 50)"
              animate={{ rotate: [-24, 336] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
            {/* Core orb */}
            <circle cx="50" cy="50" r="26" fill="url(#b12Core)" />
            {/* Glowing core twin points */}
            <circle cx="44" cy="46" r="2.5" fill="#FFFFFF" opacity={0.85 * glowIntensity} />
            <circle cx="56" cy="48" r="2" fill="#E4DBFD" opacity={0.75 * glowIntensity} />
          </g>
        );

      case 'hydration':
        // Transparent droplet with a moving inner ripple
        return (
          <g>
            <defs>
              <linearGradient id="dropGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#A5E7F5" />
                <stop offset="60%" stop-color="#2BB3CE" />
                <stop offset="100%" stop-color="#146B7C" />
              </linearGradient>
            </defs>
            <path
              d="M 50 16 C 50 16 22 52 22 68 C 22 84 34 94 50 94 C 66 94 78 84 78 68 C 78 52 50 16 50 16 Z"
              fill="url(#dropGrad)"
              opacity={0.92}
            />
            {/* Inner ripple animation */}
            <motion.ellipse
              cx="50"
              cy="68"
              rx="16"
              ry="10"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.8"
              animate={{ scale: [0.7, 1.15, 0.7], opacity: [0.7, 0.2, 0.7] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '50px 68px' }}
            />
            <circle cx="42" cy="52" r="3" fill="#FFFFFF" opacity={0.7} />
          </g>
        );

      case 'energy':
        // Small amber ember-particle that pulses like a heartbeat
        return (
          <g>
            <defs>
              <radialGradient id="emberGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#FFF3C4" />
                <stop offset="35%" stop-color="#F2B33D" />
                <stop offset="80%" stop-color="#E8742C" />
                <stop offset="100%" stop-color="#A8440C" />
              </radialGradient>
            </defs>
            {/* Ember body */}
            <motion.polygon
              points="50,14 62,34 84,38 70,58 76,82 50,70 24,82 30,58 16,38 38,34"
              fill="url(#emberGrad)"
              animate={{
                scale: [1, 1.12, 0.98, 1.14, 1],
                rotate: [0, 4, -4, 0],
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '50px 50px' }}
            />
            {/* Glowing heartbeat core */}
            <circle cx="50" cy="50" r="6" fill="#FFFFFF" opacity={0.9} />
          </g>
        );

      case 'fiber':
      default:
        // Abstract fern/leaf spiral (green-teal)
        return (
          <g>
            <defs>
              <linearGradient id="fiberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#4CE0CD" />
                <stop offset="70%" stop-color="#2F9E8F" />
                <stop offset="100%" stop-color="#185E55" />
              </linearGradient>
            </defs>
            {/* Elegant logarithmic spiral / unfurling fern */}
            <path
              d="M 50 82 C 40 82 30 74 30 62 C 30 46 44 34 60 34 C 74 34 84 44 84 56 C 84 66 76 72 68 72 C 60 72 56 66 56 60 C 56 54 60 50 64 50"
              fill="none"
              stroke="url(#fiberGrad)"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <circle cx="64" cy="50" r="3.5" fill="#A5F3E7" opacity={0.95 * glowIntensity} />
            <circle cx="48" cy="62" r="2.5" fill="#D5EEE1" opacity={0.75} />
          </g>
        );
    }
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <motion.svg
        viewBox="0 0 100 100"
        width={pixelSize}
        height={pixelSize}
        variants={floatVariants}
        animate={mood}
        className="overflow-visible"
      >
        {renderOrganism()}
      </motion.svg>
      {showLabel && (
        <span className="text-[11px] font-medium text-ink-muted-light dark:text-ink-muted-dark mt-1 capitalize">
          {type}
        </span>
      )}
    </div>
  );
};
