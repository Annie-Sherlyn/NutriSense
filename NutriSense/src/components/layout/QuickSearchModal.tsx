import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { Modal } from '../common/Modal';
import { FoodImage } from '../food/FoodImage';
import { foodService } from '../../services/food.service';
import type { Food } from '../../types';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_QUERIES = ['Idli', 'Dosa', 'Medu Vada', 'Pongal', 'Sattu', 'Sprouts Chaat', 'Paneer'];

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await foodService.search(query);
        setResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleSelectFood = (food: Food) => {
    onClose();
    navigate(`/log/portion?foodId=${food.id}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" showCloseButton={false}>
      <div className="flex flex-col gap-4">
        {/* Search Input */}
        <div className="relative flex items-center w-full rounded-2xl bg-surface-2-light dark:bg-surface-2-dark border border-black/10 dark:border-white/10 px-3 py-2.5">
          <Search className="w-5 h-5 text-ink-muted-light dark:text-ink-muted-dark mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a dish name (e.g. Masala Dosa, Idli, Sattu)..."
            autoFocus
            className="w-full bg-transparent text-sm text-ink-light dark:text-ink-dark placeholder:text-ink-muted-light dark:placeholder:text-ink-muted-dark focus:outline-none"
          />
        </div>

        {/* Popular chips */}
        {!query && (
          <div>
            <span className="text-[11px] font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider block mb-2">
              Popular Searches
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuery(q)}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-black/5 dark:bg-white/5 hover:bg-brand-light/10 hover:text-brand-light dark:hover:text-brand-dark transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto flex flex-col gap-2 mt-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-ink-muted-light dark:text-ink-muted-dark">
              Searching database…
            </div>
          ) : results.length > 0 ? (
            results.map((food) => (
              <button
                key={food.id}
                onClick={() => handleSelectFood(food)}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-surface-2-light dark:hover:bg-surface-2-dark text-left transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 flex-shrink-0">
                    <FoodImage src={food.image} alt={food.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-ink-light dark:text-ink-dark truncate group-hover:text-brand-light dark:group-hover:text-brand-dark transition-colors">
                      {food.name}
                    </h4>
                    <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark font-mono">
                      ~{food.perServingMacros.calories.min}–{food.perServingMacros.calories.max} kcal •{' '}
                      <span className="text-nutrient-protein font-semibold">
                        ~{food.perServingMacros.protein.min}–{food.perServingMacros.protein.max}g prot
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 text-ink-muted-light dark:text-ink-muted-dark">
                  <span className="text-xs font-mono font-bold">₹{food.typicalPrice}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-ink-muted-light dark:text-ink-muted-dark">
              No matching Indian dishes found. Try another spelling.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
