/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FFFDF7', // Glare-free canvas
        'deep-black': '#0A0A0A', // Deep black high contrast text
        elder: {
          bg: '#FFFDF7',
          surface: '#F5F2E9',
          surfaceHover: '#EBE5D8',
          border: '#3F3F46',
          text: '#0A0A0A',
          muted: '#27272A',
          primary: '#065F46', // High contrast emerald
          primaryHover: '#047857',
          accent: '#9A3412', // Warm saffron / terracotta
          accentHover: '#C2410C',
          warning: '#9A3412',
          danger: '#991B1B',
          success: '#065F46',
          card: '#FFFFFF'
        }
      },
      minHeight: {
        'touch': '72px',
        'touch-lg': '88px',
      },
      minWidth: {
        'touch': '72px',
        'touch-lg': '88px',
      },
      fontSize: {
        'elder-base': ['20px', { lineHeight: '30px' }],
        'elder-lg': ['24px', { lineHeight: '34px' }],
        'elder-xl': ['30px', { lineHeight: '40px' }],
        'elder-2xl': ['36px', { lineHeight: '46px' }],
      }
    },
  },
  plugins: [],
}
