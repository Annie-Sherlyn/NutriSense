import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPLASH_TIMELINE } from './splash.timeline';

interface ChipState {
  id: string;
  text: string;
  color: string;
}

interface SplashOverlayProps {
  onComplete: () => void;
  activeChips: ChipState[];
  isWelcomeScreen?: boolean;
  userName?: string;
  freezeTimeMs?: number | null;
  showSpinIt?: boolean;
  onSpinIt?: () => void;
}

export const SplashOverlay: React.FC<SplashOverlayProps> = ({ onComplete, activeChips, isWelcomeScreen, userName, freezeTimeMs, showSpinIt, onSpinIt }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let frame: number;
    const update = () => {
      setTime(performance.now() - start);
      frame = requestAnimationFrame(update);
    };
    if (freezeTimeMs === undefined || freezeTimeMs === null) {
      frame = requestAnimationFrame(update);
    } else {
      setTime(freezeTimeMs);
    }
    return () => cancelAnimationFrame(frame);
  }, [freezeTimeMs]);

  const b = SPLASH_TIMELINE.BEATS;
  const showReveal = isWelcomeScreen || time > b.REVEAL_START;
  const showPromise = isWelcomeScreen || time > b.PROMISE_START;
  const showWipe = !isWelcomeScreen && time > b.WIPE_START;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      
      {/* Background Gradient & Sunbeams (CSS generated) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8EC] via-[#FFE6D0] to-[#E8F6EC] -z-10 mix-blend-multiply opacity-50" />
      
      {/* Skip Button (Top Right) */}
      <div className="absolute top-[env(safe-area-inset-top,16px)] right-4 mt-4 pointer-events-auto flex items-center gap-2">
        {showSpinIt && (
          <button
            onClick={onSpinIt}
            className="px-4 py-2 bg-white/50 backdrop-blur-md rounded-full text-[#1F5B45] font-medium shadow-sm active:scale-95 transition-transform"
            aria-label="Play animation"
          >
            Spin it
          </button>
        )}
        <button
          onClick={onComplete}
          className="px-4 py-2 bg-white/50 backdrop-blur-md rounded-full text-[#6B6F68] font-medium shadow-sm active:scale-95 transition-transform"
          aria-label="Skip animation"
        >
          Skip &rarr;
        </button>
      </div>

      {/* Chips */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <AnimatePresence>
          {activeChips.map((chip, i) => (
            <motion.div
              key={chip.id}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: i * -50, scale: 1 }} // simple stacking
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute pointer-events-auto px-4 py-2 rounded-xl bg-white shadow-lg border border-black/5 flex items-center gap-2 max-w-[200px]"
              style={{ zIndex: 20 + i }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chip.color }} />
              <p className="text-sm font-medium text-gray-800 leading-tight">
                {chip.text}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Wordmark & Tagline Reveal */}
      <div className={`absolute left-0 right-0 flex flex-col items-center justify-center text-center px-6 transition-all duration-1000 ${isWelcomeScreen ? 'top-[55dvh]' : 'bottom-20'}`}>
        {userName && showReveal && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#6B6F68] text-sm mb-2">
            Good morning, {userName}
          </motion.p>
        )}
        
        {/* Wordmark */}
        {showReveal && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="overflow-hidden"
          >
            <h1 className="text-4xl font-bold tracking-tight text-[#1F5B45]" style={{ fontFamily: 'Sora, sans-serif' }}>
              NutriSense
            </h1>
          </motion.div>
        )}

        {/* Tagline */}
        {showPromise && (
          <motion.p
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.6 }}
            className="mt-3 text-[#6B6F68] text-lg max-w-sm"
          >
            Better choices begin with understanding.
          </motion.p>
        )}
      </div>

      {/* Wipe Transition */}
      {showWipe && (
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 10, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeIn" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#FBF6EE] rounded-full pointer-events-auto z-50"
        />
      )}
    </div>
  );
};
