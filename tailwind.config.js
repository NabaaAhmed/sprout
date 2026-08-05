function withOpacity(rgbVar, fallback) {
  return ({ opacityValue }) =>
    opacityValue === undefined ? fallback : `rgb(var(${rgbVar}) / ${opacityValue})`
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sprout: {
          cream: '#FFF8ED',
          sage: '#A8C69F',
          moss: '#6B8F5C',
          peach: '#F4B183',
          blush: '#F2A0A0',
          brown: '#8B5E3C',
          sky: '#C7E0EA',
          charcoal: '#3D3327',
          gold: '#E8C468',
          // Softer, less saturated variants used for most UI surfaces —
          // the full-strength colors above are reserved for tiny icon accents.
          // Defined as functions (not plain var() strings) so opacity
          // modifiers like `bg-sprout-peachSoft/25` resolve correctly.
          peachSoft: withOpacity('--sprout-peach-soft-rgb', 'var(--sprout-peach-soft)'),
          blushSoft: withOpacity('--sprout-blush-soft-rgb', 'var(--sprout-blush-soft)'),
          goldSoft: withOpacity('--sprout-gold-soft-rgb', 'var(--sprout-gold-soft)'),
        },
      },
      fontFamily: {
        pixel: ['"Pixelify Sans"', 'cursive'],
        display: ['"Silkscreen"', 'cursive'],
        body: ['"Nunito"', 'sans-serif'],
      },
      boxShadow: {
        pixel: '3px 3px 0px 0px rgba(61, 51, 39, 0.25)',
        'pixel-sm': '2px 2px 0px 0px rgba(61, 51, 39, 0.25)',
        'pixel-inset': 'inset 2px 2px 0px 0px rgba(61, 51, 39, 0.12)',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scaleY(1) translateY(0)' },
          '50%': { transform: 'scaleY(1.015) translateY(-1.5px)' },
        },
        // Calm settle-in: gentle fade + tiny rise, no overshoot/bounce.
        settleIn: {
          '0%': { opacity: '0', transform: 'scale(0.98) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.45', transform: 'scale(0.92)' },
          '50%': { opacity: '0.9', transform: 'scale(1.05)' },
        },
        drift: {
          '0%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(3px, -4px)' },
          '50%': { transform: 'translate(-3px, -2px)' },
          '75%': { transform: 'translate(2px, 3px)' },
          '100%': { transform: 'translate(0, 0)' },
        },
        gentleFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        foodPop: {
          '0%': { opacity: '0', transform: 'scale(0.4) translateY(8px)' },
          '70%': { opacity: '1', transform: 'scale(1.08) translateY(-2px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        foodFade: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.6) translateY(4px)' },
        },
      },
      animation: {
        breathe: 'breathe 4.2s ease-in-out infinite',
        settleIn: 'settleIn 0.45s ease-out',
        fadeIn: 'fadeIn 0.2s ease-out',
        sparkle: 'sparkle 2.6s ease-in-out infinite',
        drift: 'drift 7.5s ease-in-out infinite',
        gentleFloat: 'gentleFloat 3.2s ease-in-out infinite',
        foodPop: 'foodPop 0.32s ease-out both',
        foodFade: 'foodFade 0.28s ease-in both',
      },
    },
  },
  plugins: [],
}
