/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E8453C',
          50: '#FFF5F5',
          100: '#FFE0DF',
          200: '#FFC2C0',
          300: '#FF9491',
          400: '#F76D69',
          500: '#E8453C',
          600: '#CC2E25',
          700: '#A8221A',
          800: '#7F1A13',
          900: '#5C130E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
