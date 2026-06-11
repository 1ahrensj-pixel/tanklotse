import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // TankLotse-eigene Palette: tiefes Petrol + frisches Mint, NICHT
        // bekannte Spritpreis-App-Farben.
        brand: {
          50: '#ecf6f5',
          100: '#cfe9e6',
          200: '#9fd2cd',
          300: '#6fbcb4',
          400: '#3fa59b',
          500: '#1f7e75',
          600: '#196259',
          700: '#13473f',
          800: '#0c2c25',
          900: '#06110d',
        },
        accent: {
          400: '#ffd166',
          500: '#f4b400',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
