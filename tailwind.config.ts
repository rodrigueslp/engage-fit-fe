import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#c2410c',
          soft: '#fff7ed',
          dark: '#9a3412',
        },
      },
      boxShadow: {
        panel: '0 1px 2px rgba(15, 23, 42, 0.05)',
      },
    },
  },
  plugins: [],
} satisfies Config;
