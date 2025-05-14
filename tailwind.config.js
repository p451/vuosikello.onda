/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F7F7', // Off-white, soft background
        surface: 'rgba(255,255,255,0.7)', // Glassmorphism surface
        primary: '#F4C6A6', // Pantone 2025 Peach Fuzz
        primaryHover: '#eebd98', // Add missing primaryHover for hover:bg-primaryHover
        secondary: '#8AB9E2', // Hillitty vaaleansininen
        accent: '#B3B3B3', // Vaalea harmaa der
        highlight: '#F9E6D2', // Add highlight for hover:bg-highlight
        textPrimary: '#2E2E2E', // Tummanharmaa
        textSecondary: '#4A4A4A', // Keskitumma harmaa
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
  darkMode: 'class',
  plugins: [require('tailwindcss-filters')],
}
