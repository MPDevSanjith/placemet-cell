/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#4E2A84',     // Deep Violet (slightly richer)
          secondary: '#A87CA0',   // Pastel Plum
          accent: '#7C3AED',      // Professional accent (violet-600)
          muted: '#F3F4F6',       // Neutral surface (gray-100)
          soft: '#FFFFFF',        // Pure white for cards
          highlight: '#EDE9FE',   // Subtle violet tint
          text: '#111827',        // Gray-900
          subtext: '#6B7280',     // Gray-500
        },
      },
      boxShadow: {
        lavender: '0 10px 30px rgba(125, 90, 160, 0.25)',
        subtle: '0 8px 20px rgba(0,0,0,0.08)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        bubble: {
          '0%': { transform: 'translateY(0)', opacity: '0.6' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(-12px)', opacity: '0.6' },
        },
        pulseStone: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(168, 124, 160, 0.5)' },
          '50%': { transform: 'scale(1.02)', boxShadow: '0 0 0 8px rgba(168, 124, 160, 0.15)' },
        },
        dash: {
          '0%': { strokeDashoffset: '120' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        bubble: 'bubble 4s ease-in-out infinite',
        pulseStone: 'pulseStone 2.5s ease-in-out infinite',
        dash: 'dash 6s linear infinite',
      },
    },
  },
  plugins: [],
}
