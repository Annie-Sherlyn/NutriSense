import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SplashScene } from '../../components/animations/SplashScene';
import { authService } from '../../services/auth.service';
import { TOKENS } from '../../config/tokens';

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [shouldRender, setShouldRender] = useState<boolean | null>(null);

  const isReplay = searchParams.get('replay') === 'true';

  const handleSplashComplete = useCallback(async () => {
    sessionStorage.setItem(TOKENS.storageKeys.splashSeen, 'true');
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const storedProfile = localStorage.getItem(TOKENS.storageKeys.profile);
        if (storedProfile) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/onboarding/intro', { replace: true });
        }
      } else {
        navigate('/welcome', { replace: true });
      }
    } catch {
      navigate('/welcome', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    // Preload next route components during the splash screen so transition is instantaneous
    import('../dashboard/DashboardPage');
    import('./WelcomePage');
    import('../../components/layout/AppShell');
  }, []);

  useEffect(() => {
    // Check reduced motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mq.matches);

    // Check if splash already seen in this session
    const seen = sessionStorage.getItem(TOKENS.storageKeys.splashSeen) === 'true';
    if (seen && !isReplay && window.location.pathname === '/') {
      // Auto advance directly if already seen in current session
      handleSplashComplete();
    } else {
      setShouldRender(true);
    }
  }, [isReplay, handleSplashComplete]);

  if (shouldRender === null) {
    return (
      <div className="fixed inset-0 bg-[#14171A] w-screen h-screen flex items-center justify-center" />
    );
  }

  return (
    <SplashScene
      onComplete={handleSplashComplete}
      isReducedMotion={isReducedMotion}
    />
  );
};

export default SplashPage;
