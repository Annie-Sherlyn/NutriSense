import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Scale, BookOpen, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { FilterChip } from '../../components/common/FilterChip';
import { FoodCard } from '../../components/food/FoodCard';
import { foodService } from '../../services/food.service';
import type { Food } from '../../types';

const CATEGORIES = ['All', 'South Indian', 'North Indian', 'Snacks', 'High-protein', 'Budget'];

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    foodService.getAllFoods().then((data) => {
      setFoods(data);
      setFilteredFoods(data);
    });
  }, []);

  useEffect(() => {
    let list = foods;
    if (selectedCategory !== 'All') {
      if (selectedCategory === 'South Indian') list = list.filter((f) => f.cuisine === 'South Indian');
      else if (selectedCategory === 'North Indian') list = list.filter((f) => f.cuisine === 'North Indian');
      else if (selectedCategory === 'Snacks') list = list.filter((f) => f.category === 'snack' || f.category === 'beverage');
      else if (selectedCategory === 'High-protein') list = list.filter((f) => f.perServingMacros.protein.min >= 10);
      else if (selectedCategory === 'Budget') list = list.filter((f) => f.typicalPrice <= 60);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.aliases.some((a) => a.includes(q)));
    }
    setFilteredFoods(list);
  }, [selectedCategory, searchQuery, foods]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Explore Indian Nutrition"
        subtitle="Discover authentic dishes, regional nutrient profiles, and intuitive pairing wisdom."
      />

      {/* Quick Access Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          onClick={() => navigate('/compare')}
          hoverEffect
          padding="md"
          className="cursor-pointer border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-ink-light dark:text-ink-dark">
                Compare Dishes
              </h3>
              <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
                Analyze 2–4 Indian dishes side-by-side
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-ink-muted-light group-hover:translate-x-1 transition-transform" />
        </Card>

        <Card
          onClick={() => navigate('/recommendations')}
          hoverEffect
          padding="md"
          className="cursor-pointer border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-light/10 text-brand-light dark:bg-brand-dark/15 dark:text-brand-dark flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-ink-light dark:text-ink-dark">
                Smart Indian Snacks
              </h3>
              <p className="text-xs text-ink-muted-light dark:text-ink-muted-dark">
                High protein & iron pocket snacks under ₹100
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-ink-muted-light group-hover:translate-x-1 transition-transform" />
        </Card>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col gap-3">
        <div className="relative flex items-center w-full rounded-full bg-surface-light dark:bg-surface-dark border border-black/10 dark:border-white/10 px-4 py-2.5 shadow-soft">
          <Search className="w-4 h-4 text-ink-muted-light dark:text-ink-muted-dark mr-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish or ingredient (e.g. Sattu, Chilla, Pongal)..."
            className="w-full bg-transparent text-xs sm:text-sm text-ink-light dark:text-ink-dark placeholder:text-ink-muted-light dark:placeholder:text-ink-muted-dark focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              isSelected={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
            />
          ))}
        </div>
      </div>

      {/* Foods Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFoods.map((food) => (
          <FoodCard
            key={food.id}
            food={food}
            onClick={() => navigate(`/log/portion?foodId=${food.id}`)}
          />
        ))}
      </div>

      {/* Educational Insight Card */}
      <Card padding="lg" className="bg-gradient-to-br from-surface-2-light to-surface-light dark:from-surface-2-dark dark:to-surface-dark">
        <div className="flex items-center gap-2 text-brand-light dark:text-brand-dark text-xs font-bold uppercase tracking-wider mb-2">
          <BookOpen className="w-4 h-4" />
          <span>Indian Nutritional Heritage</span>
        </div>
        <h3 className="font-display font-bold text-lg text-ink-light dark:text-ink-dark">
          Fermentation and Mineral Bioavailability
        </h3>
        <p className="text-xs sm:text-sm text-ink-muted-light dark:text-ink-muted-dark mt-1 leading-relaxed">
          Traditional Indian batters like Idli, Dosa, and Dhokla undergo natural wild fermentation by lactic acid bacteria and yeasts. This process breaks down phytic acid (an anti-nutrient in raw grains and legumes), liberating iron, zinc, and calcium for direct bodily absorption.
        </p>
      </Card>
    </div>
  );
};

export default ExplorePage;
