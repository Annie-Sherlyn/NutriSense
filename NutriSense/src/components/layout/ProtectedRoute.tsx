import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NutriMote } from '../animations/NutriMote';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-canvas-light dark:bg-canvas-dark text-ink-light dark:text-ink-dark">
        <NutriMote type="protein" mood="curious" size={54} />
        <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark mt-3 animate-pulse">
          Loading NutriSense…
        </p>
      </div>
    );
  }

  // Not logged in -> go to welcome
  if (!user) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
