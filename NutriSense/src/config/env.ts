export const ENV = {
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID || '',
  USE_MOCK_API: import.meta.env.VITE_USE_MOCK_API !== 'false',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
};

export const isFirebaseConfigured = Boolean(
  ENV.FIREBASE_API_KEY &&
  ENV.FIREBASE_PROJECT_ID &&
  ENV.FIREBASE_API_KEY.length > 5
);
