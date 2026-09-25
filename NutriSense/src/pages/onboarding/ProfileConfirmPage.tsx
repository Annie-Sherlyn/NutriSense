import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Edit3, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { NutriMote } from '../../components/animations/NutriMote';
import { useApp } from '../../context/AppContext';

export const ProfileConfirmPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useApp();

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-ink-light dark:text-ink-dark p-6 sm:p-10 transition-colors">
      <div className="max-w-xl mx-auto w-full pt-safe">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-brand-light dark:text-brand-dark uppercase tracking-wider">
            Step 5 of 6
          </span>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <NutriMote type="protein" mood="happy" size={36} />
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink-light dark:text-ink-dark">
            Confirm Your Profile
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mb-6">
          Review your personalized settings. NutriSense uses these boundaries for every meal recommendation.
        </p>

        <div className="flex flex-col gap-4">
          {/* 1. Goal Card */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider">
                Primary Goal
              </span>
              <Link
                to="/onboarding/goals"
                className="flex items-center gap-1 text-xs font-semibold text-brand-light dark:text-brand-dark hover:underline"
              >
                <span>Edit</span>
                <Edit3 className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-light dark:text-brand-dark" />
              <span className="text-base font-bold capitalize text-ink-light dark:text-ink-dark">
                {profile?.goal?.replace('-', ' ') || 'Better Health'}
              </span>
            </div>
          </Card>

          {/* 2. Diet & Allergies Card */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider">
                Diet & Dietary Boundaries
              </span>
              <Link
                to="/onboarding/manual-profile"
                className="flex items-center gap-1 text-xs font-semibold text-brand-light dark:text-brand-dark hover:underline"
              >
                <span>Edit</span>
                <Edit3 className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="protein" size="md" className="capitalize font-bold">
                {profile?.dietType || 'Vegetarian'}
              </Badge>
              {profile?.allergies && profile.allergies.length > 0 ? (
                profile.allergies.map((allergy) => (
                  <Badge key={allergy} variant="warning" size="md">
                    No {allergy}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
                  No declared allergies
                </span>
              )}
            </div>
          </Card>

          {/* 3. Priority Nutrients & Budget */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider">
                Nutrient Focus & Budget
              </span>
              <Link
                to="/onboarding/manual-profile"
                className="flex items-center gap-1 text-xs font-semibold text-brand-light dark:text-brand-dark hover:underline"
              >
                <span>Edit</span>
                <Edit3 className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-black/[0.04] dark:border-white/[0.06] text-xs">
              <span className="text-ink-muted-light dark:text-ink-muted-dark">Budget per meal:</span>
              <span className="font-bold font-mono text-ink-light dark:text-ink-dark">
                ₹{profile?.budgetPerMeal || 150}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-ink-muted-light dark:text-ink-muted-dark">Priority gaps:</span>
              <div className="flex gap-1.5 capitalize font-semibold text-brand-light dark:text-brand-dark">
                {profile?.priorityNutrients?.join(', ') || 'Protein, Iron'}
              </div>
            </div>
          </Card>
        </div>

        <div className="pt-8 pb-safe">
          <Button fullWidth size="lg" onClick={() => navigate('/onboarding/complete')}>
            Looks Good! Complete Setup
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileConfirmPage;
