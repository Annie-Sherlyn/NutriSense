import { TOKENS } from '../config/tokens';

export const delay = (minMs = 600, maxMs = 1200): Promise<void> => {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const checkSimulatedError = (): void => {
  try {
    const raw = localStorage.getItem(TOKENS.storageKeys.settings);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.simulateError) {
        throw {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Simulated Developer Error: Backend service unavailable.',
          recoverable: true,
          action: 'Disable "Simulate error" in Settings -> Developer to resume normal mock flow.',
        };
      }
    }
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e) throw e;
  }
};
