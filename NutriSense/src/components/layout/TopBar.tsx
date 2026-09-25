import React from 'react';
import { Search, Sun, Moon, Flame } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { IconButton } from '../common/Button';
import { NutriMote } from '../animations/NutriMote';
import { NavLink } from 'react-router-dom';

export const TopBar: React.FC = () => {
  const { settings, updateSettings, setIsQuickSearchOpen, streakCount, setStreakModalOpen } =
    useApp();
  const { isDemoMode } = useAuth();

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
  };

  return (
    <header className="sticky top-0 z-20 bg-canvas-light/80 dark:bg-canvas-dark/80 backdrop-blur-md border-b border-black/[0.04] dark:border-white/[0.05] px-4 sm:px-8 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-app mx-auto">
        {/* Left: Mobile Brand Mark (desktop has sidebar) */}
        <div className="flex items-center gap-2 md:hidden">
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-light/10 dark:bg-brand-dark/15 flex items-center justify-center">
              <NutriMote type="protein" mood="idle" size={24} />
            </div>
            <span className="font-display font-bold text-lg text-ink-light dark:text-ink-dark">
              NutriSense
            </span>
          </NavLink>
          {isDemoMode && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
              Demo
            </span>
          )}
        </div>

        {/* Center/Left: Quick Search Trigger Button */}
        <button
          type="button"
          onClick={() => setIsQuickSearchOpen(true)}
          className="flex-1 max-w-md hidden sm:flex items-center justify-between px-4 py-2 rounded-full bg-surface-light dark:bg-surface-dark border border-black/10 dark:border-white/10 shadow-soft text-xs text-ink-muted-light dark:text-ink-muted-dark hover:border-brand-light/50 transition-all select-none"
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span>Search Indian dishes, calories, nutrients…</span>
          </span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold bg-black/5 dark:bg-white/10 rounded border border-black/5 dark:border-white/5">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </button>

        {/* Right Actions: Mobile search icon, Theme toggle, Streak */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile search button */}
          <IconButton
            icon={<Search className="w-5 h-5" />}
            aria-label="Search dishes"
            onClick={() => setIsQuickSearchOpen(true)}
            size="sm"
            className="sm:hidden"
          />

          {/* Streak indicator on mobile */}
          <button
            onClick={() => setStreakModalOpen(true)}
            aria-label="View streak"
            className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs"
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{streakCount}</span>
          </button>

          {/* Theme Toggle */}
          <IconButton
            icon={
              settings.theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-ink-light" />
              )
            }
            aria-label={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} mode`}
            onClick={toggleTheme}
            size="sm"
          />
        </div>
      </div>
    </header>
  );
};
