import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { NutriMote } from '../components/animations/NutriMote';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="max-w-md w-full p-8 text-center space-y-6 bg-cream border-forest-100 shadow-sm relative overflow-hidden">
        <div className="flex justify-center mb-2">
          <div className="p-4 bg-cream-50 rounded-full border border-forest-100 shadow-inner">
            <NutriMote type="energy" mood="resting" size="lg" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-warm-600 bg-warm-50 px-3 py-1 rounded-full">
            404 • Lost in the Pantry
          </span>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-forest-900">
            Page Not Found
          </h1>
          <p className="text-sm text-charcoal-600">
            The dish, page, or nutrient calculation you are searching for does not seem to exist or has moved.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/explore')}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            Explore Foods
          </Button>
        </div>

        <div className="pt-4 border-t border-forest-100 text-xs text-charcoal-400 flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('/meal/log')}
            className="hover:text-forest-800 transition-colors"
          >
            Log a Meal
          </button>
          <span>•</span>
          <button
            onClick={() => navigate('/recommendations')}
            className="hover:text-forest-800 transition-colors"
          >
            What Should I Eat?
          </button>
        </div>
      </Card>
    </div>
  );
};
export default NotFoundPage;
