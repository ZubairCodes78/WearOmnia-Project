import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#103D42',
          50: '#F0F7F8',
          100: '#DDEEF0',
          200: '#BFDEE2',
          300: '#94C6CD',
          400: '#63A5B0',
          500: '#3D8592',
          600: '#276874',
          700: '#1A5059',
          800: '#103D42',
          900: '#0A2A2E',
          950: '#041517',
        },
        champagne: {
          DEFAULT: '#DFC3A0',
          50: '#FAF6F0',
          100: '#F4EBDD',
          200: '#E9D6BE',
          300: '#DFC3A0',
          400: '#D2AD7E',
          500: '#C2945B',
          600: '#A97B43',
          700: '#875F34',
          800: '#6A4A2C',
          900: '#513924',
        },
        offwhite: '#FAF8F5',
        charcoal: {
          DEFAULT: '#1A1A1A',
          light: '#2D2D2D',
          muted: '#666666',
        },
        sand: '#F4F0EA',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-jost)', 'Jost', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scale-pop': 'scalePop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 1.8s ease-in-out infinite',
        'badge-pop': 'badgePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scalePop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        badgePop: {
          '0%': { transform: 'scale(0)' },
          '60%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      aspectRatio: {
        'portrait': '3 / 4',
        'editorial': '4 / 5',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
