import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface WaveformProps {
  isRecording: boolean;
  audioLevel?: number; // 0 to 1
  barCount?: number;
  className?: string;
}

export const Waveform: React.FC<WaveformProps> = ({
  isRecording,
  audioLevel,
  barCount = 18,
  className = '',
}) => {
  const [simulatedHeights, setSimulatedHeights] = useState<number[]>(
    Array.from({ length: barCount }, () => 16)
  );

  useEffect(() => {
    if (!isRecording) {
      setSimulatedHeights(Array.from({ length: barCount }, () => 12));
      return;
    }

    const interval = setInterval(() => {
      setSimulatedHeights((prev) =>
        prev.map((_, i) => {
          if (audioLevel !== undefined && audioLevel > 0.05) {
            const factor = Math.sin((i / barCount) * Math.PI);
            return Math.min(64, Math.max(8, audioLevel * 70 * factor + Math.random() * 14));
          }
          // Ambient gentle pulse
          return Math.floor(Math.random() * 28) + 12;
        })
      );
    }, 110);

    return () => clearInterval(interval);
  }, [isRecording, audioLevel, barCount]);

  return (
    <div className={`flex items-center justify-center gap-1 h-20 ${className}`}>
      {simulatedHeights.map((h, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-brand-light to-brand-dark"
          animate={{ height: isRecording ? `${h}px` : '8px' }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
};
