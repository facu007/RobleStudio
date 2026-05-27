/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "outline": "#737973",
        "error": "#ba1a1a",
        "primary-fixed-dim": "#b4ccbb",
        "secondary-fixed": "#ffdcc5",
        "surface": "#fcf9f4",
        "surface-container-high": "#ebe8e3",
        "on-secondary": "#ffffff",
        "background": "#fcf9f4",
        "secondary-fixed-dim": "#f4bb92",
        "inverse-surface": "#31302d",
        "surface-variant": "#e5e2dd",
        "on-secondary-fixed": "#301400",
        "surface-container-lowest": "#ffffff",
        "on-primary-fixed-variant": "#364c3e",
        "inverse-primary": "#b4ccbb",
        "on-secondary-fixed-variant": "#653d1e",
        "on-surface-variant": "#424843",
        "surface-container-low": "#f6f3ee",
        "outline-variant": "#c2c8c2",
        "on-tertiary-container": "#db790a",
        "on-primary": "#ffffff",
        "surface-bright": "#fcf9f4",
        "on-secondary-container": "#794e2e",
        "tertiary-fixed-dim": "#ffb77d",
        "secondary": "#805533",
        "primary-container": "#1a2f23",
        "on-tertiary": "#ffffff",
        "on-error-container": "#93000a",
        "surface-container": "#f0ede8",
        "surface-tint": "#4d6355",
        "on-primary-container": "#809787",
        "secondary-container": "#fdc39a",
        "on-surface": "#1c1c19",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "inverse-on-surface": "#f3f0eb",
        "tertiary-container": "#452200",
        "tertiary-fixed": "#ffdcc3",
        "surface-dim": "#dcdad5",
        "primary": "#051a0f",
        "primary-fixed": "#d0e9d6",
        "tertiary": "#271100",
        "surface-container-highest": "#e5e2dd",
        "on-background": "#1c1c19",
        "on-primary-fixed": "#0a2014",
        "on-tertiary-fixed-variant": "#6e3900",
        "on-tertiary-fixed": "#2f1500"
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "sm": "0.25rem",
        "md": "0.75rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
      spacing: {
        "container-max-width": "1280px",
        "margin-desktop": "64px",
        "margin-mobile": "20px",
        "gutter": "24px",
        "section-gap": "120px",
        "unit": "8px"
      },
      fontFamily: {
        "headline-xl-mobile": ["Playfair Display"],
        "label-md": ["Inter"],
        "headline-lg": ["Playfair Display"],
        "code-snippet": ["Courier Prime"],
        "headline-xl": ["Playfair Display"],
        "headline-md": ["Playfair Display"],
        "body-lg": ["Inter"],
        "body-md": ["Inter"]
      },
      fontSize: {
        "headline-xl-mobile": ["40px", { "lineHeight": "1.2", "fontWeight": "700" }],
        "label-md": ["14px", { "lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600" }],
        "headline-lg": ["48px", { "lineHeight": "1.2", "fontWeight": "600" }],
        "code-snippet": ["14px", { "lineHeight": "1.5", "fontWeight": "400" }],
        "headline-xl": ["64px", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "headline-md": ["32px", { "lineHeight": "1.3", "fontWeight": "600" }],
        "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "400" }],
        "body-md": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }]
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    }
  },
  plugins: [
    forms,
    containerQueries,
  ],
}
