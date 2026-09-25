import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashSceneProps {
  onComplete: () => void;
  isReducedMotion?: boolean;
}

export const SplashScene: React.FC<SplashSceneProps> = ({
  onComplete,
  isReducedMotion = false,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [canInteract, setCanInteract] = useState(false);
  
  // Stable ref for onComplete to prevent timer cancellation on state changes
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  
  const hasFinishedRef = useRef(false);

  const handleFinish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    onCompleteRef.current();
  }, []);

  const triggerSmoothExit = useCallback(() => {
    if (hasFinishedRef.current || isExiting) return;
    setIsExiting(true);
    
    // Tactile haptic pulse on mobile if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {
        // ignore
      }
    }

    // 650ms smooth exit transition, then finish
    window.setTimeout(() => {
      handleFinish();
    }, 650);
  }, [isExiting, handleFinish]);

  const handleSkip = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasFinishedRef.current || isExiting) return;
      setIsExiting(true);
      // Quick responsive 300ms smooth exit on user-initiated skip
      window.setTimeout(() => {
        handleFinish();
      }, 300);
    },
    [isExiting, handleFinish]
  );

  useEffect(() => {
    // 1. Allow tap-to-continue starting after tagline settles (t = 4.5s)
    const interactTimer = window.setTimeout(() => {
      setCanInteract(true);
    }, 4500);

    // 2. Auto-transition: animation completes at 4.8s, hold until 5.8s, then smoothly transition
    const exitDuration = isReducedMotion ? 2800 : 5800;
    const autoExitTimer = window.setTimeout(() => {
      triggerSmoothExit();
    }, exitDuration);

    return () => {
      clearTimeout(interactTimer);
      clearTimeout(autoExitTimer);
    };
  }, [triggerSmoothExit, isReducedMotion]);

  const wordmarkLetters = 'NutriSense'.split('');

  return (
    <motion.div
      onClick={canInteract && !isExiting ? triggerSmoothExit : undefined}
      animate={{
        opacity: isExiting ? 0 : 1,
        y: isExiting ? -14 : 0,
        scale: isExiting ? 1.03 : 1,
        filter: isExiting ? 'blur(8px)' : 'blur(0px)',
      }}
      transition={{ duration: isExiting ? 0.65 : 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-0 z-50 w-screen h-[100dvh] flex flex-col items-center justify-center overflow-hidden select-none bg-[#14171A] ${
        isExiting ? 'pointer-events-none' : 'pointer-events-auto'
      } ${canInteract && !isExiting ? 'cursor-pointer' : ''}`}
      style={{ backgroundColor: '#14171A' }}
    >
      {/* Subtle radial ambient cosmic glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 z-[1]"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(95, 191, 149, 0.20) 0%, rgba(31, 91, 69, 0.08) 45%, transparent 70%), radial-gradient(circle at 50% 50%, rgba(242, 179, 61, 0.08) 0%, transparent 50%)',
        }}
      />

      {/* Expanding luminous energy ring on transition */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={
          isExiting
            ? {
                scale: [0.8, 2.2],
                opacity: [0, 0.45, 0],
              }
            : { scale: 0.8, opacity: 0 }
        }
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="absolute w-96 h-96 rounded-full border border-[#5FBF95]/40 pointer-events-none z-[5]"
        style={{
          boxShadow: '0 0 50px rgba(95, 191, 149, 0.25), inset 0 0 30px rgba(95, 191, 149, 0.15)',
        }}
      />

      {/* Persistent Accessible Skip Button */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? -12 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute top-[max(1.25rem,env(safe-area-inset-top))] right-[max(1.25rem,env(safe-area-inset-right))] z-30"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleSkip}
          aria-label="Skip intro"
          type="button"
          className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-[#F2EEE6] border border-white/20 backdrop-blur-md text-xs font-medium tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-lg focus:outline-none focus:ring-2 focus:ring-[#5FBF95] flex items-center gap-1.5"
        >
          <span>Skip</span>
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </motion.div>

      {/* Main Animation Stage: Elevated vertical room so the leaf mark and wordmark never touch */}
      <motion.div
        animate={
          isExiting
            ? {
                y: -24,
                opacity: 0,
                scale: 0.98,
                filter: 'blur(4px)',
              }
            : { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }
        }
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-md min-h-[400px] flex flex-col items-center justify-center px-4"
      >
        {/* Reduced Motion Fallback */}
        {isReducedMotion ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="flex flex-col items-center text-center"
          >
            {/* NutriSense Leaf Mark */}
            <div className="w-24 h-24 mb-10 text-[#5FBF95]">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full drop-shadow-[0_0_20px_rgba(95,191,149,0.5)]"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#5FBF95"
                  strokeWidth="2.5"
                  opacity="0.4"
                />
                <ellipse
                  cx="50"
                  cy="50"
                  rx="40"
                  ry="19"
                  fill="none"
                  stroke="#F2B33D"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                  transform="rotate(-28 50 50)"
                  opacity="0.6"
                />
                <path
                  d="M 50 20 C 68 20, 80 36, 80 52 C 80 68, 65 76, 50 76 C 35 76, 20 68, 20 52 C 20 36, 32 20, 50 20 Z"
                  fill="#1F5B45"
                  stroke="#5FBF95"
                  strokeWidth="3"
                />
                <path
                  d="M 50 28 Q 52 48 50 68"
                  fill="none"
                  stroke="#D5EEE1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 50 42 Q 60 38 68 43"
                  fill="none"
                  stroke="#D5EEE1"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M 50 54 Q 40 50 32 56"
                  fill="none"
                  stroke="#D5EEE1"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-[#F2EEE6] mb-3">
              NutriSense
            </h1>
            <p className="text-sm font-sans text-[#A5A9A2] font-medium">
              Better choices begin with understanding.
            </p>
          </motion.div>
        ) : (
          <>
            {/* BEAT 1: 0.0 - 0.8s: Central Glowing Spark */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.4, 1],
                opacity: [0, 1, 0.8],
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute z-10 w-4 h-4 rounded-full bg-[#5FBF95] shadow-[0_0_24px_10px_rgba(95,191,149,0.7)]"
            />

            {/* BEAT 2: 0.8s - 2.5s: Five NutriMotes enter on curved paths, orbit and gently attract */}
            <AnimatePresence>
              {/* Protein (Emerald Hex Bead Chain) */}
              <motion.div
                key="mote-protein"
                initial={{ x: -160, y: -120, opacity: 0, scale: 0.4 }}
                animate={{
                  x: [-160, -75, -55, 0],
                  y: [-120, -50, -40, 0],
                  opacity: [0, 1, 1, 0],
                  scale: [0.4, 1, 1.05, 0.2],
                  rotate: [0, 180, 360, 540],
                }}
                transition={{
                  duration: 2.7,
                  times: [0, 0.35, 0.8, 1],
                  ease: 'easeInOut',
                }}
                className="absolute z-20 pointer-events-none"
              >
                <div className="w-10 h-10 flex items-center justify-center filter drop-shadow-[0_0_12px_rgba(46,158,91,0.8)]">
                  <svg viewBox="0 0 60 60" className="w-full h-full">
                    <polygon
                      points="30,5 50,15 50,40 30,50 10,40 10,15"
                      fill="#2E9E5B"
                      stroke="#5FBF95"
                      strokeWidth="2"
                    />
                    <circle cx="30" cy="27" r="4" fill="#D5EEE1" />
                  </svg>
                </div>
              </motion.div>

              {/* Iron (Warm Rust-Orange Faceted Pebble) */}
              <motion.div
                key="mote-iron"
                initial={{ x: 160, y: -100, opacity: 0, scale: 0.4 }}
                animate={{
                  x: [160, 80, 60, 0],
                  y: [-100, -40, -35, 0],
                  opacity: [0, 1, 1, 0],
                  scale: [0.4, 1, 1.05, 0.2],
                  rotate: [0, -140, -280, -420],
                }}
                transition={{
                  duration: 2.7,
                  times: [0, 0.35, 0.8, 1],
                  ease: 'easeInOut',
                }}
                className="absolute z-20 pointer-events-none"
              >
                <div className="w-10 h-10 flex items-center justify-center filter drop-shadow-[0_0_12px_rgba(226,88,46,0.8)]">
                  <svg viewBox="0 0 60 60" className="w-full h-full">
                    <polygon
                      points="30,8 52,22 46,50 14,48 8,20"
                      fill="#E2582E"
                      stroke="#F2B33D"
                      strokeWidth="2"
                    />
                    <circle cx="30" cy="30" r="3.5" fill="#FFF2E8" />
                  </svg>
                </div>
              </motion.div>

              {/* Calcium (Pale Translucent Crystal Shard) */}
              <motion.div
                key="mote-calcium"
                initial={{ x: -140, y: 130, opacity: 0, scale: 0.4 }}
                animate={{
                  x: [-140, -70, -50, 0],
                  y: [130, 60, 45, 0],
                  opacity: [0, 1, 1, 0],
                  scale: [0.4, 1, 1.05, 0.2],
                  rotate: [0, 120, 240, 360],
                }}
                transition={{
                  duration: 2.7,
                  times: [0, 0.35, 0.8, 1],
                  ease: 'easeInOut',
                }}
                className="absolute z-20 pointer-events-none"
              >
                <div className="w-10 h-10 flex items-center justify-center filter drop-shadow-[0_0_12px_rgba(43,179,206,0.8)]">
                  <svg viewBox="0 0 60 60" className="w-full h-full">
                    <polygon
                      points="30,6 48,26 40,54 20,54 12,26"
                      fill="#2BB3CE"
                      stroke="#D5F4FA"
                      strokeWidth="2"
                      fillOpacity="0.85"
                    />
                    <polygon
                      points="30,12 40,28 30,48 20,28"
                      fill="#EBF9FC"
                      fillOpacity="0.9"
                    />
                  </svg>
                </div>
              </motion.div>

              {/* B12 (Indigo-Violet Halo Orb) */}
              <motion.div
                key="mote-b12"
                initial={{ x: 150, y: 120, opacity: 0, scale: 0.4 }}
                animate={{
                  x: [150, 75, 55, 0],
                  y: [120, 60, 40, 0],
                  opacity: [0, 1, 1, 0],
                  scale: [0.4, 1, 1.05, 0.2],
                  rotate: [0, -180, -360, -540],
                }}
                transition={{
                  duration: 2.7,
                  times: [0, 0.35, 0.8, 1],
                  ease: 'easeInOut',
                }}
                className="absolute z-20 pointer-events-none"
              >
                <div className="w-10 h-10 flex items-center justify-center filter drop-shadow-[0_0_14px_rgba(123,92,214,0.9)]">
                  <svg viewBox="0 0 60 60" className="w-full h-full">
                    <circle cx="30" cy="30" r="14" fill="#7B5CD6" />
                    <ellipse
                      cx="30"
                      cy="30"
                      rx="24"
                      ry="7"
                      fill="none"
                      stroke="#DCD1F7"
                      strokeWidth="2"
                      transform="rotate(-25 30 30)"
                    />
                    <circle cx="30" cy="30" r="4" fill="#FFFFFF" />
                  </svg>
                </div>
              </motion.div>

              {/* Fiber (Botanical Leaf/Fern Spiral) */}
              <motion.div
                key="mote-fiber"
                initial={{ x: 0, y: -160, opacity: 0, scale: 0.4 }}
                animate={{
                  x: [0, 15, 0, 0],
                  y: [-160, -80, -60, 0],
                  opacity: [0, 1, 1, 0],
                  scale: [0.4, 1, 1.05, 0.2],
                  rotate: [0, 90, 180, 270],
                }}
                transition={{
                  duration: 2.7,
                  times: [0, 0.35, 0.8, 1],
                  ease: 'easeInOut',
                }}
                className="absolute z-20 pointer-events-none"
              >
                <div className="w-10 h-10 flex items-center justify-center filter drop-shadow-[0_0_12px_rgba(47,158,143,0.8)]">
                  <svg viewBox="0 0 60 60" className="w-full h-full">
                    <path
                      d="M 30 10 C 45 10 50 30 50 45 C 35 45 30 30 30 10 Z"
                      fill="#2F9E8F"
                      stroke="#A8E8DF"
                      strokeWidth="2"
                    />
                    <path
                      d="M 30 20 C 15 20 10 40 10 50 C 25 50 30 35 30 20 Z"
                      fill="#2E9E5B"
                      stroke="#D5EEE1"
                      strokeWidth="1.5"
                    />
                    <circle cx="30" cy="30" r="3" fill="#D5EEE1" />
                  </svg>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Orbit Guides (subtle concentric rings) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.35, 0.35, 0], scale: [0.8, 1, 1, 0.5] }}
              transition={{ duration: 2.7, times: [0, 0.3, 0.8, 1] }}
              className="absolute pointer-events-none"
            >
              <svg width="240" height="240" viewBox="0 0 240 240">
                <circle
                  cx="120"
                  cy="120"
                  r="100"
                  fill="none"
                  stroke="#5FBF95"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                  opacity="0.5"
                />
                <circle
                  cx="120"
                  cy="120"
                  r="65"
                  fill="none"
                  stroke="#F2B33D"
                  strokeWidth="1"
                  strokeDasharray="3 5"
                  opacity="0.5"
                />
              </svg>
            </motion.div>

            {/* BEAT 3: 2.5s - 3.5s: Motes merge & morph into NutriSense Leaf Mark (stroke-then-fill reveal) */}
            {/* mb-10 provides a clean 40px gap between the leaf mark and the wordmark */}
            <motion.div
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{
                opacity: [0, 0, 1, 1],
                scale: [0.2, 0.2, 1.12, 1],
              }}
              transition={{
                duration: 3.5,
                times: [0, 0.71, 0.88, 1],
                ease: 'easeOut',
              }}
              className="relative w-28 h-28 flex items-center justify-center mb-10 flex-shrink-0"
            >
              {/* Radial flash on convergence */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 0, 2.5, 0],
                  opacity: [0, 0, 0.8, 0],
                }}
                transition={{
                  duration: 3.2,
                  times: [0, 0.75, 0.86, 1],
                }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-[#5FBF95] via-[#D5EEE1] to-[#F2B33D] blur-xl"
              />

              <svg
                viewBox="0 0 100 100"
                className="w-full h-full relative z-10 drop-shadow-[0_0_25px_rgba(95,191,149,0.6)]"
              >
                {/* Orbit Line Ring */}
                <motion.ellipse
                  cx="50"
                  cy="50"
                  rx="40"
                  ry="19"
                  fill="none"
                  stroke="#F2B33D"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  transform="rotate(-28 50 50)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.8 }}
                  transition={{ delay: 2.6, duration: 0.8 }}
                />

                {/* Leaf Outline Stroke Reveal */}
                <motion.path
                  d="M 50 20 C 68 20, 80 36, 80 52 C 80 68, 65 76, 50 76 C 35 76, 20 68, 20 52 C 20 36, 32 20, 50 20 Z"
                  stroke="#5FBF95"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="#1F5B45"
                  initial={{ pathLength: 0, fillOpacity: 0 }}
                  animate={{
                    pathLength: 1,
                    fillOpacity: 1,
                  }}
                  transition={{
                    pathLength: { delay: 2.5, duration: 0.7, ease: 'easeInOut' },
                    fillOpacity: { delay: 2.9, duration: 0.6, ease: 'easeIn' },
                  }}
                />

                {/* Leaf Veins */}
                <motion.path
                  d="M 50 28 Q 51 48 50 68"
                  fill="none"
                  stroke="#D5EEE1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 2.9, duration: 0.5 }}
                />
                <motion.path
                  d="M 50 42 Q 60 38 68 43"
                  fill="none"
                  stroke="#D5EEE1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 3.1, duration: 0.4 }}
                />
                <motion.path
                  d="M 50 54 Q 40 50 32 56"
                  fill="none"
                  stroke="#D5EEE1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 3.2, duration: 0.4 }}
                />

                {/* Sparkling focal nucleus */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="3.5"
                  fill="#FFFFFF"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.4, 1] }}
                  transition={{ delay: 3.3, duration: 0.3 }}
                />
              </svg>
            </motion.div>

            {/* BEAT 4: 3.5s - 4.3s: Wordmark "NutriSense" letter by letter */}
            <div className="flex items-center justify-center gap-[1px] mt-2 h-12 overflow-hidden">
              {wordmarkLetters.map((char, index) => (
                <motion.span
                  key={`letter-${index}`}
                  initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                  }}
                  transition={{
                    opacity: { delay: 3.4 + index * 0.07, duration: 0.35, ease: 'easeOut' },
                    y: { delay: 3.4 + index * 0.07, duration: 0.35, ease: 'easeOut' },
                    filter: { delay: 3.4 + index * 0.07, duration: 0.35, ease: 'easeOut' },
                  }}
                  className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#F2EEE6]"
                  style={{
                    textShadow: '0 2px 14px rgba(95, 191, 149, 0.45)',
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </div>

            {/* BEAT 5: 4.3s - 5.0s: Tagline with proper vertical margin mt-3 */}
            <motion.p
              initial={{ opacity: 0, y: 8, filter: 'blur(5px)' }}
              animate={{
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
              }}
              transition={{
                delay: 4.2,
                duration: 0.6,
                ease: 'easeOut',
              }}
              className="mt-3 text-xs sm:text-sm font-sans tracking-wide text-center px-4 font-medium text-[#A5A9A2]"
            >
              Better choices begin with understanding.
            </motion.p>

            {/* Subtle elegant interactive hint when ready to advance */}
            <AnimatePresence>
              {canInteract && !isExiting && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-6 flex items-center gap-1.5 text-[11px] font-sans text-[#5FBF95] tracking-widest uppercase pointer-events-none"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5FBF95] animate-pulse" />
                  <span>Tap anywhere to continue</span>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SplashScene;
