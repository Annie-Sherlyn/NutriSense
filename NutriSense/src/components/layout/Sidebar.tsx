import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Sparkles,
  CalendarDays,
  Compass,
  BarChart3,
  Award,
  MessageSquare,
  Settings,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { NutriMote } from '../animations/NutriMote';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const { user, isDemoMode } = useAuth();
  const { streakCount, setStreakModalOpen } = useApp();

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/log', label: 'Log Food', icon: PlusCircle, isHighlight: true },
    { to: '/recommendations', label: 'Recommendations', icon: Sparkles },
    { to: '/today', label: 'Today’s Log', icon: CalendarDays },
    { to: '/explore', label: 'Explore Dishes', icon: Compass },
    { to: '/reports', label: 'Weekly Report', icon: BarChart3 },
    { to: '/achievements', label: 'Achievements', icon: Award },
    { to: '/assistant', label: 'Ask NutriSense', icon: MessageSquare },
  ];

  return (
    <aside
      aria-label="Desktop Sidebar Navigation"
      className={`hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 bg-surface-light dark:bg-surface-dark border-r border-black/[0.06] dark:border-white/[0.08] p-5 select-none z-30 ${className}`}
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between gap-3 mb-8 px-2">
          <NavLink to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-brand-light/10 dark:bg-brand-dark/15 flex items-center justify-center text-brand-light dark:text-brand-dark group-hover:scale-105 transition-transform">
              <NutriMote type="protein" mood="idle" size={32} />
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight text-ink-light dark:text-ink-dark">
                NutriSense
              </span>
              <span className="block text-[10px] text-ink-muted-light dark:text-ink-muted-dark font-medium leading-none">
                Indian Eating Companion
              </span>
            </div>
          </NavLink>

          {isDemoMode && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              Demo Mode
            </span>
          )}
        </div>

        {/* Streak Quick Card */}
        <button
          onClick={() => setStreakModalOpen(true)}
          className="w-full flex items-center justify-between p-3 mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left hover:bg-amber-500/15 transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="block text-xs font-bold text-ink-light dark:text-ink-dark">
                {streakCount}-Day Streak
              </span>
              <span className="text-[10px] text-ink-muted-light dark:text-ink-muted-dark">
                Consistent mindful logger
              </span>
            </div>
          </div>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">★</span>
        </button>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-fast ${
                    isActive
                      ? 'bg-brand-light text-white shadow-soft dark:bg-brand-dark dark:text-ink-light'
                      : link.isHighlight
                      ? 'bg-brand-light/10 text-brand-light dark:text-brand-dark hover:bg-brand-light/15'
                      : 'text-ink-muted-light dark:text-ink-muted-dark hover:bg-black/5 dark:hover:bg-white/5 hover:text-ink-light dark:hover:text-ink-dark'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Settings */}
      <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col gap-1.5">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-2xl transition-colors ${
              isActive
                ? 'bg-black/5 dark:bg-white/10'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`
          }
        >
          <div className="w-9 h-9 rounded-full bg-brand-light/10 dark:bg-brand-dark/15 text-brand-light dark:text-brand-dark font-display font-bold flex items-center justify-center flex-shrink-0">
            {user?.displayName?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-ink-light dark:text-ink-dark truncate">
              {user?.displayName || 'Aarav Sharma'}
            </span>
            <span className="block text-[11px] text-ink-muted-light dark:text-ink-muted-dark truncate">
              {user?.email || 'demo@nutrisense.app'}
            </span>
          </div>
        </NavLink>

        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3.5 py-2 text-xs font-medium text-ink-muted-light hover:text-ink-light dark:text-ink-muted-dark dark:hover:text-ink-dark transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};
