import React from 'react';
import { FoodItem } from './thaliPresets';

export const ThaliScene2D: React.FC<{
  onTapFood: (food: FoodItem) => void;
  onTapRing: (food: FoodItem) => void;
  onAllTapped: () => void;
  onScanSweep: () => void;
  isReducedMotion: boolean;
  isWelcomeScreen?: boolean;
  freezeTimeMs?: number | null;
}> = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-0 bg-[#FFF8EC]">
      <p className="text-gray-500">2D Fallback Rendering (WebGL Disabled)</p>
    </div>
  );
};
