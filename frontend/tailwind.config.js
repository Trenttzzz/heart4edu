/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C9184A', // --rose-red
        accent: '#FF4D6D',  // --bright-pink
        accent2: '#FF758F', // --bright-pink-2
        salmon: '#FF8FA3',  // --salmon-pink
        surface: '#FFB3C1', // --cherry-pink
        background: '#FFE5EC', // light pink background
        'rose-red': '#C9184A',
        'bright-pink': '#FF4D6D',
        'bright-pink-2': '#FF758F',
        'salmon-pink': '#FF8FA3',
        'cherry-pink': '#FFB3C1',
        status: {
          warning: '#FEF3C7',
          'warning-border': '#D97706',
          danger: '#FEE2E2',
          'danger-border': '#DC2626',
          success: '#ECFDF5',
          'success-border': '#059669',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceGentle: {
          '0%, 100%': {
            transform: 'translateY(-5%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
