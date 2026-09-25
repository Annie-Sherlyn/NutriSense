import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  FileText,
  Smartphone,
  Mic,
  Search,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { NutriMote } from '../../components/animations/NutriMote';

export const LogHubPage: React.FC = () => {
  const navigate = useNavigate();

  const options = [
    {
      to: '/log/photo',
      title: 'Snap Dish Photo',
      description: 'Take a photo of your plate or pick from your camera roll. Deep learning vision identifies multi-item dishes like Idli + Sambar.',
      icon: Camera,
      tag: 'DL Vision',
      mote: 'protein' as const,
      color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    },
    {
      to: '/log/menu',
      title: 'Scan Restaurant Menu',
      description: 'Take a picture of any physical cafe or hotel menu. OCR extracts items, prices, and recommends dishes matching your current nutrient gap.',
      icon: FileText,
      tag: 'Menu OCR',
      mote: 'iron' as const,
      color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    },
    {
      to: '/log/delivery',
      title: 'Food-Delivery Screenshot',
      description: 'Upload a screenshot of your cart or order preview. Extracts selected dishes, quantities, and calculates nutrition before you order.',
      icon: Smartphone,
      tag: 'Screenshot OCR',
      mote: 'calcium' as const,
      color: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    },
    {
      to: '/log/voice',
      title: 'Voice Meal Log',
      description: 'Speak naturally in English or Hinglish: "Two idlis, one vada and filter coffee". Speech recognition parses foods and quantities.',
      icon: Mic,
      tag: 'Speech-to-Text',
      mote: 'energy' as const,
      color: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
    },
    {
      to: '/log/search',
      title: 'Search Database',
      description: 'Search hundreds of authentic Indian dishes by name or regional spelling (Dosa, Pongal, Cheela, Khichdi, Sattu).',
      icon: Search,
      tag: 'Quick Search',
      mote: 'fiber' as const,
      color: 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
    },
    {
      to: '/onboarding/report',
      title: 'Upload Health Report',
      description: 'Upload an optional blood test or metabolic panel PDF to calibrate dietary iron and vitamin priority targets.',
      icon: FileSpreadsheet,
      tag: 'Lab Insights',
      mote: 'b12' as const,
      color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Log Your Meal"
        subtitle="Choose your preferred input method. NutriSense extracts and calculates nutrition ranges automatically."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <Card
              key={opt.to}
              onClick={() => navigate(opt.to)}
              hoverEffect
              padding="lg"
              className="cursor-pointer border border-black/[0.06] dark:border-white/[0.08] hover:border-brand-light dark:hover:border-brand-dark group transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${opt.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-base sm:text-lg text-ink-light dark:text-ink-dark">
                        {opt.title}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-ink-muted-light dark:text-ink-muted-dark">
                        {opt.tag}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mt-1 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0">
                  <NutriMote type={opt.mote} mood="idle" size={24} />
                  <ArrowRight className="w-4 h-4 text-ink-muted-light dark:text-ink-muted-dark group-hover:text-brand-light dark:group-hover:text-brand-dark group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LogHubPage;
