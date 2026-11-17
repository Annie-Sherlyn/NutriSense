import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Clock, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';

export const MealNotificationBanner: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useApp();
  const [currentMealInfo, setCurrentMealInfo] = useState<{
    mealName: string;
    message: string;
    icon: string;
  } | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) {
      setCurrentMealInfo({
        mealName: 'Breakfast',
        message: 'Time is up for Breakfast! Log your morning meal to sustain your energy.',
        icon: '🍳',
      });
    } else if (hour >= 11 && hour < 15) {
      setCurrentMealInfo({
        mealName: 'Lunch',
        message: 'Time is up for Lunch! Log your afternoon meal to balance your protein.',
        icon: '🍛',
      });
    } else if (hour >= 15 && hour < 18) {
      setCurrentMealInfo({
        mealName: 'Evening Snack',
        message: 'Time is up for your Healthy Snack! Pick a protein-rich smart bite.',
        icon: '☕',
      });
    } else if (hour >= 18 && hour < 23) {
      setCurrentMealInfo({
        mealName: 'Dinner',
        message: 'Time is up for Dinner! Complete your daily nutrient targets tonight.',
        icon: '🍲',
      });
    } else {
      setCurrentMealInfo(null);
    }
  }, []);

  const handleToggleReminders = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = !settings.mealReminders;
    updateSettings({ mealReminders: nextVal });
  };

  if (!currentMealInfo || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-4 bg-gradient-to-r from-forest-50 to-amber-50/60 dark:from-surface-2-dark dark:to-surface-dark border border-forest-200/80 dark:border-white/10 rounded-2xl p-3 sm:p-4 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-forest-900 text-white flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
            {currentMealInfo.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-forest-800 dark:text-forest-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {currentMealInfo.mealName} Alert
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-100 dark:bg-forest-900/50 text-forest-950 dark:text-forest-300 font-semibold">
                Active Window
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-charcoal-700 dark:text-cream/90 truncate mt-0.5">
              {currentMealInfo.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          {/* Notification Toggle Button */}
          <button
            type="button"
            onClick={handleToggleReminders}
            title={settings.mealReminders ? 'Reminders On' : 'Reminders Muted'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              settings.mealReminders
                ? 'bg-forest-700 text-white shadow-sm'
                : 'bg-black/5 dark:bg-white/10 text-charcoal-600 dark:text-charcoal-300'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{settings.mealReminders ? 'Notifs On' : 'Notifs Off'}</span>
          </button>

          {/* Quick Log Action */}
          <button
            type="button"
            onClick={() => navigate('/log')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors"
          >
            <span>Log Meal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Dismiss */}
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-cream rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
