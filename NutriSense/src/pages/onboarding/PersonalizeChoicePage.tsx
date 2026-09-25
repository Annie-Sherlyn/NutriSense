import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, FileText, FastForward, ArrowRight } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { NutriMote } from '../../components/animations/NutriMote';

export const PersonalizeChoicePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-ink-light dark:text-ink-dark flex flex-col justify-between p-6 sm:p-10 transition-colors">
      <div className="max-w-xl mx-auto w-full pt-safe">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-brand-light dark:text-brand-dark uppercase tracking-wider">
            Step 3 of 6
          </span>
          <button
            onClick={() => navigate('/onboarding/confirm')}
            className="text-xs font-semibold text-ink-muted-light hover:text-ink-light dark:text-ink-muted-dark dark:hover:text-ink-dark"
          >
            Skip for now
          </button>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <NutriMote type="fiber" mood="curious" size={36} />
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink-light dark:text-ink-dark">
            How would you like to personalize NutriSense?
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mb-8">
          Personalization tailors next-meal recommendations to your diet, allergies, budget, and priority nutrients.
        </p>

        {/* 3 Interactive Pathway Cards */}
        <div className="flex flex-col gap-4">
          {/* Pathway 1: Enter Details Manually */}
          <Card
            onClick={() => navigate('/onboarding/manual-profile')}
            hoverEffect
            padding="lg"
            className="cursor-pointer border-2 border-brand-light/30 dark:border-brand-dark/30 hover:border-brand-light dark:hover:border-brand-dark group transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-light/10 dark:bg-brand-dark/15 text-brand-light dark:text-brand-dark flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base sm:text-lg text-ink-light dark:text-ink-dark">
                      Enter Details Manually
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-light text-white dark:bg-brand-dark dark:text-ink-light">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mt-1 leading-relaxed">
                    Set your diet type (Veg, Vegan, Non-Veg), allergens, priority nutrients, and meal budget in 2 minutes.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-brand-light dark:text-brand-dark group-hover:translate-x-1 transition-transform flex-shrink-0 mt-1 ml-2" />
            </div>
          </Card>

          {/* Pathway 2: Upload Health-Test Report */}
          <Card
            onClick={() => navigate('/onboarding/report')}
            hoverEffect
            padding="lg"
            className="cursor-pointer border border-black/10 dark:border-white/10 hover:border-brand-light/40 group transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-2-light dark:bg-surface-2-dark text-ink-muted-light dark:text-ink-muted-dark flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-ink-light dark:text-ink-dark">
                    Upload Health-Test Report
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mt-1 leading-relaxed">
                    Upload a blood test or vitamin panel PDF to highlight dietary iron or B12 priority indicators automatically.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-ink-muted-light dark:text-ink-muted-dark group-hover:translate-x-1 transition-transform flex-shrink-0 mt-1 ml-2" />
            </div>
          </Card>

          {/* Pathway 3: Skip for now */}
          <Card
            onClick={() => navigate('/onboarding/confirm')}
            hoverEffect
            padding="md"
            className="cursor-pointer border border-black/5 dark:border-white/5 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 group transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 text-ink-muted-light dark:text-ink-muted-dark flex items-center justify-center flex-shrink-0">
                  <FastForward className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink-light dark:text-ink-dark">
                    Skip for now
                  </h4>
                  <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
                    Use balanced standard defaults; you can customize anytime in Profile.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-ink-muted-light group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </div>
      </div>

      <div className="text-center text-xs text-ink-muted-light dark:text-ink-muted-dark pb-safe pt-8">
        Your health data stays private on your device.
      </div>
    </div>
  );
};

export default PersonalizeChoicePage;
