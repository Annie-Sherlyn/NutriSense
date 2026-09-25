import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Award } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { NutriMote } from '../../components/animations/NutriMote';
import { useApp } from '../../context/AppContext';

export const StreakPage: React.FC = () => {
  const navigate = useNavigate();
  const { streakCount } = useApp();

  const weekDays = [
    { label: 'Mon', completed: true },
    { label: 'Tue', completed: true },
    { label: 'Wed', completed: true },
    { label: 'Thu', completed: true, isToday: true },
    { label: 'Fri', completed: false },
    { label: 'Sat', completed: false },
    { label: 'Sun', completed: false },
  ];

  return (
    <div className="max-w-md mx-auto flex flex-col gap-6 text-center">
      <PageHeader title="Eating Streak" subtitle="Consistency builds lifelong intuitive eating." showBack />

      <Card padding="lg" className="flex flex-col items-center">
        <div className="relative mb-4">
          <NutriMote type="energy" mood="celebrating" size={88} />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg">
            <Flame className="w-4 h-4 fill-current" />
          </div>
        </div>

        <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink-light dark:text-ink-dark">
          {streakCount} Days Active
        </h2>
        <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mt-1 max-w-xs">
          "Small steps. Big changes."
        </p>

        {/* Week calendar dots */}
        <div className="flex items-center justify-center gap-2.5 my-6 w-full">
          {weekDays.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold transition-transform ${
                  d.completed
                    ? 'bg-amber-500 text-white shadow-soft scale-105'
                    : d.isToday
                    ? 'border-2 border-dashed border-amber-500 text-amber-600'
                    : 'bg-surface-2-light dark:bg-surface-2-dark text-ink-muted-light'
                }`}
              >
                {d.completed ? '✓' : d.label.charAt(0)}
              </div>
              <span className="text-[10px] text-ink-muted-light dark:text-ink-muted-dark">{d.label}</span>
            </div>
          ))}
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-2-light dark:bg-surface-2-dark text-xs text-ink-light dark:text-ink-dark w-full text-left">
          <span className="font-bold block mb-1">Why streaks matter at NutriSense:</span>
          Logging regularly trains your intuition to naturally recognize protein gaps and portion sizes without restrictive calorie obsessions.
        </div>
      </Card>

      <div className="flex flex-col gap-2.5">
        <Button
          size="lg"
          fullWidth
          onClick={() => navigate('/achievements')}
          leftIcon={<Award className="w-5 h-5" />}
        >
          View Milestone Badges
        </Button>
        <Button size="md" variant="ghost" fullWidth onClick={() => navigate('/dashboard')}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default StreakPage;
