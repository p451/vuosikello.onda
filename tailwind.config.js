/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable Tailwind dark mode via class
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F7F4',
        surface: '#FFFFFF',
        primary: '#F4C6A6',
        secondary: '#8AB9E2',
        accent: '#F4A6C6',
        accentPink: '#F4A6C6',
        error: '#E57373',
        lowlightBg: '#F8F7F4',
        lowlightText: '#B0B0B0',
        textPrimary: '#2E2E2E',
        textSecondary: '#6B7280',
        // Dark mode colors
        darkBackground: '#18181B',
        darkSurface: '#23232A',
        darkPrimary: '#F4C6A6',
        darkSecondary: '#8AB9E2',
        darkAccent: '#F4A6C6',
        darkError: '#E57373',
        darkLowlightBg: '#23232A',
        darkLowlightText: '#888',
        darkTextPrimary: '#F8F7F4',
        darkTextSecondary: '#B0B0B0',
        darkBorder: '#393950',
        darkHighlight: '#2A2A3A',
        // Add missing custom color for hover:bg-primaryHover and hover:bg-highlight
        primaryHover: '#eebd97',
        highlight: '#f7e6d6',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
      },
      borderRadius: {
        lg: '8px', // Global border radius
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.05)',
        modal: '0 4px 16px rgba(0,0,0,0.1)',
        soft: '0 1px 4px rgba(0,0,0,0.04)',
        glass: '0 4px 24px 0 rgba(244,198,166,0.08)',
        subtle: '0 1px 2px rgba(0,0,0,0.03)',
        glassHover: '0 6px 32px 0 rgba(244,198,166,0.12)',
        softHover: '0 2px 8px rgba(0,0,0,0.08)',
        error: '0 2px 8px rgba(229,115,115,0.08)',
        glassModal: '0 8px 32px 0 rgba(244,198,166,0.16)',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      fontSize: {
        h1: ['28px', { lineHeight: '1.3' }],
        base: ['16px', { lineHeight: '1.5' }],
        button: ['14px', { lineHeight: '1.5' }],
      },
      transitionTimingFunction: {
        DEFAULT: 'ease-in-out',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      translate: {
        press: '1px',
        hoverLift: '-1px',
      },
      borderColor: {
        border: '#E5E7EB', // Light gray for border-border
        metal: '#D1D5DB', // For border-metal
        primary: '#F4C6A6',
        secondary: '#8AB9E2',
        error: '#E57373',
      },
    },
  },
  plugins: [require('tailwindcss-filters')],
}
