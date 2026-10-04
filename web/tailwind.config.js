/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        royal: {
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'delphi-card': '0 20px 40px -15px rgba(15, 23, 42, 0.04), 0 0 1px 1px rgba(255, 255, 255, 0.95) inset, 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
        'pill-hover': '0 10px 25px -5px rgba(2, 132, 199, 0.12), 0 4px 6px -2px rgba(2, 132, 199, 0.05)',
      },
    },
  },
  plugins: [],
}
