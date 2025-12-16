import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Chakra Petch', 'Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        operational: '#0B0E14',
        hud: '#141A26',
        cyan: '#00F0FF',
        amber: '#D4A536',
        'text-primary': '#E6F1FF',
        'text-secondary': '#7F94B0',
        'border-structure': '#2D3A52',
      },
      boxShadow: {
        'glow-cyan': '0 0 10px rgba(0, 240, 255, 0.3)',
        'glow-cyan-intense': '0 0 20px rgba(0, 240, 255, 0.6)',
        'glow-amber': '0 0 10px rgba(255, 107, 0, 0.3)',
        'glow-amber-intense': '0 0 20px rgba(255, 107, 0, 0.6)',
      },
      keyframes: {
        'loading-bar': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
      },
      animation: {
        'loading-bar': 'loading-bar 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
