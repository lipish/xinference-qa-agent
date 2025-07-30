/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf7fe',
          100: '#f4edfd',
          200: '#e9ddfb',
          300: '#d5c2f9',
          400: '#c19ef6',
          500: '#a55df4',
          600: '#9542f0',
          700: '#8332e3',
          800: '#6d2bbf',
          900: '#5a249b',
        },
        danger: {
          50: '#fef2f4',
          100: '#fde2e7',
          200: '#fbcad3',
          300: '#f7a2b1',
          400: '#f2708a',
          500: '#f2446f',
          600: '#e91e63',
          700: '#c2185b',
          800: '#ad1457',
          900: '#880e4f',
        },
        secondary: {
          50: '#fdfcff',
          100: '#faf8fe',
          200: '#f3f0fc',
          300: '#e8e1f9',
          400: '#ddd2f6',
          500: '#d5c2f9',
          600: '#c8aef6',
          700: '#b899f3',
          800: '#a684f0',
          900: '#9470ed',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
