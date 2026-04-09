/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          400: '#66BB6A',
          600: '#2E7D4F',
          700: '#1B5E20',
          800: '#145230',
          900: '#0D3B22',
        },
        accent: {
          400: '#FFCA28',
          500: '#F9A825',
          600: '#F57F17',
        },
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '10px',
      },
    },
  },
  plugins: [],
}
