import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { Card } from '../../components/common/Card';
import { FoodImage } from '../../components/food/FoodImage';
import { foodService } from '../../services/food.service';
import type { Food } from '../../types';

const POPULAR_DISHES = [
  'Idli',
  'Masala Dosa',
  'Medu Vada',
  'Ven Pongal',
  'Besan Chilla',
  'Palak Paneer',
  'Sattu Drink',
  'Sprouts Chaat',
  'Biryani',
];

export const SearchLogPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await foodService.search(query);
        setResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectFood = (food: Food) => {
    navigate(`/log/portion?foodId=${food.id}`);
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Manual Food Search"
        subtitle="Find any regional Indian preparation from our verified seed database."
        showBack
      />

      {/* Search Input */}
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Type dish name (e.g. Masala Dosa, Sattu, Paneer)…"
        autoFocus
      />

      {/* Popular Chips */}
      <div>
        <span className="text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider block mb-2 px-1">
          Popular Indian Staples
        </span>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_DISHES.map((d) => (
            <button
              key={d}
              onClick={() => setQuery(d)}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-2-light dark:bg-surface-2-dark hover:bg-brand-light/10 hover:text-brand-light dark:hover:text-brand-dark transition-all select-none border border-black/5 dark:border-white/5"
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-semibold text-ink-muted-light dark:text-ink-muted-dark uppercase tracking-wider block px-1">
          {query ? `Results for "${query}" (${results.length})` : `All Indian Dishes (${results.length})`}
        </span>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-ink-muted-light animate-pulse">
            Searching nutrition database…
          </div>
        ) : results.length > 0 ? (
          results.map((food) => (
            <Card
              key={food.id}
              onClick={() => handleSelectFood(food)}
              padding="sm"
              hoverEffect
              className="cursor-pointer border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 flex-shrink-0">
                  <FoodImage src={food.image} alt={food.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-semibold text-sm sm:text-base text-ink-light dark:text-ink-dark truncate group-hover:text-brand-light dark:group-hover:text-brand-dark transition-colors">
                      {food.name}
                    </h4>
                  </div>
                  {food.regionalName && (
                    <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
                      {food.regionalName}
                    </p>
                  )}
                  <p className="text-xs font-mono text-ink-muted-light dark:text-ink-muted-dark mt-0.5">
                    ~{food.perServingMacros.calories.min}–{food.perServingMacros.calories.max} kcal •{' '}
                    <span className="text-nutrient-protein font-semibold">
                      ~{food.perServingMacros.protein.min}–{food.perServingMacros.protein.max}g Protein
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 text-ink-muted-light dark:text-ink-muted-dark">
                <span className="font-mono text-xs font-bold">₹{food.typicalPrice}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Card>
          ))
        ) : (
          <div className="py-12 text-center text-xs text-ink-muted-light dark:text-ink-muted-dark p-6 rounded-3xl bg-surface-2-light dark:bg-surface-2-dark">
            Can't find your dish? Try a different spelling (e.g. "Idly", "Cheela", "Pongal").
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchLogPage;
