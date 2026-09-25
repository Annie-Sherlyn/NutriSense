import React from 'react';
import { Minus, Plus } from 'lucide-react';
import type { PortionSize, PreparationStyle } from '../../types';

interface PortionControlProps {
  quantity: number;
  onQuantityChange: (qty: number) => void;
  portion: PortionSize;
  onPortionChange: (portion: PortionSize) => void;
  prepStyle: PreparationStyle;
  onPrepStyleChange: (style: PreparationStyle) => void;
  className?: string;
}

export const PortionControl: React.FC<PortionControlProps> = ({
  quantity,
  onQuantityChange,
  portion,
  onPortionChange,
  prepStyle,
  onPrepStyleChange,
  className = '',
}) => {
  const portions: Array<{ id: PortionSize; label: string; desc: string }> = [
    { id: 'small', label: 'Small', desc: '~0.7x serving' },
    { id: 'regular', label: 'Regular', desc: 'Standard 1x' },
    { id: 'large', label: 'Large', desc: '~1.4x generous' },
  ];

  const prepStyles: Array<{ id: PreparationStyle; label: string; desc: string }> = [
    { id: 'normal', label: 'Normal', desc: 'Standard ghee/oil' },
    { id: 'low-oil', label: 'Low Oil', desc: 'Less oil & fats (-20% fat)' },
    { id: 'extra-oil', label: 'Extra Ghee/Oil', desc: 'Rich & layered (+30% fat)' },
    { id: 'homemade', label: 'Homemade', desc: 'Light home style' },
    { id: 'restaurant', label: 'Restaurant Style', desc: 'Rich tiffin style' },
  ];

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* 1. Quantity Stepper */}
      <div>
        <label className="block text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider mb-2">
          Number of Servings
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(0.5, quantity - 0.5))}
            aria-label="Decrease quantity"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center bg-surface-2-light dark:bg-surface-2-dark border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:ring-2 focus:ring-brand-light active:scale-95"
          >
            <Minus className="w-5 h-5 text-ink-light dark:text-ink-dark" />
          </button>

          <span className="font-mono text-2xl font-bold text-ink-light dark:text-ink-dark min-w-[3rem] text-center">
            {quantity}
          </span>

          <button
            type="button"
            onClick={() => onQuantityChange(quantity + 0.5)}
            aria-label="Increase quantity"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center bg-surface-2-light dark:bg-surface-2-dark border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:ring-2 focus:ring-brand-light active:scale-95"
          >
            <Plus className="w-5 h-5 text-ink-light dark:text-ink-dark" />
          </button>
        </div>
      </div>

      {/* 2. Portion Size Selector (Small, Regular, Large) */}
      <div>
        <label className="block text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider mb-2">
          Serving Size
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {portions.map((p) => {
            const isSelected = portion === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPortionChange(p.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-fast select-none min-h-[58px] ${
                  isSelected
                    ? 'bg-brand-light/10 dark:bg-brand-dark/15 border-brand-light dark:border-brand-dark ring-2 ring-brand-light/20'
                    : 'bg-surface-light dark:bg-surface-dark border-black/10 dark:border-white/10 hover:border-brand-light/40'
                }`}
              >
                <span
                  className={`text-sm font-bold ${
                    isSelected
                      ? 'text-brand-light dark:text-brand-dark'
                      : 'text-ink-light dark:text-ink-dark'
                  }`}
                >
                  {p.label}
                </span>
                <span className="text-[10px] text-ink-muted-light dark:text-ink-muted-dark mt-0.5">
                  {p.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Preparation Style */}
      <div>
        <label className="block text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider mb-2">
          Preparation Style
        </label>
        <div className="flex flex-wrap gap-2">
          {prepStyles.map((s) => {
            const isSelected = prepStyle === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onPrepStyleChange(s.id)}
                className={`px-3.5 py-2 rounded-full border text-xs font-medium transition-all duration-fast select-none min-h-[40px] ${
                  isSelected
                    ? 'bg-brand-light text-white shadow-soft dark:bg-brand-dark dark:text-ink-light border-brand-light dark:border-brand-dark'
                    : 'bg-surface-2-light dark:bg-surface-2-dark text-ink-light dark:text-ink-dark border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
