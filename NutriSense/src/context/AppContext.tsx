import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { TOKENS } from '../config/tokens';
import { nutritionService } from '../services/nutrition.service';
import type { UserProfile, DailyNutritionSummary } from '../types';

export type ThemeMode = 'light' | 'dark' | 'system';

interface AppSettings {
  theme: ThemeMode;
  reducedMotion: boolean;
  simulateError: boolean;
  mealReminders: boolean;
  recommendationReminders: boolean;
  weeklyReportNotifications: boolean;
}

interface AppContextType {
  profile: UserProfile | null;
  updateProfile: (updates: Partial<UserProfile>) => void;
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  todaySummary: DailyNutritionSummary | null;
  refreshSummary: () => Promise<void>;
  projectedGaps?: Record<string, number>;
  setProjectedGaps: (gaps?: Record<string, number>) => void;
  isQuickSearchOpen: boolean;
  setIsQuickSearchOpen: (open: boolean) => void;
  streakCount: number;
  streakModalOpen: boolean;
  setStreakModalOpen: (open: boolean) => void;
  incrementStreak: () => void;
  loadSampleWeek: () => Promise<void>;
  resetToDefault: () => Promise<void>;
}

const DEFAULT_PROFILE: UserProfile = {
  userId: 'demo-user-1',
  name: 'Aarav Sharma',
  dietType: 'vegetarian',
  allergies: [],
  goal: 'better-health',
  priorityNutrients: ['protein', 'iron', 'calcium'],
  budgetPerMeal: 150,
  ageGroup: '25–34',
  activityLevel: 'moderate',
  location: 'Bengaluru, India',
  cuisineLikes: ['South Indian', 'Pan-Indian'],
  cuisineDislikes: [],
  updatedAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  reducedMotion: false,
  simulateError: false,
  mealReminders: true,
  recommendationReminders: true,
  weeklyReportNotifications: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Profile State
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const raw = localStorage.getItem(TOKENS.storageKeys.profile);
    if (!raw) return DEFAULT_PROFILE;
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  // 2. Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const raw = localStorage.getItem(TOKENS.storageKeys.settings);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // 3. Streak State
  const [streakCount, setStreakCount] = useState<number>(() => {
    const raw = localStorage.getItem(TOKENS.storageKeys.streak);
    return raw ? parseInt(raw, 10) : 4; // 4-day active streak default
  });
  const [streakModalOpen, setStreakModalOpen] = useState(false);

  // 4. Summary & What-if
  const [todaySummary, setTodaySummary] = useState<DailyNutritionSummary | null>(null);
  const [projectedGaps, setProjectedGaps] = useState<Record<string, number> | undefined>(undefined);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);

  // Refresh daily summary
  const refreshSummary = useCallback(async () => {
    try {
      const summary = await nutritionService.getDailySummary();
      setTodaySummary(summary);
    } catch (err) {
      console.error('Failed to load daily nutrition summary:', err);
    }
  }, []);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  // Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem(TOKENS.storageKeys.settings, JSON.stringify(settings));
  }, [settings]);

  // Update Profile
  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = {
        ...(prev || DEFAULT_PROFILE),
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(TOKENS.storageKeys.profile, JSON.stringify(updated));
      return updated;
    });
  };

  // Update Settings
  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(TOKENS.storageKeys.settings, JSON.stringify(updated));
      return updated;
    });
  };

  const incrementStreak = () => {
    const next = streakCount + 1;
    setStreakCount(next);
    localStorage.setItem(TOKENS.storageKeys.streak, next.toString());
    setStreakModalOpen(true);
  };

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Developer Judge Helpers
  const loadSampleWeek = async () => {
    await nutritionService.resetToSeed();
    setStreakCount(7);
    localStorage.setItem(TOKENS.storageKeys.streak, '7');
    await refreshSummary();
  };

  const resetToDefault = async () => {
    await nutritionService.resetToSeed();
    setProfile(DEFAULT_PROFILE);
    localStorage.setItem(TOKENS.storageKeys.profile, JSON.stringify(DEFAULT_PROFILE));
    setStreakCount(4);
    localStorage.setItem(TOKENS.storageKeys.streak, '4');
    await refreshSummary();
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        updateProfile,
        settings,
        updateSettings,
        todaySummary,
        refreshSummary,
        projectedGaps,
        setProjectedGaps,
        isQuickSearchOpen,
        setIsQuickSearchOpen,
        streakCount,
        streakModalOpen,
        setStreakModalOpen,
        incrementStreak,
        loadSampleWeek,
        resetToDefault,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
