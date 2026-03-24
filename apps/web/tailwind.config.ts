import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          deep:     '#0B1120',
          surface:  '#111B2E',
          elevated: '#152238',
        },
        amber: {
          '500': '#F59E0B',
          '600': '#D97706',
        },
        player: {
          '0': '#3B82F6',
          '1': '#EC4899',
          '2': '#10B981',
          '3': '#8B5CF6',
          '4': '#06B6D4',
          '5': '#F43F5E',
          '6': '#84CC16',
          '7': '#F97316',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      backgroundImage: {
        'gradient-app': 'linear-gradient(180deg, #0B1120 0%, #152238 100%)',
      },
      keyframes: {
        'slide-up': {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        'counter': {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
        'fade-in':  'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'counter':  'counter 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
