import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { NutriMote } from '../components/animations/NutriMote';
import { SplashScene } from '../components/animations/SplashScene';
import { useAuth } from '../context/AuthContext';
import { TOKENS } from '../config/tokens';

// Lazy loading helper for named exports
const lazyNamed = <T, K extends keyof T>(
  factory: () => Promise<T>,
  name: K
) =>
  React.lazy(async () => {
    const module = await factory();
    return { default: module[name] as unknown as React.ComponentType };
  });

// Loading Fallback
export const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
    <NutriMote type="protein" mood="curious" size="lg" />
    <p className="mt-4 font-serif text-sm font-semibold text-forest-900 tracking-wide">
      Nourishing View…
    </p>
    <p className="text-xs text-charcoal-400 mt-1">Calibrating Indian Food Engine</p>
  </div>
);

// --- Public / Auth Pages ---
const WelcomePage = lazyNamed(() => import('../pages/auth/WelcomePage'), 'WelcomePage');
const LoginPage = lazyNamed(() => import('../pages/auth/LoginPage'), 'LoginPage');
const RegisterPage = lazyNamed(() => import('../pages/auth/RegisterPage'), 'RegisterPage');
const ForgotPasswordPage = lazyNamed(() => import('../pages/auth/ForgotPasswordPage'), 'ForgotPasswordPage');

// --- Onboarding Pages ---
const OnboardingIntroPage = lazyNamed(() => import('../pages/onboarding/OnboardingIntroPage'), 'OnboardingIntroPage');
const GoalsPage = lazyNamed(() => import('../pages/onboarding/GoalsPage'), 'GoalsPage');
const PersonalizeChoicePage = lazyNamed(() => import('../pages/onboarding/PersonalizeChoicePage'), 'PersonalizeChoicePage');
const ManualProfilePage = lazyNamed(() => import('../pages/onboarding/ManualProfilePage'), 'ManualProfilePage');
const ReportUploadPage = lazyNamed(() => import('../pages/onboarding/ReportUploadPage'), 'ReportUploadPage');
const ProfileConfirmPage = lazyNamed(() => import('../pages/onboarding/ProfileConfirmPage'), 'ProfileConfirmPage');
const OnboardingCompletePage = lazyNamed(() => import('../pages/onboarding/OnboardingCompletePage'), 'OnboardingCompletePage');

// --- App Shell Pages ---
const DashboardPage = lazyNamed(() => import('../pages/dashboard/DashboardPage'), 'DashboardPage');
const LogHubPage = lazyNamed(() => import('../pages/meal/LogHubPage'), 'LogHubPage');
const DishCapturePage = lazyNamed(() => import('../pages/meal/DishCapturePage'), 'DishCapturePage');
const PhotoResultPage = lazyNamed(() => import('../pages/meal/PhotoResultPage'), 'PhotoResultPage');
const PortionPage = lazyNamed(() => import('../pages/meal/PortionPage'), 'PortionPage');
const NutritionEstimatePage = lazyNamed(() => import('../pages/meal/NutritionEstimatePage'), 'NutritionEstimatePage');
const SaveMealPage = lazyNamed(() => import('../pages/meal/SaveMealPage'), 'SaveMealPage');
const MealSuccessPage = lazyNamed(() => import('../pages/meal/MealSuccessPage'), 'MealSuccessPage');
const StreakPage = lazyNamed(() => import('../pages/meal/StreakPage'), 'StreakPage');
const MenuScanPage = lazyNamed(() => import('../pages/meal/MenuScanPage'), 'MenuScanPage');
const RankedMenuResultsPage = lazyNamed(() => import('../pages/meal/RankedMenuResultsPage'), 'RankedMenuResultsPage');
const DeliveryScanPage = lazyNamed(() => import('../pages/meal/DeliveryScanPage'), 'DeliveryScanPage');
const RankedDeliveryResultsPage = lazyNamed(() => import('../pages/meal/RankedDeliveryResultsPage'), 'RankedDeliveryResultsPage');
const VoiceLogPage = lazyNamed(() => import('../pages/meal/VoiceLogPage'), 'VoiceLogPage');
const SearchLogPage = lazyNamed(() => import('../pages/meal/SearchLogPage'), 'SearchLogPage');
const TodayPage = lazyNamed(() => import('../pages/meal/TodayPage'), 'TodayPage');
const RecommendationsPage = lazyNamed(() => import('../pages/meal/RecommendationsPage'), 'RecommendationsPage');
const ComparePage = lazyNamed(() => import('../pages/meal/ComparePage'), 'ComparePage');
const ExplorePage = lazyNamed(() => import('../pages/meal/ExplorePage'), 'ExplorePage');
const ReportsPage = lazyNamed(() => import('../pages/reports/ReportsPage'), 'ReportsPage');
const AchievementsPage = lazyNamed(() => import('../pages/reports/AchievementsPage'), 'AchievementsPage');
const AssistantPage = lazyNamed(() => import('../pages/reports/AssistantPage'), 'AssistantPage');
const ProfilePage = lazyNamed(() => import('../pages/profile/ProfilePage'), 'ProfilePage');
const EditProfilePage = lazyNamed(() => import('../pages/profile/EditProfilePage'), 'EditProfilePage');
const SettingsPage = lazyNamed(() => import('../pages/profile/SettingsPage'), 'SettingsPage');
const NotFoundPage = lazyNamed(() => import('../pages/NotFoundPage'), 'NotFoundPage');

