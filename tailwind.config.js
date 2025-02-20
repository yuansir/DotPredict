/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        loading1: {
          '0%, 100%': { opacity: 0 },
          '20%': { opacity: 1 },
        },
        loading2: {
          '20%, 100%': { opacity: 0 },
          '40%': { opacity: 1 },
        },
        loading3: {
          '40%, 100%': { opacity: 0 },
          '60%': { opacity: 1 },
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s infinite',
        'loading1': 'loading1 1s infinite',
        'loading2': 'loading2 1s infinite',
        'loading3': 'loading3 1s infinite',
      },
      colors: {
        primary: {
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
        },
      },
    },
  },
  plugins: [],
}
