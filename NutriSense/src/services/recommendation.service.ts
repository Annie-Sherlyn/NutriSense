import { ENV } from '../config/env';
import { request } from './api';
import { MOCK_RECOMMENDATIONS } from '../mocks/recommendations';
import { delay, checkSimulatedError } from '../utils/delay';
import type { Recommendation, MealType, NutrientGap } from '../types';

export const recommendationService = {
  // Get personalized recommendations based on logged meals and current nutrient gap
  async getRecommendations(context?: {
    currentGaps?: NutrientGap[];
    eatingWindow?: MealType;
  }): Promise<Recommendation[]> {
    checkSimulatedError();

    if (!ENV.USE_MOCK_API) {
      // TODO(RECOMMENDATION): Connect recommendation engine endpoint (e.g. POST /recommendations)
      return request<Recommendation[]>('/recommendations', {
        method: 'POST',
        body: JSON.stringify(context || {}),
      });
    }

    await delay(500, 900);
    return MOCK_RECOMMENDATIONS;
  },

  // Get smart snacks with dynamic filter tags
  async getSmartSnacks(filterTag?: string): Promise<Recommendation[]> {
    checkSimulatedError();
    await delay(200, 450);

    const snacks = MOCK_RECOMMENDATIONS.filter(
      (r) => r.category === 'snack' || r.tags.includes('Quick') || r.tags.includes('Under ₹100')
    );

    if (!filterTag || filterTag === 'All') {
      return snacks;
    }

    return snacks.filter((s) => s.tags.includes(filterTag));
  },
};
