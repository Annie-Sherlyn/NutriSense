import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { NutriMote } from '../../components/animations/NutriMote';
import { authService } from '../../services/auth.service';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleDemoAccess = async () => {
    try {
      await authService.login('judge@demo.nutrisense.in', 'Demo1234!');
      navigate('/dashboard');
    } catch {
      navigate('/dashboard');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-[100dvh] w-full bg-cream-50 dark:bg-charcoal-900 text-charcoal-900 dark:text-cream-50 flex flex-col justify-between p-6 sm:p-10 relative overflow-hidden transition-colors duration-300"
    >
      {/* Ambient background glow */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-forest-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Badge */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between z-10 pt-safe-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-forest-800 dark:bg-forest-600 flex items-center justify-center text-cream-50 shadow-md">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
          <span className="font-serif font-bold text-xl tracking-tight text-forest-900 dark:text-forest-100">
            NutriSense
          </span>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-forest-50 dark:bg-forest-900/40 border border-forest-200 dark:border-forest-800 text-[11px] font-medium text-forest-800 dark:text-forest-300">
          <ShieldCheck className="w-3 h-3 text-forest-600" />
          <span>ICMR-NIN 2024</span>
        </div>
      </header>

      {/* Hero Content with Animated NutriMotes */}
      <main className="w-full max-w-lg mx-auto flex flex-col items-center text-center my-auto py-6 z-10">
        {/* Animated NutriMote Array */}
        <div className="relative w-64 h-36 flex items-center justify-center mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-dashed border-forest-300/40 dark:border-forest-700/40"
          />

          {/* Central Protein Mote */}
          <div className="z-10 transform scale-110">
            <NutriMote type="protein" mood="happy" size="lg" />
          </div>

          {/* Orbiting Companions */}
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-2 left-4"
          >
            <NutriMote type="iron" mood="curious" size="sm" />
          </motion.div>
          <motion.div
            animate={{ y: [4, -4, 4] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-2 right-4"
          >
            <NutriMote type="calcium" mood="idle" size="sm" />
          </motion.div>
          <motion.div
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-2 left-8"
          >
            <NutriMote type="fiber" mood="resting" size="sm" />
          </motion.div>
          <motion.div
            animate={{ y: [3, -3, 3] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-2 right-8"
          >
            <NutriMote type="b12" mood="happy" size="sm" />
          </motion.div>
        </div>

        {/* Headlines */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-forest-950 dark:text-cream-100 leading-snug sm:leading-tight mb-3"
        >
          Better choices begin with understanding.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm sm:text-base text-charcoal-600 dark:text-charcoal-300 max-w-md mx-auto mb-6"
        >
          An explainable, multimodal nutrition companion built for real-world Indian eating. Discover what to eat next based on what you’ve already eaten.
        </motion.p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2 text-xs text-charcoal-500 dark:text-charcoal-400">
          <span className="px-2.5 py-1 rounded-full bg-cream-200/60 dark:bg-charcoal-800 border border-cream-300 dark:border-charcoal-700">
            🍛 Photo & Thali OCR
          </span>
          <span className="px-2.5 py-1 rounded-full bg-cream-200/60 dark:bg-charcoal-800 border border-cream-300 dark:border-charcoal-700">
            ⚖️ Realistic Nutrition Ranges
          </span>
          <span className="px-2.5 py-1 rounded-full bg-cream-200/60 dark:bg-charcoal-800 border border-cream-300 dark:border-charcoal-700">
            💡 Explainable Next Meal
          </span>
        </div>
      </main>

      {/* Action CTAs */}
      <footer className="w-full max-w-md mx-auto flex flex-col gap-3 z-10 pb-safe-4">
        {/* Get Started */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/onboarding/intro')}
          className="w-full py-3.5 px-6 rounded-2xl bg-forest-800 hover:bg-forest-900 active:bg-forest-950 text-cream-50 font-semibold text-base shadow-lg shadow-forest-900/20 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>

        {/* Log In */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/login')}
          className="w-full py-3.5 px-6 rounded-2xl bg-white dark:bg-charcoal-800 hover:bg-cream-100 dark:hover:bg-charcoal-700 text-forest-900 dark:text-cream-100 font-semibold text-base border border-cream-300 dark:border-charcoal-700 shadow-sm transition-colors cursor-pointer"
        >
          I already have an account
        </motion.button>

        {/* Demo Mode Button for Judges */}
        <button
          onClick={handleDemoAccess}
          type="button"
          className="w-full py-2.5 px-4 text-xs font-medium text-forest-700 dark:text-forest-400 hover:text-forest-900 dark:hover:text-forest-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Judge / Evaluator? Try Demo Instantly &rarr;</span>
        </button>
      </footer>
    </motion.div>
  );
};

export default WelcomePage;
