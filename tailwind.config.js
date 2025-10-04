const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./public/**/*.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        outfit: ['Outfit', ...defaultTheme.fontFamily.sans],
        'space-grotesk': ['Space Grotesk', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: {
          DEFAULT: "#6a3de8",
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065"
        },
        secondary: {
          DEFAULT: "#1E1E2F",
          light: "#2D2D44",
          dark: "#15151F"
        },
        inputBg: "#2D2D44",
        inputBorder: "#6a3de8",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
      },
      boxShadow: {
        glass: "0 4px 30px rgba(0, 0, 0, 0.1)",
        neon: "0 0 5px theme('colors.fuchsia.500'), 0 0 20px theme('colors.fuchsia.500')",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        successPop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '40%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        bounce: {
          '0%, 100%': {
            transform: 'translateY(0)',
            opacity: '0.5',
          },
          '50%': {
            transform: 'translateY(-8px)',
            opacity: '1',
          },
        },
        'shadow-bounce': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '0.4',
          },
          '50%': {
            transform: 'scale(0.7)',
            opacity: '0.2',
          },
        },
        wave: {
          '0%, 100%': { height: '0.5rem' },
          '50%': { height: '1.5rem' },
        },
        slide: {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' }
        },
        glow: {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(255,255,255,0.3), 0 0 10px rgba(255,255,255,0.1)' 
          },
          '50%': { 
            boxShadow: '0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(255,255,255,0.3)' 
          }
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '25%': { transform: 'translate(2px, -2px)' },
          '50%': { transform: 'translate(-2px, 2px)' },
          '75%': { transform: 'translate(4px, -1px) scale(1.01)' }
        },
        fadeScale: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeSlideLeft: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeSlideRight: {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'spin-fast': 'spin 1.5s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-up': 'fadeUp 0.3s ease-out',
        'success-pop': 'successPop 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
        'fade-in': 'fadeIn 0.2s ease-out',
        'bounce-delayed': 'bounce 0.8s infinite',
        'wave': 'wave 1s infinite ease-in-out',
        'slide': 'slide 1.5s infinite ease-in-out',
        'glow': 'glow 2s infinite ease-in-out',
        'glitch': 'glitch 0.4s ease-in-out',
        'fade-scale': 'fadeScale 0.3s ease-out',
        'fade-slide-left': 'fadeSlideLeft 0.3s ease-out',
        'fade-slide-right': 'fadeSlideRight 0.3s ease-out',
      },
      // 3D card flip utilities
      perspective: {
        '1000': '1000px',
      },
    },
  },
  safelist: [
    'animate-spin',
    'animate-pulse',
    'animate-bounce',
    'animate-wave',
    'animate-slide',
    'animate-glow',
    'animate-fade-scale',
    'animate-fade-slide-left',
    'animate-fade-slide-right',
    'font-outfit',
    'font-space-grotesk',
    'rounded-none',
    'rounded-sm',
    'rounded-md',
    'rounded-lg',
    'rounded-xl',
    'rounded-2xl',
    'rounded-3xl',
    'rounded-full',
    'shadow-none',
    'shadow-sm',
    'shadow-md',
    'shadow-lg',
    'shadow-xl',
    'shadow-neon',
  ],
  plugins: [],
};
