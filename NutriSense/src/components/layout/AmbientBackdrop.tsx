import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { prng } from '@/utils/motion';

interface Mote {
  id: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export const AmbientBackdrop: React.FC<{ children?: React.ReactNode; isReducedMotion?: boolean }> = ({ children, isReducedMotion }) => {
  const [motes, setMotes] = useState<Mote[]>([]);

  useEffect(() => {
    if (isReducedMotion) return;
    const newMotes: Mote[] = [];
    // Deterministic generation
    for (let i = 0; i < 20; i++) {
      newMotes.push({
        id: `mote-${i}`,
        x: prng.next() * 100,
        y: prng.next() * 100,
        size: 1 + prng.next() * 3,
        duration: 15 + prng.next() * 20,
        delay: prng.next() * -20, // Start mid-animation
      });
    }
    setMotes(newMotes);
  }, [isReducedMotion]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden" style={{ background: 'linear-gradient(135deg, #FFF8EC 0%, #FFE6D0 50%, #E8F6EC 100%)' }}>
      
      {/* Sunbeams layer */}
      <div 
        className="absolute inset-0 opacity-[0.14]"
        style={{
          background: 'radial-gradient(circle at 20% 0%, rgba(255,255,255,0.8) 0%, transparent 60%), radial-gradient(circle at 80% -20%, rgba(255,240,220,0.6) 0%, transparent 50%)',
          transformOrigin: 'top center',
          animation: isReducedMotion ? 'none' : 'pulse-slow 8s ease-in-out infinite alternate',
        }}
      />

      {/* Table disc (simulated by a very large ellipse at the bottom) */}
      <div 
        className="absolute left-1/2 bottom-[-20%] w-[150vw] h-[60vh] -translate-x-1/2 rounded-[100%]"
        style={{
          background: 'radial-gradient(ellipse at center top, #FFF1DE 0%, transparent 70%)',
          opacity: 0.8,
        }}
      />

      {/* Drifting motes */}
      {!isReducedMotion && motes.map((m) => (
        <motion.div
          key={m.id}
          className="absolute rounded-full bg-white opacity-40 blur-[1px]"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: `${m.size}px`,
            height: `${m.size}px`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, 20, -20, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: m.duration,
            repeat: Infinity,
            delay: m.delay,
            ease: "linear",
          }}
        />
      ))}
      
      <style>{`
        @keyframes pulse-slow {
          0% { transform: scale(1) translateY(0); opacity: 0.14; }
          100% { transform: scale(1.05) translateY(2%); opacity: 0.10; }
        }
      `}</style>
      
      {children}
    </div>
  );
};
