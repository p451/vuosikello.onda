/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 2025 trend: tumma tausta, vaaleat kortit, neon-aksentit
        background: '#181A20',       // Soft dark
        surface: 'rgba(255,255,255,0.10)', // Glassmorphism
        card: '#23262F',             // Kortit
        border: '#353945',
        primary: '#7B61FF',          // Neon violetti
        primaryHover: '#6246EA',
        accent: '#00FFA3',           // Neon lime
        accent2: '#FF61C7',          // Neon pinkki
        accent3: '#1FAAFF',          // Neon sininen
        textPrimary: '#F4F5F6',
        textSecondary: '#A3A7B7',
        placeholder: '#6E7381',
        error: '#FF4D4F',
        success: '#00E197',
        warning: '#FFD600',
        glass: 'rgba(255,255,255,0.18)',
        // Legacy/compat
        graphite: '#4A4A4A',
        sakura: '#F2E1E6',
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'Satoshi', 'Space Grotesk', 'sans-serif'],
        serif: ['Space Grotesk', 'serif'],
      },
      borderRadius: {
        sm: '12px',
        md: '18px',
        lg: '32px',
        xl: '48px',
        full: '9999px',
      },
      boxShadow: {
        soft: '0 4px 24px 0 rgba(0,0,0,0.10)',
        glass: '0 8px 32px 0 rgba(31, 42, 55, 0.18)',
        neon: '0 0 16px 2px #7B61FF, 0 0 32px 8px #00FFA3',
        card: '0 8px 32px 0 rgba(31, 42, 55, 0.18)',
      },
      letterSpacing: {
        tight: '-0.01em',
        normal: '0em',
        elegant: '0.5px',
      },
      lineHeight: {
        relaxed: '1.6em',   // Body-tekstin riviväli
        heading: '1.3em',   // Otsikoiden riviväli
      },
      transitionTimingFunction: {
        softEase: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      translate: {
        press: '1px',       // Aktiivinen painallus
        hoverLift: '-1px',  // Hover-lift efekti
      },
      backdropBlur: {
        xs: '4px',
        sm: '12px',
      },
      gridTemplateColumns: {
        bento: 'repeat(auto-fit, minmax(280px, 1fr))',
      },
      keyframes: {
        'petals-fall': {
          '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(200px) rotate(15deg)', opacity: '0' },
        },
      },
      animation: {
        'petals-fall': 'petals-fall 4s ease-in infinite',
      },
    },
  },
  darkMode: 'class',
  plugins: [require('tailwindcss-filters')],
}
