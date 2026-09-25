import { ENV } from '../config/env';
import { request } from './api';
import { delay, checkSimulatedError } from '../utils/delay';

export interface AssistantResponse {
  reply: string;
  suggestions?: string[];
}

export const assistantService = {
  async chat(message: string, context?: unknown): Promise<AssistantResponse> {
    checkSimulatedError();

    if (!ENV.USE_MOCK_API) {
      // TODO(BACKEND): Connect AI assistant backend endpoint (e.g. POST /assistant/chat)
      return request<AssistantResponse>('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ message, context }),
      });
    }

    await delay(500, 1100);

    const lower = message.toLowerCase();

    if (lower.includes('low') || lower.includes('gap') || lower.includes('nutrient')) {
      return {
        reply:
          'Looking at what you have logged today, your estimated dietary iron is approximately 6.2mg toward your 17mg target, and you have about 20g of protein remaining. A dish like Moong Sprouts Chaat with lemon or a glass of Spiced Sattu would help narrow both gaps effectively.',
        suggestions: ['Suggest a protein-rich snack.', 'What can I eat under ₹100?', 'View today’s progress'],
      };
    }

    if (lower.includes('snack') || lower.includes('protein')) {
      return {
        reply:
          'Here are 3 great options that fit real-world Indian eating: \n1. **Chilled Spiced Sattu Drink** (~11g protein, ₹40) — quick and hydrating.\n2. **Moong Sprouts Chaat** (~10g protein, ₹50) — rich in active fiber and plant iron.\n3. **Strained Dahi with Walnuts** (~15g protein, ₹85) — excellent calcium and probiotics.',
        suggestions: ['How much iron is in Sattu?', 'What can I eat under ₹150?', 'Why this recommendation?'],
      };
    }

    if (lower.includes('150') || lower.includes('budget') || lower.includes('cheap')) {
      return {
        reply:
          'Within a ₹150 budget, you have excellent options:\n• **Besan Paneer Chilla** (~₹80, ~18g protein)\n• **Ven Pongal with Ghee** (~₹75, ~9g protein)\n• **Bhuna Chana Pocket Snack** (~₹30, ~10g protein)\nAll of these fit your selected dietary preferences.',
        suggestions: ['Compare Chilla and Pongal', 'What nutrient am I low on today?'],
      };
    }

    if (lower.includes('compare')) {
      return {
        reply:
          'Comparing common favorites: Idli + Sambar provides about 7g protein with lower fat and fermentation benefits (~200 kcal), whereas Medu Vada provides ~4g protein with higher caloric density from frying (~160 kcal). For today’s remaining balance, Idli + Sambar aligns more closely with your target while requiring fewer estimated calories.',
        suggestions: ['View side-by-side comparison', 'Suggest next dinner'],
      };
    }

    return {
      reply:
        'NutriSense focuses on what to eat next based on what you have already logged. Based on your profile and today’s meals, prioritizing an iron-rich and protein-dense evening choice will keep your nutrition balanced without restrictive counting.',
      suggestions: [
        'What nutrient am I low on today?',
        'Suggest a protein-rich snack.',
        'What can I eat under ₹150?',
      ],
    };
  },
};
