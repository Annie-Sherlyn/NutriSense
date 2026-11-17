import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Flame, Sparkles, X, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

interface BalloonProps {
  side: 'left' | 'right';
  color: string;
  delay: number;
  offset: number;
}

const Balloon: React.FC<BalloonProps> = ({ side, color, delay, offset }) => {
  const startX = side === 'left' ? 20 + offset : window.innerWidth - 60 - offset;

  return (
    <motion.div
      initial={{ y: window.innerHeight + 60, x: startX, opacity: 0.9, scale: 0.8 }}
      animate={{
        y: -140,
        x: [startX, startX + (side === 'left' ? 25 : -25), startX - 10, startX],
        opacity: [0.95, 1, 1, 0.8],
        scale: [0.85, 1.05, 1.1, 1],
      }}
      transition={{
        duration: 4.8 + delay,
        delay,
        ease: 'easeOut',
      }}
      className="fixed z-50 pointer-events-none select-none flex flex-col items-center"
      style={{ left: 0, top: 0 }}
    >
      {/* Balloon Shape */}
      <div
        className="w-12 h-14 rounded-[50%_50%_50%_50%_/_40%_40%_60%_60%] relative shadow-lg"
        style={{
          backgroundColor: color,
          boxShadow: `inset -4px -4px 10px rgba(0,0,0,0.2), 0 8px 18px ${color}55`,
        }}
      >
        <div className="absolute top-2 left-2.5 w-3 h-4 bg-white/45 rounded-full rotate-[-25deg]" />
      </div>
      <div
        className="w-2 h-1.5 -mt-0.5 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <div className="w-0.5 h-16 bg-black/25 dark:bg-white/30" />
    </motion.div>
  );
};

export const WelcomeCelebration: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { streakCount } = useApp();
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [welcomeText, setWelcomeText] = useState('Welcome Back!');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastLoginDate = localStorage.getItem('ns_last_active_date');
    const isNextDay = Boolean(lastLoginDate && lastLoginDate !== today);
    const alreadyCelebratedSession = sessionStorage.getItem('celebrated_this_session');

    // Trigger celebration for ALL users upon entry/return
    if (!alreadyCelebratedSession || isNextDay) {
      sessionStorage.setItem('celebrated_this_session', 'true');
      if (isNextDay) {
        setWelcomeText(`Welcome to Day ${today}! Great to see you back! 🌟`);
      } else {
        setWelcomeText(`Welcome, ${user?.displayName || 'NutriSense Champion'}! 🎉`);
      }

      setShowCelebration(true);
      setShowAchievementModal(true);
      localStorage.setItem('ns_last_active_date', today);

      // Trigger Confetti paper blasts from left and right sides
      const triggerSideBlasts = () => {
        const colors = ['#2E9E5B', '#E2582E', '#2BB3CE', '#7B5CD6', '#F2B33D', '#E91E63'];

        // Left side paper burst
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 65,
          origin: { x: 0, y: 0.8 },
          colors,
          ticks: 200,
          gravity: 0.9,
          scalar: 1.1,
        });

        // Right side paper burst
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 65,
          origin: { x: 1, y: 0.8 },
          colors,
          ticks: 200,
          gravity: 0.9,
          scalar: 1.1,
        });

        // Follow-up sparkle burst after 400ms
        setTimeout(() => {
          confetti({
            particleCount: 30,
            angle: 70,
            spread: 50,
            origin: { x: 0.05, y: 0.75 },
            colors,
          });
          confetti({
            particleCount: 30,
            angle: 110,
            spread: 50,
            origin: { x: 0.95, y: 0.75 },
            colors,
          });
        }, 400);
      };

      triggerSideBlasts();

      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 5500);

      return () => clearTimeout(timer);
    } else {
      localStorage.setItem('ns_last_active_date', today);
    }
  }, [user]);

  const balloonColors = ['#E2582E', '#2E9E5B', '#2BB3CE', '#7B5CD6', '#F2B33D', '#EC4899'];

  return (
    <>
      {/* Balloon & Paper Blast Animation Layer */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {/* Left corner balloons */}
          <Balloon side="left" color={balloonColors[0]} delay={0.1} offset={10} />
          <Balloon side="left" color={balloonColors[2]} delay={0.4} offset={45} />
          <Balloon side="left" color={balloonColors[4]} delay={0.7} offset={80} />

          {/* Right corner balloons */}
          <Balloon side="right" color={balloonColors[1]} delay={0.15} offset={10} />
          <Balloon side="right" color={balloonColors[3]} delay={0.45} offset={45} />
          <Balloon side="right" color={balloonColors[5]} delay={0.75} offset={80} />

          {/* Floating Greeting Pill */}
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 24, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md px-5 py-2.5 rounded-full shadow-soft-lg border border-black/10 dark:border-white/10 flex items-center gap-2.5"
          >
            <span className="text-xl">🎈</span>
            <span className="text-xs sm:text-sm font-serif font-bold text-forest-900 dark:text-cream">
              {welcomeText}
            </span>
            <span className="text-xl">🎊</span>
          </motion.div>
        </div>
      )}

      {/* Motivational Achievements Return Dialog */}
      <AnimatePresence>
        {showAchievementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-3xl p-6 shadow-soft-2xl border border-black/10 dark:border-white/10 text-center"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowAchievementModal(false)}
                className="absolute top-4 right-4 p-2 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-cream rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Icon */}
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl shadow-inner mb-3">
                🏆
              </div>

              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Welcome Back Milestone
              </span>
              <h2 className="font-display font-bold text-2xl text-forest-900 dark:text-cream mt-0.5">
                Your Nutrition Journey
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-300 mt-1">
                You're building mindful consistency! Check your progress today:
              </p>

              {/* Motivational Stats Cards */}
              <div className="grid grid-cols-2 gap-3 my-4 text-left">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-bold">
                    <Flame className="w-4 h-4 fill-current" />
                    <span>Active Streak</span>
                  </div>
                  <div className="text-xl font-bold font-display text-forest-900 dark:text-cream mt-1">
                    {streakCount} Days Strong
                  </div>
                  <div className="text-[10px] text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                    Log today to extend!
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                    <Award className="w-4 h-4" />
                    <span>Unlocked Badges</span>
                  </div>
                  <div className="text-xl font-bold font-display text-forest-900 dark:text-cream mt-1">
                    Milestones Ready
                  </div>
                  <div className="text-[10px] text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                    Ribbon cutting waiting!
                  </div>
                </div>
              </div>

              {/* Milestone Teaser */}
              <div className="p-3 rounded-xl bg-surface-2-light dark:bg-surface-2-dark border border-black/5 dark:border-white/5 text-left text-xs mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-600/15 text-red-600 flex items-center justify-center font-bold text-sm">
                    ✂️
                  </div>
                  <div>
                    <div className="font-bold text-forest-900 dark:text-cream">
                      Ceremonial Ribbon Cutting
                    </div>
                    <div className="text-[11px] text-charcoal-400">
                      Slice the golden ribbon to celebrate your badges
                    </div>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse flex-shrink-0" />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAchievementModal(false);
                    navigate('/achievements');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-soft transition-colors flex items-center justify-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Cut Achievement Ribbons</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowAchievementModal(false)}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold text-charcoal-600 dark:text-charcoal-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
