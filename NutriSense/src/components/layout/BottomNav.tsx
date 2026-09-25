import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, Compass, BarChart3, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/today', label: 'Today', icon: BarChart3 },
    { to: '/log', label: 'Log', icon: PlusCircle, isCenterAction: true },
    { to: '/explore', label: 'Explore', icon: Compass },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-black/[0.06] dark:border-white/[0.08] px-3 pb-safe pt-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-2xl transition-all duration-fast select-none ${
                  item.isCenterAction
                    ? 'text-brand-light dark:text-brand-dark font-bold'
                    : isActive
                    ? 'text-brand-light dark:text-brand-dark font-bold'
                    : 'text-ink-muted-light dark:text-ink-muted-dark hover:text-ink-light dark:hover:text-ink-dark'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.isCenterAction ? (
                    <div className="w-10 h-10 rounded-full bg-brand-light dark:bg-brand-dark text-white dark:text-ink-light flex items-center justify-center shadow-soft -mt-4 active:scale-95 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                  ) : (
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  )}
                  <span
                    className={`text-[10px] mt-1 tracking-tight ${
                      isActive ? 'font-bold' : 'font-medium'
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
