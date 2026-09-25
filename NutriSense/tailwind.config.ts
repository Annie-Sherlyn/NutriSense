import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          light: '#FBF6EE',
          dark: '#14171A',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1D2125',
          2: {
            light: '#F5EDE0',
            dark: '#252A2F',
          },
        },
        ink: {
          light: '#1F2421',
          dark: '#F2EEE6',
          muted: {
            light: '#6B6F68',
            dark: '#A5A9A2',
          },
        },
        brand: {
          light: '#1F5B45', // deep forest green
          dark: '#5FBF95',
          DEFAULT: '#1F5B45',
          hover: '#184736',
        },
        accent: {
          peach: '#FFD9C2',
          orange: '#E8742C',
          amber: '#F2B33D',
          lavender: '#DCD1F7',
          mint: '#D5EEE1',
        },
        nutrient: {
          protein: '#2E9E5B',
          carbs: '#F2B33D',
          fat: '#7C8CF0',
          fiber: '#2F9E8F',
          iron: '#E2582E',
          calcium: '#2BB3CE',
          b12: '#7B5CD6',
          folate: '#D9649B',
          sodium: '#8A8F98',
          vitamind: '#F0A63A',
          hydration: '#2BB3CE',
          energy: '#F2B33D',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '28px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(31, 36, 33, 0.05), 0 2px 6px -1px rgba(31, 36, 33, 0.03)',
        'soft-lg': '0 10px 30px -4px rgba(31, 36, 33, 0.08), 0 4px 12px -2px rgba(31, 36, 33, 0.04)',
        'soft-xl': '0 20px 40px -6px rgba(31, 36, 33, 0.10), 0 8px 16px -3px rgba(31, 36, 33, 0.05)',
        'dark-soft': '0 4px 20px -2px rgba(0, 0, 0, 0.35)',
        'dark-lg': '0 10px 30px -4px rgba(0, 0, 0, 0.45)',
      },
      transitionDuration: {
        'fast': '120ms',
        'base': '220ms',
        'slow': '420ms',
      },
      maxWidth: {
        'app': '1440px',
      },
    },
  },
  plugins: [],
};

export default config;
