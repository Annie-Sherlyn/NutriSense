import { ENV } from '../config/env';
import { request } from './api';
import { delay, checkSimulatedError } from '../utils/delay';
import { supabaseFoodService } from './supabase/food.service';
import type { SpeechResult } from '../types';

export const speechService = {
  // Transcribe recorded audio blob
  async transcribe(audioBlob: Blob): Promise<SpeechResult> {
    checkSimulatedError();

    if (!ENV.USE_MOCK_API) {
      // TODO(SPEECH): Connect real speech-to-text model endpoint (e.g. POST /speech/transcribe)
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-log.webm');
      return request<SpeechResult>('/speech/transcribe', {
        method: 'POST',
        body: formData,
      });
    }

    await delay(900, 1600);

    return {
      transcript: 'Two idlis, one vada and filter coffee',
      confidence: 0.94,
      extractedItems: [
        {
          name: 'Idli (2 pcs) with Sambar & Chutney',
          quantity: 2,
          unit: 'pcs',
          matchedFoodId: 'food-idli',
        },
        {
          name: 'Medu Vada (1 pc)',
          quantity: 1,
          unit: 'pc',
          matchedFoodId: 'food-vada',
        },
        {
          name: 'Traditional Filter Coffee',
          quantity: 1,
          unit: 'cup',
          matchedFoodId: 'food-filter-coffee',
        },
      ],
    };
  },

  // Parse typed text into food candidate items (for manual speech fallback)
  async parseTypedText(text: string): Promise<SpeechResult> {
    checkSimulatedError();

    if (!ENV.USE_MOCK_API) {
      const response = await request<any>('/speech/text', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      // Map to SpeechResult shape
      if (response.parsed_items) {
        return {
          transcript: response.transcript,
          confidence: 0.95,
          extractedItems: response.parsed_items.map((item: any) => ({
            name: item.raw_label,
            quantity: item.quantity,
            unit: item.unit,
            matchedFoodId: item.resolved_food_id,
          })),
        };
      }
      return response;
    }

    const lower = text.toLowerCase();
    const items: SpeechResult['extractedItems'] = [];

    // 1. Resolve directly from connected foods database & dataset
    const matched = await supabaseFoodService.resolveByLabel(text);
    if (matched) {
      items.push({
        name: matched.name,
        quantity: lower.includes('two') || lower.includes('2') ? 2 : 1,
        unit: matched.servingDescription || 'serving',
        matchedFoodId: matched.id,
      });
    } else {
      // Check individual words/clauses against database
      const parts = text.split(/,|and|\+/i).map((p) => p.trim()).filter(Boolean);
      for (const part of parts) {
        const food = await supabaseFoodService.resolveByLabel(part);
        if (food && !items.some((it) => it.matchedFoodId === food.id)) {
          items.push({
            name: food.name,
            quantity: 1,
            unit: food.servingDescription || 'serving',
            matchedFoodId: food.id,
          });
        }
      }
    }

    if (items.length === 0) {
      // Try searching for partial match in dataset
      const searchRes = await supabaseFoodService.searchFoods(text);
      if (searchRes.length > 0) {
        const top = searchRes[0];
        items.push({
          name: top.name,
          quantity: 1,
          unit: top.servingDescription || 'serving',
          matchedFoodId: top.id,
        });
      }
    }

    return {
      transcript: text,
      confidence: items.length > 0 ? 0.95 : 0.75,
      extractedItems: items.length > 0 ? items : [
        {
          name: text.trim() || 'Custom dish',
          quantity: 1,
          unit: 'serving',
          matchedFoodId: undefined,
        },
      ],
    };
  },
};
