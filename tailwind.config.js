/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#070a14',
          900: '#0b0f1c',
          850: '#0f1424',
          800: '#141a2e',
          750: '#1a2138',
          700: '#222a44',
          600: '#2c3656',
          500: '#3b4769',
        },
        violet: {
          accent: '#8b5cf6',
        },
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 40px -20px rgba(0,0,0,0.8)',
        glow: '0 0 0 1px rgba(139,92,246,0.35), 0 0 30px -6px rgba(139,92,246,0.45)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
