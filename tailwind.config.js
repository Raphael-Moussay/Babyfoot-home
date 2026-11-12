/**
 * Tailwind CSS configuration for the Baby-Menil application.
 * Uses the Cricket Cut-throat Pro dark glassmorphism theme, Chakra Petch display typography,
 * and Plus Jakarta Sans body typography.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', '"Chakra Petch"', 'monospace', 'sans-serif'],
        chakra: ['var(--font-display)', '"Chakra Petch"', 'monospace', 'sans-serif'],
        body: ['var(--font-body)', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        pitch: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      animation: {
        'flame': 'flame 1.5s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.25s ease-out',
        'pop': 'pop 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        flame: {
          '0%': { transform: 'scale(1) rotate(-3deg)', filter: 'hue-rotate(0deg)' },
          '100%': { transform: 'scale(1.1) rotate(3deg)', filter: 'hue-rotate(20deg)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
