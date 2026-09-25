import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';

import { SplashOverlay } from './SplashOverlay';
import { ThaliScene2D } from './ThaliScene2D';
import { FoodItem } from './thaliPresets';
import { SPLASH_TIMELINE } from './splash.timeline';

// Lazy load the heavy Three.js chunk
const ThaliScene3D = lazy(() => import('./ThaliScene3D').then(m => ({ default: m.ThaliScene3D })));

interface SplashSceneProps {
  onComplete: () => void;
  isWelcomeScreen?: boolean;
  userName?: string;
}

export const SplashScene: React.FC<SplashSceneProps> = ({ onComplete, isWelcomeScreen, userName }) => {
  const [activeChips, setActiveChips] = useState<{ id: string; text: string; color: string }[]>([]);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [showSpinIt, setShowSpinIt] = useState(false);
  
  // Debug hooks
  const searchParams = new URLSearchParams(window.location.search);
  const freezeParam = searchParams.get('splash') === 'freeze' ? searchParams.get('t') : null;
  const freezeTimeMs = freezeParam ? parseInt(freezeParam, 10) : null;
  
  useEffect(() => {
    const hasSeenSplash = localStorage.getItem('ns_splash_seen');
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // If seen before OR system reduced motion is on, skip directly to end
    if (hasSeenSplash === 'true' || mq.matches) {
      setIsReducedMotion(true);
      if (hasSeenSplash === 'true' && !mq.matches) {
        setShowSpinIt(true);
      }
    }

    let frameId: number;
    let startTime = 0;
    
    const checkCompletion = (time: number) => {
      if (startTime === 0) startTime = time;
      const elapsed = time - startTime;
      
      // We will add the drag check (isDragging) via a global or event later.
      // For now, if elapsed >= 5000, complete.
      if (elapsed >= SPLASH_TIMELINE.DURATION_MS) {
        localStorage.setItem('ns_splash_seen', 'true');
        onComplete();
        return; // Stop looping
      }
      
      frameId = requestAnimationFrame(checkCompletion);
    };

    frameId = requestAnimationFrame(checkCompletion);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [onComplete, isReducedMotion]);

  const handleSkip = useCallback(() => {
    localStorage.setItem('ns_splash_seen', 'true');
    onComplete();
  }, [onComplete]);

  const handleSpinIt = useCallback(() => {
    setShowSpinIt(false);
    setIsReducedMotion(false);
    // Let the effect re-trigger and play animation
  }, []);

  const handleTapFood = useCallback((food: FoodItem) => {
    if (navigator.vibrate) navigator.vibrate(8);
    const text = `${food.name} · ${food.nutrient}, ${food.nutrientDesc} (sample)`;
    setActiveChips([{ id: food.id, text, color: food.color }]);
  }, []);

  const handleTapRing = useCallback((food: FoodItem) => {
    const text = `${food.nutrient} · ${food.demoFill}% of demo target (sample)`;
    setActiveChips([{ id: food.id, text, color: food.color }]);
  }, []);

  const handleAllTapped = useCallback(() => {
    setActiveChips([{ id: 'balance', text: 'A well-rounded plate.', color: '#1F5B45' }]);
  }, []);

  const handleScanSweep = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
  }, []);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden">
      {/* 3D Layer with Suspense Fallback */}
      <Suspense fallback={<ThaliScene2D 
        onTapFood={handleTapFood} 
        onTapRing={handleTapRing} 
        onAllTapped={handleAllTapped}
        onScanSweep={handleScanSweep}
        isReducedMotion={isReducedMotion}
        isWelcomeScreen={isWelcomeScreen}
        freezeTimeMs={freezeTimeMs}
      />}>
        <ThaliScene3D 
          onTapFood={handleTapFood}
          onTapRing={handleTapRing}
          onAllTapped={handleAllTapped}
          onScanSweep={handleScanSweep}
          isReducedMotion={isReducedMotion}
          isWelcomeScreen={isWelcomeScreen}
          freezeTimeMs={freezeTimeMs}
        />
      </Suspense>

      {/* UI Overlay */}
      <SplashOverlay 
        onComplete={handleSkip} 
        activeChips={activeChips} 
        isWelcomeScreen={isWelcomeScreen} 
        userName={userName} 
        freezeTimeMs={freezeTimeMs}
        showSpinIt={showSpinIt}
        onSpinIt={handleSpinIt}
      />
    </div>
  );
};
