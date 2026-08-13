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
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0284c7',
          600: '#026aa7',
          700: '#035388',
          900: '#072d4a',
        }
      },
      fontFamily: {
        sans: ['"Agave Nerd Font Mono"', 'monospace'],
        mono: ['"Agave Nerd Font Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
