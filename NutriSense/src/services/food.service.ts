import { ENV } from '../config/env';
import { request } from './api';
import { MOCK_FOODS } from '../mocks/foods';
import { delay, checkSimulatedError } from '../utils/delay';
import type { Food, FoodCandidate, FoodAnalysisResponse } from '../types';

export const foodService = {
  // Analyze a dish photo (camera capture or gallery upload)
  async analyzeImage(file: File | Blob): Promise<FoodAnalysisResponse> {
    checkSimulatedError();

    if (!ENV.USE_MOCK_API) {
      const formData = new FormData();
      formData.append('image', file, file instanceof File ? file.name : 'camera-dish.jpg');

      const raw = await request<any>('/food/image/analyze', {
        method: 'POST',
        body: formData,
      });

      // If modern multi-object response
      if (raw && typeof raw === 'object' && 'isMultiItem' in raw) {
        return raw as FoodAnalysisResponse;
      }
      
      // If legacy array format
      if (Array.isArray(raw) && raw.length > 0) {
        return {
          isMultiItem: false,
          mode: 'single',
          plateMessage: `Single dish detected: ${raw[0].name}`,
          detectedItems: [raw[0]],
          candidates: raw,
        };
      }

      throw new Error('Invalid response from DL service');
    }

    // Mock DL prediction with realistic latency
    await delay(900, 1600);

    const fileName = file instanceof File ? file.name.toLowerCase() : '';

    // Check if filename indicates a multi-item thali / meal
    if (fileName.includes('thali') || fileName.includes('meals') || fileName.includes('combo') || fileName.includes('rice') || fileName.includes('plate') || fileName.includes('poriyal')) {
      const multiItems: FoodCandidate[] = [
        {
          id: 'food-sambar-sadham',
          name: 'Sambar Sadham (Rice with Sambar)',
          regionalName: 'சாம்பார் சாதம்',
          confidence: 0.91,
          image: '/images/food/curry.svg',
          estimatedKcal: '250–320 kcal',
          platePosition: 'Center',
          box: [0.20, 0.25, 0.60, 0.58],
          color: '#2ECC71',
        },
        {
          id: 'food-carrot-poriyal',
          name: 'Carrot Poriyal',
          regionalName: 'கேரட் பொரியல்',
          confidence: 0.86,
          image: '/images/food/curry.svg',
          estimatedKcal: '55–80 kcal',
          platePosition: 'Top-Right',
          box: [0.55, 0.06, 0.38, 0.36],
          color: '#F59E0B',
        },
        {
          id: 'food-beetroot-poriyal',
          name: 'Beetroot Poriyal',
          regionalName: 'பீட்ரூட் பொரியல்',
          confidence: 0.82,
          image: '/images/food/curry.svg',
          estimatedKcal: '60–85 kcal',
          platePosition: 'Top-Left',
          box: [0.06, 0.06, 0.38, 0.36],
          color: '#EF4444',
        },
      ];
      return {
        isMultiItem: true,
        mode: 'multi',
        plateMessage: '3 dishes detected on plate (Rice with Sambar, Carrot Poriyal, Beetroot Poriyal)',
        detectedItems: multiItems,
        candidates: multiItems,
      };
    }

    const toSingleResult = (candList: FoodCandidate[]): FoodAnalysisResponse => ({
      isMultiItem: false,
      mode: 'single',
      plateMessage: `Single dish detected: ${candList[0]?.name || 'Dish'}`,
      detectedItems: candList.slice(0, 1),
      candidates: candList,
    });

    // Check if filename indicates low confidence test
    if (fileName.includes('uncertain') || fileName.includes('blur') || fileName.includes('low')) {
      return toSingleResult([
        {
          id: 'food-idli',
          name: 'Idli (2 pcs) with Sambar & Chutney',
          regionalName: 'இட்லி',
          confidence: 0.54, // Low / uncertain (< 0.60)
          image: '/images/food/idli.svg',
          estimatedKcal: '180–220 kcal',
        },
        {
          id: 'food-vada',
          name: 'Medu Vada (1 pc)',
          regionalName: 'மெது வடை',
          confidence: 0.32,
          image: '/images/food/vada.svg',
          estimatedKcal: '140–180 kcal',
        },
        {
          id: 'food-pongal',
          name: 'Ven Pongal with Ghee',
          regionalName: 'வெண் பொங்கல்',
          confidence: 0.14,
          image: '/images/food/pongal.svg',
          estimatedKcal: '310–380 kcal',
        },
      ]);
    }

    if (fileName.includes('dosa')) {
      return toSingleResult([
        {
          id: 'food-masala-dosa',
          name: 'Masala Dosa with Potato Filling',
          regionalName: 'மசாலா தோசை',
          confidence: 0.94,
          image: '/images/food/dosa.svg',
          estimatedKcal: '340–410 kcal',
        },
        {
          id: 'food-plain-dosa',
          name: 'Plain Sada Dosa',
          regionalName: 'சாதா தோசை',
          confidence: 0.04,
          image: '/images/food/dosa.svg',
          estimatedKcal: '210–260 kcal',
        },
        {
          id: 'food-rava-dosa',
          name: 'Onion Rava Dosa',
          regionalName: 'ரவா தோசை',
          confidence: 0.02,
          image: '/images/food/dosa.svg',
          estimatedKcal: '280–340 kcal',
        },
      ]);
    }

    // Default high-confidence prediction: Idli + Vada + Sambar (as in master prompt R1 #9)
    return toSingleResult([
      {
        id: 'food-idli',
        name: 'Idli (2 pcs) with Sambar & Chutney',
        regionalName: 'இட்லி / இட்லி சாம்பார்',
        confidence: 0.92, // High confidence (>= 0.80)
        image: '/images/food/idli.svg',
        estimatedKcal: '180–220 kcal',
      },
      {
        id: 'food-plain-dosa',
        name: 'Plain Dosa with Chutney',
        regionalName: 'சாதா தோசை',
        confidence: 0.05,
        image: '/images/food/dosa.svg',
        estimatedKcal: '210–260 kcal',
      },
      {
        id: 'food-vada',
        name: 'Vada with Sambar',
        regionalName: 'வடை சாம்பார்',
        confidence: 0.02,
        image: '/images/food/vada.svg',
        estimatedKcal: '140–180 kcal',
      },
    ]);
  },

  // Instant and debounced food search
  async search(query: string): Promise<Food[]> {
    checkSimulatedError();

    if (!ENV.USE_MOCK_API) {
      // TODO(BACKEND): Connect backend food search endpoint (e.g. GET /foods/search?q=)
      return request<Food[]>(`/foods/search?q=${encodeURIComponent(query)}`);
    }

    await delay(200, 500);

    const clean = query.trim().toLowerCase();
    if (!clean) return MOCK_FOODS;

    return MOCK_FOODS.filter((f) => {
      return (
        f.name.toLowerCase().includes(clean) ||
        (f.regionalName && f.regionalName.toLowerCase().includes(clean)) ||
        f.aliases.some((a) => a.toLowerCase().includes(clean)) ||
        f.cuisine.toLowerCase().includes(clean) ||
        f.tags.some((t) => t.toLowerCase().includes(clean))
      );
    });
  },

  // Get complete nutrition profile of a food
  async getNutrition(id: string): Promise<Food | null> {
    checkSimulatedError();

    if (!ENV.USE_MOCK_API) {
      // TODO(BACKEND): Connect food details endpoint (e.g. GET /foods/:id/nutrition)
      return request<Food>(`/foods/${id}/nutrition`);
    }

    await delay(150, 400);
    const found = MOCK_FOODS.find((f) => f.id === id);
    return found || null;
  },

  // Get all available seed foods
  async getAllFoods(): Promise<Food[]> {
    checkSimulatedError();
    await delay(100, 300);
    return MOCK_FOODS;
  },
};
