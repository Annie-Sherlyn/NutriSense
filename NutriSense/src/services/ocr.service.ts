import { ENV } from '../config/env';
import { request } from './api';
import { delay, checkSimulatedError } from '../utils/delay';
import type { OCRResult } from '../types';

export const ocrService = {
  // Extract items from restaurant menu photo
  async parseMenu(file: File | Blob): Promise<OCRResult> {
    checkSimulatedError();

    if (!ENV.USE_MOCK_API) {
      // TODO(OCR): Connect real menu OCR model endpoint (e.g. POST /ocr/menu)
      const formData = new FormData();
      formData.append('image', file);
      return request<OCRResult>('/ocr/menu', {
        method: 'POST',
        body: formData,
      });
    }

    await delay(1000, 1800);

    return {
      restaurantName: 'Sri Krishna Bhavan',
      rawText:
        'SRI KRISHNA BHAVAN\nIdli (2 pcs) with Sambar - Rs 60\nMasala Dosa - Rs 90\nMedu Vada (1 pc) - Rs 35\nVen Pongal - Rs 75\nFilter Coffee - Rs 45\nCurd Rice - Rs 70',
      confidence: 0.93,
      items: [
        {
          id: 'menu-item-1',
          name: 'Idli (2 pcs) with Sambar & Chutney',
          price: 60,
          category: 'Breakfast Specials',
          selected: true,
          matchedFoodId: 'food-idli',
          confidence: 0.94,
        },
        {
          id: 'menu-item-2',
          name: 'Medu Vada (1 pc)',
          price: 35,
          category: 'Snacks & Sides',
          selected: true,
          matchedFoodId: 'food-vada',
          confidence: 0.91,
        },
        {
          id: 'menu-item-3',
          name: 'Masala Dosa',
          price: 90,
          category: 'Dosas',
          selected: false,
          matchedFoodId: 'food-masala-dosa',
          confidence: 0.89,
        },
        {
          id: 'menu-item-4',
          name: 'Ven Pongal with Ghee',
          price: 75,
          category: 'Breakfast Specials',
          selected: false,
          matchedFoodId: 'food-pongal',
          confidence: 0.88,
        },
        {
          id: 'menu-item-5',
          name: 'Traditional Filter Coffee',
          price: 45,
          category: 'Beverages',
          selected: true,
          matchedFoodId: 'food-filter-coffee',
          confidence: 0.95,
        },
        {
          id: 'menu-item-6',
          name: 'Curd Rice with Tempering',
          price: 70,
          category: 'Meals & Rice',
          selected: false,
          matchedFoodId: 'food-curd-rice',
          confidence: 0.87,
        },
      ],
    };
  },

  // Extract items from delivery app screenshot (treated purely as visual screenshot)
  async parseDeliveryScreenshot(file: File | Blob): Promise<OCRResult> {
    checkSimulatedError();

    if (!ENV.USE_MOCK_API) {
      // TODO(OCR): Connect delivery screenshot OCR endpoint (e.g. POST /ocr/delivery-screenshot)
      const formData = new FormData();
      formData.append('image', file);
      return request<OCRResult>('/ocr/delivery-screenshot', {
        method: 'POST',
        body: formData,
      });
    }

    await delay(1100, 1900);

    return {
      restaurantName: 'Dosa Plaza & Tiffin Center (4.3★)',
      rawText:
        'Cart: 1x Masala Dosa ₹90, 1x Medu Vada ₹35, 1x Filter Coffee ₹45. Item Total ₹170.',
      confidence: 0.91,
      items: [
        {
          id: 'deliv-item-1',
          name: 'Special Crispy Masala Dosa',
          price: 90,
          description: 'Golden fermented crepe filled with spiced potato masala, served with 2 chutneys',
          selected: true,
          matchedFoodId: 'food-masala-dosa',
          confidence: 0.92,
        },
        {
          id: 'deliv-item-2',
          name: 'Medu Vada (1 pc)',
          price: 35,
          description: 'Crisp fried lentil donut with sambar dip',
          selected: true,
          matchedFoodId: 'food-vada',
          confidence: 0.89,
        },
        {
          id: 'deliv-item-3',
          name: 'South Indian Filter Coffee',
          price: 45,
          description: 'Frothed chicory-blended milk brew',
          selected: false,
          matchedFoodId: 'food-filter-coffee',
          confidence: 0.94,
        },
      ],
    };
  },
};
