import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Scissors, CheckCircle2, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { NutriMote } from '../animations/NutriMote';
import { triggerMoteBurst } from '../animations/MoteBurst';
import type { Achievement } from '../../types';

interface RibbonCuttingBadgeModalProps {
  badge: Achievement | null;
  onClose: () => void;
  onBadgeUnlocked?: (id: string) => void;
}

export const RibbonCuttingBadgeModal: React.FC<RibbonCuttingBadgeModalProps> = ({
  badge,
  onClose,
  onBadgeUnlocked,
}) => {
  const [isCut, setIsCut] = useState(false);
  const [isCutting, setIsCutting] = useState(false);
  const ribbonRef = useRef<HTMLDivElement>(null);

  if (!badge) return null;

  const handleCutRibbon = () => {
    if (isCut || isCutting) return;
    setIsCutting(true);

    // Short cutting animation pause
    setTimeout(() => {
      setIsCut(true);
      setIsCutting(false);

      if (onBadgeUnlocked) {
        onBadgeUnlocked(badge.id);
      }

      // 1. Center Mote burst
      triggerMoteBurst({ x: 0.5, y: 0.45 });

      // 2. Dual-side paper blast
      const colors = ['#2E9E5B', '#E2582E', '#2BB3CE', '#7B5CD6', '#F2B33D', '#E91E63'];
      confetti({
        particleCount: 65,
        angle: 60,
        spread: 70,
        origin: { x: 0.1, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 65,
        angle: 120,
        spread: 70,
        origin: { x: 0.9, y: 0.6 },
        colors,
      });
    }, 280);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        className="relative w-full max-w-sm bg-surface-light dark:bg-surface-dark rounded-3xl p-6 shadow-soft-xl border border-black/10 dark:border-white/10 overflow-hidden text-center"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-charcoal-400 hover:text-charcoal-700 dark:hover:text-cream hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge Icon and Mote */}
        <div className="relative mb-5 flex flex-col items-center">
          <div className="relative w-24 h-24 rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center shadow-inner">
            <NutriMote
              type={badge.moteType}
              mood={isCut || badge.unlocked ? 'celebrating' : 'curious'}
              size={64}
            />

            {/* Glowing sparkle ring on unlock */}
            {(isCut || badge.unlocked) && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.25, opacity: 1 }}
                className="absolute inset-0 rounded-3xl ring-4 ring-amber-400/40 pointer-events-none"
              />
            )}
          </div>
        </div>

        {/* Badge Title & Description */}
        <h3 className="font-display font-bold text-xl sm:text-2xl text-forest-900 dark:text-cream">
          {badge.title}
        </h3>
        <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-300 mt-1.5 leading-relaxed px-2">
          {badge.description}
        </p>

        {/* Status Tag */}
        <div className="my-4">
          {isCut || badge.unlocked ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
              Ceremonially Unlocked!
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              Slice the Ceremonial Ribbon Below
            </span>
          )}
        </div>

        {/* Ceremonial Ribbon Area */}
        {!isCut && (
          <div
            ref={ribbonRef}
            onClick={handleCutRibbon}
            className="relative my-4 py-6 w-full cursor-crosshair group select-none"
          >
            <p className="text-[11px] font-semibold text-charcoal-400 dark:text-charcoal-300 mb-2 uppercase tracking-wider flex items-center justify-center gap-1">
              <Scissors className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
              <span>Tap or slide pointer to cut ribbon</span>
            </p>

            {/* Ribbon Background Track */}
            <div className="relative h-10 w-full flex items-center justify-center">
              {/* Ribbon Left Half */}
              <motion.div
                animate={isCutting ? { x: -80, opacity: 0, rotate: -20 } : { x: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="absolute left-0 w-1/2 h-8 bg-gradient-to-r from-red-700 via-red-600 to-amber-500 shadow-md border-y border-amber-300/60 flex items-center justify-end pr-2 text-white font-bold text-xs"
              >
                ★ ★
              </motion.div>

              {/* Ribbon Right Half */}
              <motion.div
                animate={isCutting ? { x: 80, opacity: 0, rotate: 20 } : { x: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="absolute right-0 w-1/2 h-8 bg-gradient-to-l from-red-700 via-red-600 to-amber-500 shadow-md border-y border-amber-300/60 flex items-center justify-start pl-2 text-white font-bold text-xs"
              >
                ★ ★
              </motion.div>

              {/* Golden Center Seal */}
              <motion.div
                animate={isCutting ? { scale: 1.4, opacity: 0 } : { scale: 1, opacity: 1 }}
                className="relative z-10 w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border-2 border-white shadow-lg flex items-center justify-center text-amber-950 font-serif font-black text-sm"
              >
                ✂
              </motion.div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-forest-900 dark:bg-cream text-cream dark:text-forest-900 hover:opacity-95 transition-opacity"
          >
            {isCut || badge.unlocked ? 'Celebrate & Continue' : 'Done'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
