import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  Edit3, 
  Flame, 
  Award, 
  Watch, 
  LogOut, 
  ShieldCheck, 
  Heart, 
  Target, 
  ChevronRight, 
  Sparkles, 
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/common/Toast';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { NutriMote } from '../../components/animations/NutriMote';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isDemoMode } = useAuth();
  const { profile, streakCount, resetToDefault } = useApp();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      showToast({ type: 'info', message: 'You have been logged out.' });
      navigate('/welcome');
    } catch {
      showToast({ type: 'error', message: 'Failed to log out. Please try again.' });
    }
  };

  const handleDeviceTeaser = (device: string) => {
    showToast({
      type: 'info',
      message: `${device} integration is coming soon! Stay tuned.`,
    });
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all meal logs and profile to demo default state?')) {
      await resetToDefault();
      showToast({ type: 'success', message: 'App reset to initial demo state.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-8">
      {/* Profile Header Card */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-cream to-cream-50 border-forest-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-forest-50/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          {/* Avatar with NutriMote accent */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-forest-700 text-cream flex items-center justify-center font-serif text-3xl font-bold shadow-md ring-4 ring-forest-50">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-cream p-1 rounded-xl shadow-sm border border-forest-100">
              <NutriMote type="energy" mood="happy" size="xs" />
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-forest-900">
                  {profile?.name || user?.displayName || 'Aarav Sharma'}
                </h1>
                <p className="text-xs text-charcoal-400 font-sans">{user?.email || 'aarav.sharma@nutrisense.ai'}</p>
              </div>

              <div className="flex items-center gap-2 justify-center md:justify-start">
                {isDemoMode && (
                  <Badge variant="warning" size="sm">Demo Mode</Badge>
                )}
                <Badge variant="brand" size="sm">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  ICMR-NIN Profile Active
                </Badge>
              </div>
            </div>

            {/* Quick stats strip */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream-100/80 border border-forest-100 text-xs font-medium text-forest-800">
                <Flame className="w-4 h-4 text-warm-500 fill-warm-500" />
                <span>{streakCount} Day Streak</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream-100/80 border border-forest-100 text-xs font-medium text-forest-800">
                <Award className="w-4 h-4 text-accent-brass" />
                <span>Level 4 Conscious Eater</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream-100/80 border border-forest-100 text-xs font-medium text-forest-800">
                <Target className="w-4 h-4 text-forest-600" />
                <span className="capitalize">{profile?.dietType || 'Vegetarian'}</span>
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <div className="pt-2 md:pt-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/profile/edit')}
              className="flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Biometrics & Nutritional Targets (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Biometrics & Dietary Parameters */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-bold text-forest-900 flex items-center gap-2">
                <User className="w-5 h-5 text-forest-700" />
                Dietary & Physiological Parameters
              </h2>
              <button
                onClick={() => navigate('/profile/edit')}
                className="text-xs text-forest-700 font-semibold hover:underline flex items-center gap-1"
              >
                Modify <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-cream-50 rounded-xl border border-forest-50">
                <span className="text-xs text-charcoal-400 block mb-0.5">Age Group</span>
                <span className="font-semibold text-charcoal-800 capitalize">
                  {profile?.ageGroup || '25–34'}
                </span>
              </div>
              <div className="p-3 bg-cream-50 rounded-xl border border-forest-50">
                <span className="text-xs text-charcoal-400 block mb-0.5">Diet Type</span>
                <span className="font-semibold text-charcoal-800 capitalize">
                  {profile?.dietType || 'Vegetarian'}
                </span>
              </div>
              <div className="p-3 bg-cream-50 rounded-xl border border-forest-50">
                <span className="text-xs text-charcoal-400 block mb-0.5">Activity Level</span>
                <span className="font-semibold text-charcoal-800 capitalize">
                  {profile?.activityLevel || 'Moderate'}
                </span>
              </div>
              <div className="p-3 bg-cream-50 rounded-xl border border-forest-50">
                <span className="text-xs text-charcoal-400 block mb-0.5">Meal Budget</span>
                <span className="font-semibold text-charcoal-800">
                  ₹{profile?.budgetPerMeal || 150} / meal
                </span>
              </div>
              <div className="p-3 bg-cream-50 rounded-xl border border-forest-50">
                <span className="text-xs text-charcoal-400 block mb-0.5">Location</span>
                <span className="font-semibold text-charcoal-800">
                  {profile?.location || 'Bengaluru, India'}
                </span>
              </div>
              <div className="p-3 bg-cream-50 rounded-xl border border-forest-50">
                <span className="text-xs text-charcoal-400 block mb-0.5">Health Goal</span>
                <span className="font-semibold text-charcoal-800 capitalize">
                  {profile?.goal?.replace('-', ' ') || 'Better Health'}
                </span>
              </div>
            </div>

            {/* Priority Nutrients */}
            <div className="mt-5 pt-4 border-t border-forest-100/60 space-y-3">
              <div>
                <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider block mb-2">
                  Priority Tracked Nutrients
                </span>
                <div className="flex flex-wrap gap-2">
                  {profile?.priorityNutrients && profile.priorityNutrients.length > 0 ? (
                    profile.priorityNutrients.map((nutrient) => (
                      <Badge key={nutrient} variant="brand" size="sm" className="capitalize">
                        <Heart className="w-3 h-3 mr-1 text-forest-600" />
                        {nutrient}
                      </Badge>
                    ))
                  ) : (
                    <>
                      <Badge variant="brand" size="sm">Protein</Badge>
                      <Badge variant="brand" size="sm">Iron</Badge>
                      <Badge variant="brand" size="sm">Calcium</Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Allergies / Exclusions */}
              {profile?.allergies && profile.allergies.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider block mb-2">
                    Dietary Allergens & Exclusions
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies.map((allergy) => (
                      <Badge key={allergy} variant="warning" size="sm">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Daily ICMR-NIN RDA Reference Strip */}
          <Card className="p-6">
            <h2 className="text-lg font-serif font-bold text-forest-900 mb-2">
              Personalized ICMR-NIN Daily Targets
            </h2>
            <p className="text-xs text-charcoal-500 mb-5">
              Derived scientifically from your age group, activity level, and gender according to National Institute of Nutrition 2024 guidelines.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-cream-50/80 rounded-xl border border-forest-50 flex items-center gap-3">
                <NutriMote type="energy" mood="happy" size="xs" />
                <div>
                  <div className="text-xs text-charcoal-400">Calories</div>
                  <div className="text-base font-bold font-serif text-forest-900">
                    2100 <span className="text-xs font-sans font-normal text-charcoal-400">kcal</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-cream-50/80 rounded-xl border border-forest-50 flex items-center gap-3">
                <NutriMote type="protein" mood="happy" size="xs" />
                <div>
                  <div className="text-xs text-charcoal-400">Protein</div>
                  <div className="text-base font-bold font-serif text-forest-900">
                    54 <span className="text-xs font-sans font-normal text-charcoal-400">g</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-cream-50/80 rounded-xl border border-forest-50 flex items-center gap-3">
                <NutriMote type="iron" mood="happy" size="xs" />
                <div>
                  <div className="text-xs text-charcoal-400">Iron</div>
                  <div className="text-base font-bold font-serif text-forest-900">
                    29 <span className="text-xs font-sans font-normal text-charcoal-400">mg</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-cream-50/80 rounded-xl border border-forest-50 flex items-center gap-3">
                <NutriMote type="calcium" mood="happy" size="xs" />
                <div>
                  <div className="text-xs text-charcoal-400">Calcium</div>
                  <div className="text-base font-bold font-serif text-forest-900">
                    1000 <span className="text-xs font-sans font-normal text-charcoal-400">mg</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-cream-50/80 rounded-xl border border-forest-50 flex items-center gap-3">
                <NutriMote type="b12" mood="happy" size="xs" />
                <div>
                  <div className="text-xs text-charcoal-400">Vitamin B12</div>
                  <div className="text-base font-bold font-serif text-forest-900">
                    2.2 <span className="text-xs font-sans font-normal text-charcoal-400">µg</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-cream-50/80 rounded-xl border border-forest-50 flex items-center gap-3">
                <NutriMote type="fiber" mood="happy" size="xs" />
                <div>
                  <div className="text-xs text-charcoal-400">Dietary Fiber</div>
                  <div className="text-base font-bold font-serif text-forest-900">
                    30 <span className="text-xs font-sans font-normal text-charcoal-400">g</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Settings, Integrations & Danger Zone (1 col) */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card className="p-5 space-y-2">
            <h3 className="text-sm font-serif font-bold text-forest-900 mb-3">Preferences & Navigation</h3>
            
            <button
              onClick={() => navigate('/profile/settings')}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-cream-100 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-forest-50 flex items-center justify-center text-forest-700">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-charcoal-800">App Settings</div>
                  <div className="text-xs text-charcoal-400">Theme, reminders, demo tools</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-charcoal-400 group-hover:text-forest-700 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/achievements')}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-cream-100 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-warm-50 flex items-center justify-center text-warm-600">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-charcoal-800">Badges & Milestones</div>
                  <div className="text-xs text-charcoal-400">View unlocked nutritional badges</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-charcoal-400 group-hover:text-forest-700 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/splash')}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-cream-100 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-sage/20 flex items-center justify-center text-forest-800">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-charcoal-800">Replay Intro Splash</div>
                  <div className="text-xs text-charcoal-400">Watch NutriMote awakening</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-charcoal-400 group-hover:text-forest-700 transition-colors" />
            </button>

            <button
              onClick={handleResetData}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-cream-100 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-warm-50 flex items-center justify-center text-warm-600">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-charcoal-800">Reset Demo Data</div>
                  <div className="text-xs text-charcoal-400">Restore default meals & streak</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-charcoal-400 group-hover:text-forest-700 transition-colors" />
            </button>
          </Card>

          {/* Connected Health Ecosystem Teaser */}
          <Card className="p-5 border-dashed border-forest-200 bg-cream-50/50">
            <div className="flex items-center gap-2 mb-2">
              <Watch className="w-4 h-4 text-forest-700" />
              <h3 className="text-sm font-serif font-bold text-forest-900">Connected Wearables</h3>
            </div>
            <p className="text-xs text-charcoal-500 mb-4">
              Sync active calorie expenditure and real-time biometric metrics from your favorite devices.
            </p>

            <div className="space-y-2">
              {['Apple Health', 'Google Health Connect', 'Whoop 4.0', 'Ultrahuman Ring'].map((device) => (
                <button
                  key={device}
                  onClick={() => handleDeviceTeaser(device)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-cream border border-forest-100 hover:border-forest-300 text-xs font-medium text-charcoal-700 transition-all text-left"
                >
                  <span>{device}</span>
                  <span className="text-[10px] text-forest-700 font-semibold flex items-center gap-1">
                    Connect <ExternalLink className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Logout Section */}
          <Card className="p-5 border-charcoal-200">
            <Button
              variant="outline"
              size="md"
              onClick={handleLogout}
              className="w-full text-warm-600 border-warm-200 hover:bg-warm-50 hover:border-warm-300 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
            <p className="text-center text-[11px] text-charcoal-400 mt-2">
              NutriSense v1.0.0 • ICMR-NIN Compliant
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
