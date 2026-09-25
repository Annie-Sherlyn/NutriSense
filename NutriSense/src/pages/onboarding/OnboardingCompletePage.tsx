import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { NutriMote } from '../../components/animations/NutriMote';
import { triggerMoteBurst } from '../../components/animations/MoteBurst';
import { useAuth } from '../../context/AuthContext';

export const OnboardingCompletePage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    // Trigger celebration particle burst on entry
    triggerMoteBurst({ x: 0.5, y: 0.45 });
  }, []);

  const handleStart = async () => {
    await refreshUser();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-ink-light dark:text-ink-dark flex flex-col justify-between p-6 sm:p-10 text-center transition-colors">
      <div className="max-w-md mx-auto w-full my-auto py-12">
        {/* Celebrating NutriMotes */}
        <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-brand-light/10 dark:bg-brand-dark/15 rounded-full filter blur-xl animate-pulse" />
          <NutriMote type="protein" mood="celebrating" size={88} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 mb-4">
          <Sparkles className="w-4 h-4" />
          <span>Setup Complete</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink-light dark:text-ink-dark">
          You're ready to make smarter food choices.
        </h1>
        <p className="text-sm text-ink-muted-light dark:text-ink-muted-dark mt-3 leading-relaxed max-w-sm mx-auto">
          NutriSense is calibrated to your eating preferences. Log your meals today to unlock personalized, explainable recommendations.
        </p>

        <div className="mt-8">
          <Button
            size="lg"
            fullWidth
            onClick={handleStart}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Start Exploring
          </Button>
        </div>
      </div>

      <footer className="text-xs text-ink-muted-light dark:text-ink-muted-dark pb-safe">
        "Better choices begin with understanding."
      </footer>
    </div>
  );
};

export default OnboardingCompletePage;
