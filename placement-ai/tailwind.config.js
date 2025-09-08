/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',  // Main primary color
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',  // Main secondary color
          900: '#0f172a',
        },
        accent: {
          50: '#f8fafc',
          100: '#f1f5f9',  // Main accent color
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        brand: {
          primary: '#2563eb',     // Blue primary
          secondary: '#1e293b',   // Dark gray secondary
          accent: '#f1f5f9',      // Light gray accent
          muted: '#f8fafc',       // Very light gray
          soft: '#ffffff',        // Pure white
          highlight: '#eff6ff',   // Light blue tint
          text: '#0f172a',        // Dark text
          subtext: '#64748b',     // Medium gray text
        },
        // Semantic status aliases (centralized)
        status: {
          success: '#10b981', // emerald-500
          warning: '#f59e0b', // amber-500
          danger: '#ef4444',  // red-500
          info: '#3b82f6',    // blue-500
        },
        // Instagram theme integration
        insta: {
          1: '#F58529',           // Orange
          2: '#DD2A7B',           // Pink
          3: '#8134AF',           // Purple
          4: '#515BD4',           // Blue
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
