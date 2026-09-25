import React, { useState } from 'react';
import { Award, Lock, CheckCircle2, Flame } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { NutriMote } from '../../components/animations/NutriMote';
import { triggerMoteBurst } from '../../components/animations/MoteBurst';
import { useApp } from '../../context/AppContext';
import type { Achievement } from '../../types';

export const AchievementsPage: React.FC = () => {
  const { streakCount } = useApp();
  const [selectedBadge, setSelectedBadge] = useState<Achievement | null>(null);

  const achievements: Achievement[] = [
    {
      id: 'ach-first-meal',
      title: 'First Meal Logged',
      description: 'Logged your very first Indian meal on NutriSense.',
      moteType: 'protein',
      icon: '🌱',
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      unlockedAt: '16 Sep 2026',
    },
    {
      id: 'ach-3day-streak',
      title: '3-Day Eating Streak',
      description: 'Maintained mindful logging for 3 consecutive days.',
      moteType: 'energy',
      icon: '🔥',
      progress: Math.min(3, streakCount),
      maxProgress: 3,
      unlocked: streakCount >= 3,
      unlockedAt: '18 Sep 2026',
    },
    {
      id: 'ach-protein-goal',
      title: 'Protein Master',
      description: 'Hit 100% of your daily protein target through real-world Indian foods.',
      moteType: 'protein',
      icon: '💪',
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      unlockedAt: '18 Sep 2026',
    },
    {
      id: 'ach-balanced-day',
      title: 'Balanced Day',
      description: 'Maintained protein, carbs, and fiber within balanced reference bands.',
      moteType: 'fiber',
      icon: '🌿',
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      unlockedAt: '19 Sep 2026',
    },
    {
      id: 'ach-menu-explorer',
      title: 'Menu Explorer',
      description: 'Scanned a physical restaurant menu and logged an optimal choice.',
      moteType: 'iron',
      icon: '📜',
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      unlockedAt: '19 Sep 2026',
    },
    {
      id: 'ach-consistent-logger',
      title: '7-Day Milestone',
      description: 'Log every meal for an entire full week.',
      moteType: 'calcium',
      icon: '✨',
      progress: Math.min(7, streakCount),
      maxProgress: 7,
      unlocked: streakCount >= 7,
    },
    {
      id: 'ach-micronutrient-explorer',
      title: 'Micronutrient Pioneer',
      description: 'Target dietary iron, calcium, and B12 simultaneously.',
      moteType: 'b12',
      icon: '🔮',
      progress: 2,
      maxProgress: 3,
      unlocked: false,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const handleCardClick = (ach: Achievement) => {
    setSelectedBadge(ach);
    if (ach.unlocked) {
      triggerMoteBurst({ x: 0.5, y: 0.4 });
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Nutrient Achievements"
        subtitle="Celebrate mindful consistency, balanced days, and intuitive eating milestones."
      />

      {/* Overview Card */}
      <Card padding="lg" className="bg-gradient-to-r from-amber-500/15 via-brand-light/10 to-transparent border-amber-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-soft">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Milestones Earned
              </span>
              <h2 className="font-display font-bold text-2xl text-ink-light dark:text-ink-dark">
                {unlockedCount} of {achievements.length} Badges Unlocked
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5">
              <Flame className="w-4 h-4 fill-current" />
              <span>{streakCount}-Day Active Streak</span>
            </span>
          </div>
        </div>
      </Card>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((ach) => (
          <Card
            key={ach.id}
            onClick={() => handleCardClick(ach)}
            hoverEffect
            padding="md"
            className={`cursor-pointer transition-all border-2 flex flex-col justify-between ${
              ach.unlocked
                ? 'border-brand-light/30 dark:border-brand-dark/30 bg-surface-light dark:bg-surface-dark shadow-soft'
                : 'border-black/5 dark:border-white/5 bg-surface-2-light/40 dark:bg-surface-2-dark/30 opacity-70'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-14 h-14 rounded-2xl bg-surface-2-light dark:bg-surface-2-dark flex items-center justify-center relative">
                  <NutriMote
                    type={ach.moteType}
                    mood={ach.unlocked ? 'celebrating' : 'resting'}
                    size={40}
                  />
                  {!ach.unlocked && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center text-white">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {ach.unlocked ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    Unlocked
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold text-ink-muted-light">
                    {ach.progress}/{ach.maxProgress}
                  </span>
                )}
              </div>

              <h3 className="font-display font-bold text-base text-ink-light dark:text-ink-dark">
                {ach.title}
              </h3>
              <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark mt-1 leading-relaxed">
                {ach.description}
              </p>
            </div>

            {/* Mini progress bar */}
            <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
              <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-base ${
                    ach.unlocked ? 'bg-brand-light dark:bg-brand-dark' : 'bg-ink-muted-light'
                  }`}
                  style={{ width: `${(ach.progress / ach.maxProgress) * 100}%` }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Badge Detail / Celebration Modal */}
      <Modal
        isOpen={Boolean(selectedBadge)}
        onClose={() => setSelectedBadge(null)}
        maxWidth="sm"
      >
        {selectedBadge && (
          <div className="flex flex-col items-center text-center p-2">
            <div className="mb-4">
              <NutriMote
                type={selectedBadge.moteType}
                mood={selectedBadge.unlocked ? 'celebrating' : 'curious'}
                size={72}
              />
            </div>

            <h3 className="font-display font-bold text-2xl text-ink-light dark:text-ink-dark">
              {selectedBadge.title}
            </h3>
            <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mt-1 max-w-xs">
              {selectedBadge.description}
            </p>

            <div className="p-3 my-4 rounded-2xl bg-surface-2-light dark:bg-surface-2-dark w-full text-xs">
              {selectedBadge.unlocked ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Achieved on {selectedBadge.unlockedAt || 'Recent meal'}</span>
                </span>
              ) : (
                <span className="text-ink-muted-light font-medium">
                  Progress: {selectedBadge.progress} of {selectedBadge.maxProgress} completed
                </span>
              )}
            </div>

            <Button size="md" fullWidth onClick={() => setSelectedBadge(null)}>
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AchievementsPage;
