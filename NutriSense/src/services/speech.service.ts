import { ENV } from '../config/env';
import { request } from './api';
import { delay, checkSimulatedError } from '../utils/delay';
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
  parseTypedText(text: string): SpeechResult {
    const lower = text.toLowerCase();
    const items: SpeechResult['extractedItems'] = [];

    if (lower.includes('idli') || lower.includes('idly')) {
      items.push({
        name: 'Idli (2 pcs) with Sambar & Chutney',
        quantity: lower.includes('two') || lower.includes('2') ? 2 : 1,
        unit: 'pcs',
        matchedFoodId: 'food-idli',
      });
    }
    if (lower.includes('vada') || lower.includes('wada')) {
      items.push({
        name: 'Medu Vada (1 pc)',
        quantity: 1,
        unit: 'pc',
        matchedFoodId: 'food-vada',
      });
    }
    if (lower.includes('coffee') || lower.includes('kaapi')) {
      items.push({
        name: 'Traditional Filter Coffee',
        quantity: 1,
        unit: 'cup',
        matchedFoodId: 'food-filter-coffee',
      });
    }
    if (lower.includes('dosa') || lower.includes('dose')) {
      items.push({
        name: 'Masala Dosa',
        quantity: 1,
        unit: 'plate',
        matchedFoodId: 'food-masala-dosa',
      });
    }

    return {
      transcript: text,
      confidence: 0.88,
      extractedItems: items.length > 0 ? items : [
        {
          name: text.trim() || 'Custom dish',
          quantity: 1,
          unit: 'serving',
          matchedFoodId: 'food-idli',
        },
      ],
    };
  },
};
