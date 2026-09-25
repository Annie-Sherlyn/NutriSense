import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SplashScene } from '../animations/splash/SplashScene';
import { authService } from '../../services/auth.service';
import { TOKENS } from '../../config/tokens';
import { AmbientBackdrop } from './AmbientBackdrop';

export const OnboardingShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string | undefined>();
  
  const isSplash = location.pathname === '/' || location.pathname === '/splash';

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(TOKENS.storageKeys.profile);
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        if (parsed.name) setUserName(parsed.name);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSplashComplete = async () => {
    sessionStorage.setItem(TOKENS.storageKeys.splashSeen, 'true');
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const profileRaw = localStorage.getItem(TOKENS.storageKeys.profile);
        if (profileRaw) {
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
  };

  // If we are not on splash or welcome, we don't render the shell? 
  // Wait, OnboardingShell is only wrapping these routes, so it's fine.
  
  return (
    <AmbientBackdrop>
      <div className="absolute inset-0 z-0">
        <SplashScene 
          onComplete={handleSplashComplete} 
          isWelcomeScreen={!isSplash}
          userName={userName}
        />
      </div>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Outlet />
      </div>
    </AmbientBackdrop>
  );
};
