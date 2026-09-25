import React from 'react';

interface NutriSenseLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  variant?: 'full' | 'emblem-only';
}

export const NutriSenseLogo: React.FC<NutriSenseLogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
  variant = 'full',
}) => {
  const dimensions = {
    sm: { emblem: 40, title: 'text-xl', tag: 'text-[9px]' },
    md: { emblem: 64, title: 'text-2xl sm:text-3xl', tag: 'text-[10px] sm:text-xs' },
    lg: { emblem: 96, title: 'text-3xl sm:text-4xl', tag: 'text-xs sm:text-sm' },
    xl: { emblem: 128, title: 'text-4xl sm:text-5xl', tag: 'text-xs sm:text-sm' },
  }[size];

  const emblemSize = dimensions.emblem;

  return (
    <div className={`inline-flex flex-col items-center select-none text-center ${className}`}>
      {/* Precision Handcrafted Glassmorphic Emblem */}
      <div className="relative flex items-center justify-center p-2 group">
        {/* Ambient Specular Halo */}
        <div
          className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-emerald-500/25 via-amber-400/20 to-teal-400/25 blur-xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-80"
          style={{ transform: 'scale(1.2)' }}
        />

        {/* Frosted Glass Plaque Bezel */}
        <div
          style={{ width: emblemSize, height: emblemSize }}
          className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-b from-white/15 to-white/5 dark:from-white/10 dark:to-white/[0.02] border border-white/30 dark:border-white/20 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden"
        >
          {/* Subtle Diagonal Specular Sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />

          {/* Pure SVG Sacred Botanical & DNA Helix Emblem */}
          <svg
            viewBox="0 0 120 120"
            className="w-[82%] h-[82%] drop-shadow-md"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Outer Metallic Bezel Gradient */}
              <linearGradient id="nsBezel" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F2B33D" />
                <stop offset="50%" stopColor="#2E9E5B" />
                <stop offset="100%" stopColor="#1B6A4B" />
              </linearGradient>

              {/* Botanical Leaf Gradient */}
              <linearGradient id="nsLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="50%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>

              {/* DNA Helix / Bio-Synergy Ribbon Gradient */}
              <linearGradient id="nsHelix" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="40%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>

              {/* Central Energy Nucleus Radial */}
              <radialGradient id="nsNucleus" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* 1. Outer Astronomical Precision Ring with 12 Calibration Ticks */}
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="url(#nsBezel)"
              strokeWidth="2"
              strokeDasharray="4 6"
              opacity="0.8"
            />
            <circle
              cx="60"
              cy="60"
              r="48"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1"
            />

            {/* 2. Sacred Indian Botanical Leaf Silhouette (Organic Nutrition) */}
            <path
              d="M60 18C75 32 94 48 88 74C83 94 65 102 60 102C55 102 37 94 32 74C26 48 45 32 60 18Z"
              fill="url(#nsLeaf)"
              fillOpacity="0.85"
            />

            {/* 3. Central Botanical Vein & Life Pulse */}
            <path
              d="M60 26V96"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M60 44C66 40 74 44 76 48"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M60 56C54 52 46 56 44 60"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M60 68C66 64 72 68 74 72"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* 4. Golden Intertwined DNA Ribbon / Bio-Orbital Rings (Scientific Rigor) */}
            <ellipse
              cx="60"
              cy="60"
              rx="42"
              ry="18"
              transform="rotate(-28 60 60)"
              stroke="url(#nsHelix)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="90 14"
            />
            <ellipse
              cx="60"
              cy="60"
              rx="42"
              ry="18"
              transform="rotate(28 60 60)"
              stroke="url(#nsHelix)"
              strokeWidth="2"
              opacity="0.6"
              strokeLinecap="round"
              strokeDasharray="70 20"
            />

            {/* 5. Central Metabolic Jewel Pulse */}
            <circle cx="60" cy="60" r="10" fill="url(#nsNucleus)" />
            <circle cx="60" cy="60" r="3.5" fill="#FFFFFF" />
          </svg>
        </div>
      </div>

      {/* Brand Typography (Realistic, Clean Editorial Precision) */}
      {variant === 'full' && (
        <div className="mt-3 flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <h1
              className={`${dimensions.title} font-serif font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cream via-amber-100 to-cream drop-shadow-sm`}
            >
              NutriSense
            </h1>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]" />
          </div>

          {showTagline && (
            <div className="flex flex-col items-center mt-1">
              <span
                className={`${dimensions.tag} font-sans font-semibold tracking-widest uppercase text-emerald-300/90`}
              >
                Explainable Indian Nutrition
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono text-cream/50 tracking-wider mt-0.5">
                ICMR-NIN 2024 Biological Architecture
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NutriSenseLogo;