import { ErrorBoundary } from '../components/common/ErrorBoundary';

export const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isReplay = location.search.includes('replay=true') || location.pathname === '/splash';
  const isRoot = location.pathname === '/';

  const [showSplash, setShowSplash] = useState(() => {
    const seen = sessionStorage.getItem(TOKENS.storageKeys.splashSeen) === 'true';
    if (isReplay) return true;
    if (isRoot && !seen) return true;
    return false;
  });

  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (location.pathname === '/splash' || location.search.includes('replay=true')) {
      setShowSplash(true);
    }
  }, [location.pathname, location.search]);

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem(TOKENS.storageKeys.splashSeen, 'true');
    setShowSplash(false);
    if (location.pathname === '/splash' || location.search.includes('replay=true')) {
      const storedProfile = localStorage.getItem(TOKENS.storageKeys.profile);
      const target = storedProfile ? '/dashboard' : user ? '/onboarding/intro' : '/welcome';
      navigate(target, { replace: true });
    }
  }, [location.pathname, location.search, navigate, user]);

  const getInitialDestination = () => {
    const storedProfile = localStorage.getItem(TOKENS.storageKeys.profile);
    if (storedProfile) return '/dashboard';
    if (user) return '/onboarding/intro';
    return '/welcome';
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          {/* Standalone Public Routes */}
          <Route path="/" element={<Navigate to={getInitialDestination()} replace />} />
          <Route path="/splash" element={<Navigate to={getInitialDestination()} replace />} />
          <Route path="/welcome" element={<WelcomePage />} />
        
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Onboarding Flow */}
        <Route path="/onboarding/intro" element={<OnboardingIntroPage />} />
        <Route path="/onboarding/goals" element={<GoalsPage />} />
        <Route path="/onboarding/personalize" element={<PersonalizeChoicePage />} />
        <Route path="/onboarding/setup" element={<PersonalizeChoicePage />} />
        <Route path="/onboarding/manual" element={<ManualProfilePage />} />
        <Route path="/onboarding/manual-profile" element={<ManualProfilePage />} />
        <Route path="/onboarding/report" element={<ReportUploadPage />} />
        <Route path="/onboarding/confirm" element={<ProfileConfirmPage />} />
        <Route path="/onboarding/complete" element={<OnboardingCompletePage />} />

        {/* Protected App Shell Layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Meal Logging Routes (both /log and /meal aliases) */}
          <Route path="/log" element={<LogHubPage />} />
          <Route path="/meal/log" element={<LogHubPage />} />

          <Route path="/log/photo" element={<DishCapturePage />} />
          <Route path="/meal/capture" element={<DishCapturePage />} />

          <Route path="/log/photo/result" element={<PhotoResultPage />} />
          <Route path="/meal/photo-result" element={<PhotoResultPage />} />

          <Route path="/log/portion" element={<PortionPage />} />
          <Route path="/meal/portion" element={<PortionPage />} />

          <Route path="/log/nutrition" element={<NutritionEstimatePage />} />
          <Route path="/meal/nutrition-estimate" element={<NutritionEstimatePage />} />

          <Route path="/log/save" element={<SaveMealPage />} />
          <Route path="/meal/save" element={<SaveMealPage />} />

          <Route path="/log/success" element={<MealSuccessPage />} />
          <Route path="/meal/success" element={<MealSuccessPage />} />

          <Route path="/log/streak" element={<StreakPage />} />
          <Route path="/meal/streak" element={<StreakPage />} />

          {/* OCR & Multimodal Input Routes */}
          <Route path="/log/menu" element={<MenuScanPage />} />
          <Route path="/meal/menu-scan" element={<MenuScanPage />} />

          <Route path="/log/menu/results" element={<RankedMenuResultsPage />} />
          <Route path="/meal/menu-ranked" element={<RankedMenuResultsPage />} />

          <Route path="/log/delivery" element={<DeliveryScanPage />} />
          <Route path="/meal/delivery-scan" element={<DeliveryScanPage />} />

          <Route path="/log/delivery/results" element={<RankedDeliveryResultsPage />} />
          <Route path="/meal/delivery-ranked" element={<RankedDeliveryResultsPage />} />

          <Route path="/log/voice" element={<VoiceLogPage />} />
          <Route path="/meal/voice" element={<VoiceLogPage />} />

          <Route path="/log/search" element={<SearchLogPage />} />
          <Route path="/meal/search" element={<SearchLogPage />} />

          {/* Today, Recommendations & Explorations */}
          <Route path="/today" element={<TodayPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/explore" element={<ExplorePage />} />

          {/* Analytics, Badges & AI Assistant */}
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/assistant" element={<AssistantPage />} />

          {/* Profile & Settings (both /settings and /profile/settings) */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/profile/settings" element={<SettingsPage />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      {/* Full-screen Splash Scene with Smooth Reveal Transition */}
      {showSplash && (
        <SplashScene
          onComplete={handleSplashComplete}
          isReducedMotion={isReducedMotion}
        />
      )}
    </ErrorBoundary>
  );
};
export default AppRoutes;
