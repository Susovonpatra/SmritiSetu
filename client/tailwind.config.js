/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stitch Warm Clinical Geriatric Design Tokens
        primary: {
          DEFAULT: '#0e3b2e',
          fixed: '#bfecd9',
          'fixed-dim': '#a3d0be',
          container: '#285244',
        },
        'on-primary': {
          DEFAULT: '#ffffff',
          container: '#97c4b2',
          fixed: '#002117',
          'fixed-variant': '#244e40',
        },
        secondary: {
          DEFAULT: '#9c4328',
          fixed: '#ffdbd1',
          'fixed-dim': '#ffb59f',
          container: '#ff8f6e',
        },
        'on-secondary': {
          DEFAULT: '#ffffff',
          container: '#76270e',
          fixed: '#3a0a00',
          'fixed-variant': '#7d2c13',
        },
        tertiary: {
          DEFAULT: '#482f00',
          container: '#654400',
          fixed: '#ffdeae',
          'fixed-dim': '#fdba45',
        },
        'on-tertiary': {
          DEFAULT: '#ffffff',
          container: '#efae3a',
          fixed: '#281900',
          'fixed-variant': '#604100',
        },
        surface: {
          DEFAULT: '#f7f9ff',
          bright: '#f7f9ff',
          dim: '#d0dbea',
          tint: '#3d6658',
          variant: '#d8e4f3',
          container: '#e3effe',
          'container-low': '#edf4ff',
          'container-high': '#dee9f8',
          'container-highest': '#d8e4f3',
          'container-lowest': '#ffffff',
        },
        'on-surface': {
          DEFAULT: '#111d27',
          variant: '#414845',
        },
        outline: {
          DEFAULT: '#717974',
          variant: '#c0c8c3',
        },
        'inverse-surface': '#26313d',
        'inverse-on-surface': '#e8f2ff',
        'inverse-primary': '#a3d0be',
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': {
          DEFAULT: '#ffffff',
          container: '#93000a',
        },
        // Legacy fallback tokens
        canvas: '#FFFDF7',
        'deep-black': '#0A0A0A',
        elder: {
          bg: '#FFFDF7',
          surface: '#F5F2E9',
          surfaceHover: '#EBE5D8',
          border: '#3F3F46',
          text: '#0A0A0A',
          muted: '#27272A',
          primary: '#0e3b2e',
          primaryHover: '#047857',
          accent: '#9c4328',
          accentHover: '#C2410C',
          warning: '#9c4328',
          danger: '#ba1a1a',
          success: '#0e3b2e',
          card: '#FFFFFF',
        },
      },
      fontFamily: {
        headline: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        'margin-mobile': '1.25rem',
        'gutter-mobile': '1rem',
        'space-xs': '0.375rem',
        'space-sm': '0.75rem',
        'space-md': '1.25rem',
        'space-lg': '2rem',
        'space-xl': '3rem',
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
