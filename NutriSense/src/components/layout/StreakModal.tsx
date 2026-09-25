import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { NutriMote } from '../animations/NutriMote';
import { useApp } from '../../context/AppContext';
import { Flame } from 'lucide-react';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StreakModal: React.FC<StreakModalProps> = ({ isOpen, onClose }) => {
  const { streakCount } = useApp();
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const activeDayIndex = 3; // Thursday (mock current day)

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center p-2">
        <div className="relative mb-3">
          <NutriMote type="energy" mood="celebrating" size={64} />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shadow-md">
            <Flame className="w-3.5 h-3.5 fill-current" />
          </div>
        </div>

        <h3 className="font-display text-2xl font-bold text-ink-light dark:text-ink-dark">
          {streakCount}-Day Eating Streak!
        </h3>
        <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark mt-1 max-w-xs">
          Small steps. Big changes. You are building mindful eating awareness meal by meal.
        </p>

        {/* Week day dots */}
        <div className="flex items-center gap-2.5 my-6">
          {days.map((d, index) => {
            const isCompleted = index <= activeDayIndex;
            return (
              <div key={index} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-amber-500 text-white shadow-soft scale-105'
                      : 'bg-black/5 dark:bg-white/10 text-ink-muted-light dark:text-ink-muted-dark'
                  }`}
                >
                  {isCompleted ? '✓' : d}
                </div>
                <span className="text-[10px] text-ink-muted-light dark:text-ink-muted-dark">{d}</span>
              </div>
            );
          })}
        </div>

        <Button onClick={onClose} fullWidth>
          Keep Going
        </Button>
      </div>
    </Modal>
  );
};
