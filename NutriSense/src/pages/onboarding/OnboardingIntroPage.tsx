import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { NutriMote } from '../../components/animations/NutriMote';
import type { MoteType } from '../../config/tokens';

interface Slide {
  moteType: MoteType;
  title: string;
  subtitle: string;
  highlight: string;
}

const SLIDES: Slide[] = [
  {
    moteType: 'protein',
    title: 'Track what you eat, intuitively',
    subtitle:
      'Snap a photo, scan a menu, or speak naturally. NutriSense understands real Indian meals—not just generic salads and boiled chicken.',
    highlight: 'Multimodal Indian Food Understanding',
  },
  {
    moteType: 'iron',
    title: 'Understand your nutrient gaps',
    subtitle:
      'We reveal what your body actually needs: protein deficits, dietary iron, vitamin B12, and bioavailable minerals without guilt or anxiety.',
    highlight: 'Real Nutrients, Never Just Calories',
  },
  {
    moteType: 'calcium',
    title: 'Make better food choices next',
    subtitle:
      'The core question we answer: "What should I eat next, based on what I already ate today?" Personalized, explainable, and practical.',
    highlight: 'Personalized Next-Meal Guidance',
  },
];

export const OnboardingIntroPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      navigate('/onboarding/goals');
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-ink-light dark:text-ink-dark flex flex-col justify-between p-6 sm:p-10 transition-colors">
      {/* Top Bar with Skip */}
      <div className="flex items-center justify-between max-w-lg mx-auto w-full pt-safe">
        <span className="text-xs font-semibold text-brand-light dark:text-brand-dark uppercase tracking-wider">
          Step 1 of 6
        </span>
        <button
          type="button"
          onClick={() => navigate('/onboarding/goals')}
          className="min-h-[44px] px-3 py-2 text-xs font-semibold text-ink-muted-light hover:text-ink-light dark:text-ink-muted-dark dark:hover:text-ink-dark focus:outline-none"
        >
          Skip Intro
        </button>
      </div>

      {/* Carousel Body */}
      <div className="max-w-md mx-auto w-full text-center my-auto py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            {/* Organism Hero */}
            <div className="h-40 flex items-center justify-center mb-6">
              <NutriMote type={slide.moteType} mood="happy" size={96} />
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-light/10 text-brand-light dark:bg-brand-dark/15 dark:text-brand-dark mb-3">
              {slide.highlight}
            </span>

            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink-light dark:text-ink-dark leading-snug">
              {slide.title}
            </h2>

            <p className="text-sm text-ink-muted-light dark:text-ink-muted-dark mt-3 leading-relaxed max-w-sm">
              {slide.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? 'w-7 bg-brand-light dark:bg-brand-dark'
                  : 'w-2 bg-black/15 dark:bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-md mx-auto w-full pb-safe">
        <Button
          fullWidth
          size="lg"
          onClick={handleNext}
          rightIcon={
            currentSlide === SLIDES.length - 1 ? (
              <ArrowRight className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )
          }
        >
          {currentSlide === SLIDES.length - 1 ? 'Set Your Goals' : 'Next'}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingIntroPage;
