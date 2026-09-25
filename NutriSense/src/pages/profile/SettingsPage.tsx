import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sun, 
  Moon, 
  Monitor, 
  Bell, 
  Zap, 
  Bug, 
  Database, 
  RotateCcw, 
  Sparkles, 
  Command
} from 'lucide-react';
import { useApp, ThemeMode } from '../../context/AppContext';
import { useToast } from '../../components/common/Toast';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, loadSampleWeek, resetToDefault } = useApp();
  const { showToast } = useToast();

  const [isLoadingWeek, setIsLoadingWeek] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleThemeChange = (mode: ThemeMode) => {
    updateSettings({ theme: mode });
    showToast({
      type: 'info',
      message: `Theme set to ${mode} mode.`,
    });
  };

  const handleToggle = (key: keyof typeof settings) => {
    const nextVal = !settings[key];
    updateSettings({ [key]: nextVal });
    showToast({
      type: 'info',
      message: `${String(key)} is now ${nextVal ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleLoadSampleWeek = async () => {
    setIsLoadingWeek(true);
    try {
      await loadSampleWeek();
      showToast({
        type: 'success',
        message: 'Sample 7-day Indian meal logs successfully loaded!',
      });
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to load sample week data.',
      });
    } finally {
      setIsLoadingWeek(false);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all meal history, gaps, and custom profile back to factory default?')) {
      setIsResetting(true);
      try {
        await resetToDefault();
        showToast({
          type: 'success',
          message: 'All app state reset to initial factory seed.',
        });
      } catch {
        showToast({
          type: 'error',
          message: 'Failed to reset app state.',
        });
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-sm text-charcoal-600 hover:text-forest-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>
        <Badge variant="brand" size="sm">Settings & Tools</Badge>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-forest-900">
          Preferences & Controls
        </h1>
        <p className="text-sm text-charcoal-500 mt-1">
          Customize display behavior, reminders, motion ergonomics, and test developer tools.
        </p>
      </div>

      {/* 1. Appearance & Theme */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-serif font-bold text-forest-900 border-b border-forest-100 pb-2 flex items-center gap-2">
          <Sun className="w-4 h-4 text-forest-700" />
          Appearance & Contrast
        </h2>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all ${
              settings.theme === 'light'
                ? 'border-forest-700 bg-forest-50/70 text-forest-900 shadow-sm'
                : 'border-forest-100 bg-cream-50 hover:bg-cream-100 text-charcoal-600'
            }`}
          >
            <Sun className="w-5 h-5 mb-1 text-warm-600" />
            <span className="text-xs font-semibold">Warm Editorial</span>
            <span className="text-[10px] text-charcoal-400">Cream #FBF6EE</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all ${
              settings.theme === 'dark'
                ? 'border-forest-700 bg-forest-50/70 text-forest-900 shadow-sm'
                : 'border-forest-100 bg-cream-50 hover:bg-cream-100 text-charcoal-600'
            }`}
          >
            <Moon className="w-5 h-5 mb-1 text-forest-700" />
            <span className="text-xs font-semibold">Night Forest</span>
            <span className="text-[10px] text-charcoal-400">Deep Slate</span>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('system')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all ${
              settings.theme === 'system'
                ? 'border-forest-700 bg-forest-50/70 text-forest-900 shadow-sm'
                : 'border-forest-100 bg-cream-50 hover:bg-cream-100 text-charcoal-600'
            }`}
          >
            <Monitor className="w-5 h-5 mb-1 text-charcoal-600" />
            <span className="text-xs font-semibold">System Match</span>
            <span className="text-[10px] text-charcoal-400">Auto OS</span>
          </button>
        </div>

        {/* Reduced Motion Toggle */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-charcoal-800">Reduce Motion</div>
            <div className="text-[11px] text-charcoal-400">
              Disables spring bounces and floating micro-animations on NutriMotes.
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('reducedMotion')}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              settings.reducedMotion ? 'bg-forest-700' : 'bg-charcoal-200'
            }`}
          >
            <div
              className={`bg-cream w-4 h-4 rounded-full shadow-md transform transition-transform ${
                settings.reducedMotion ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* 2. Notifications & Gentle Reminders */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-serif font-bold text-forest-900 border-b border-forest-100 pb-2 flex items-center gap-2">
          <Bell className="w-4 h-4 text-forest-700" />
          Proactive Habit Reminders
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-charcoal-800">Meal Logging Prompts</div>
              <div className="text-[11px] text-charcoal-400">
                Gentle reminders at 9:00 AM, 1:30 PM, and 8:00 PM.
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('mealReminders')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.mealReminders ? 'bg-forest-700' : 'bg-charcoal-200'
              }`}
            >
              <div
                className={`bg-cream w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.mealReminders ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-charcoal-800">Nutrient Gap Nudges</div>
              <div className="text-[11px] text-charcoal-400">
                Alerts when a key nutrient (e.g. Iron) is under 40% target before evening.
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('recommendationReminders')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.recommendationReminders ? 'bg-forest-700' : 'bg-charcoal-200'
              }`}
            >
              <div
                className={`bg-cream w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.recommendationReminders ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-charcoal-800">Weekly Health Insights</div>
              <div className="text-[11px] text-charcoal-400">
                Summary of your 7-day adherence and micronutrient balance every Sunday.
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('weeklyReportNotifications')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.weeklyReportNotifications ? 'bg-forest-700' : 'bg-charcoal-200'
              }`}
            >
              <div
                className={`bg-cream w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.weeklyReportNotifications ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* 3. Keyboard Shortcuts Tip */}
      <Card className="p-5 bg-gradient-to-r from-forest-50/60 to-cream-100/60 border-forest-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-forest-700 text-cream flex items-center justify-center">
            <Command className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-forest-950">Quick Dish & Nutrition Search</div>
            <div className="text-[11px] text-charcoal-500">
              Press <kbd className="px-1.5 py-0.5 rounded bg-cream border border-forest-200 text-[10px] font-mono">⌘K</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-cream border border-forest-200 text-[10px] font-mono">Ctrl+K</kbd> anywhere in the app to instantly search Indian foods.
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Hackathon & Demonstration Tools */}
      <Card className="p-6 space-y-4 border-accent-brass/40 bg-cream-50/60">
        <div className="flex items-center justify-between border-b border-forest-100 pb-2">
          <h2 className="text-base font-serif font-bold text-forest-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent-brass" />
            Hackathon & Developer Demonstration Tools
          </h2>
          <Badge variant="warning" size="sm">Judge Controls</Badge>
        </div>

        <p className="text-xs text-charcoal-500">
          Use these triggers to instantly inspect error handling states, fill sample longitudinal data, or replay customer onboarding flows.
        </p>

        <div className="space-y-3 pt-1">
          {/* Error Simulator */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-cream border border-forest-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-warm-50 text-warm-600 flex items-center justify-center">
                <Bug className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-charcoal-800">Simulate Network & API Failure</div>
                <div className="text-[11px] text-charcoal-400">
                  Forces subsequent service calls to throw network timeout errors to test recovery UI.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('simulateError')}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.simulateError ? 'bg-warm-600' : 'bg-charcoal-200'
              }`}
            >
              <div
                className={`bg-cream w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.simulateError ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Load Sample Week */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-cream border border-forest-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-charcoal-800">Load 7-Day Indian Meal History</div>
                <div className="text-[11px] text-charcoal-400">
                  Populates complete breakfast, lunch, and dinner logs with realistic nutrient variations.
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              isLoading={isLoadingWeek}
              onClick={handleLoadSampleWeek}
              className="text-xs flex-shrink-0"
            >
              Load Sample
            </Button>
          </div>

          {/* Reset State */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-cream border border-forest-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-warm-50 text-warm-600 flex items-center justify-center">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-charcoal-800">Reset Local App Cache</div>
                <div className="text-[11px] text-charcoal-400">
                  Clears local storage and resets profile and meal logs to standard seed state.
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              isLoading={isResetting}
              onClick={handleResetData}
              className="text-xs text-warm-700 border-warm-200 hover:bg-warm-50 flex-shrink-0"
            >
              Reset Seed
            </Button>
          </div>

          {/* Replay 5-Second Intro Splash */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-cream border border-forest-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-forest-100/60 text-forest-800 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-forest-700" />
              </div>
              <div>
                <div className="text-xs font-semibold text-charcoal-800">Replay 5-Second Intro Splash</div>
                <div className="text-[11px] text-charcoal-400">
                  Experience the NutriMotes awakening and Leaf Mark reveal animation.
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                sessionStorage.removeItem('nutrisense:v1:splash_seen');
                navigate('/splash?replay=true');
              }}
              className="text-xs flex-shrink-0"
            >
              Replay Intro
            </Button>
          </div>

          {/* Replay Onboarding Flow */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-cream border border-forest-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-sage/20 text-forest-800 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-charcoal-800">Replay First-Time Onboarding</div>
                <div className="text-[11px] text-charcoal-400">
                  Walk through the onboarding interview and blood report lab upload flow.
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/onboarding/intro')}
              className="text-xs flex-shrink-0"
            >
              Start Flow
            </Button>
          </div>
        </div>
      </Card>

      {/* App Version & Architecture Stamp */}
      <div className="text-center space-y-1 text-xs text-charcoal-400 pt-2 pb-6">
        <p className="font-medium text-charcoal-600">
          NutriSense v1.0.0 (Release Candidate)
        </p>
        <p className="text-[11px]">
          Pure Handcrafted SVG Engine • ICMR-NIN 2024 Standards • Zero Heavy Chart Libs
        </p>
      </div>
    </div>
  );
};
