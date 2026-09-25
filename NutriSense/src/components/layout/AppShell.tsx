import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { QuickSearchModal } from './QuickSearchModal';
import { StreakModal } from './StreakModal';
import { useApp } from '../../context/AppContext';

export const AppShell: React.FC = () => {
  const { isQuickSearchOpen, setIsQuickSearchOpen, streakModalOpen, setStreakModalOpen } =
    useApp();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-ink-light dark:text-ink-dark flex flex-col md:flex-row transition-colors duration-base"
    >
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <TopBar />

        <main className="flex-1 px-4 sm:px-8 py-6 max-w-app w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Quick Search (⌘K) Modal */}
      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
      />

      {/* Global Streak Celebration Modal */}
      <StreakModal
        isOpen={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
      />
      </motion.div>
  );
};
