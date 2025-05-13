/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F9F6F1',            // Päätausta
        surface: '#FAF8F5',               // Kortit, inputit, neutral surface
        primary: '#D04C2A',               // Primary-painikkeet (terrakotta)
        primaryHover: '#A03C33',          // Hover-tila
        secondary: '#E5DED5',             // Secondary-pohjat, inputit
        border: '#DDD6CE',                // Borderit, separatorit
        textPrimary: '#2D2D2D',           // Pääteksti
        textSecondary: '#5A5A5A',         // Labelit, selitteet
        placeholder: '#A0A0A0',           // Placeholder-tekstit
        highlight: '#F3E6E8',             // Valittu tila (calendar-day etc.)
        graphite: '#4A4A4A',              // Ikonit ja graafiset elementit
        accentPink: '#FBB1C1',            // Sävytys-elementteihin (optionaalinen)
        sakura: '#F2E1E6',                // Visuaalinen aksenttisävy
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],    // Body-teksti ja nappien fontti
        serif: ['Noto Serif', 'serif'],    // Otsikot
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        soft: '0 2px 4px rgba(0,0,0,0.06)',
        softHover: '0 4px 8px rgba(0,0,0,0.08)',
        subtle: '0 1px 2px rgba(0,0,0,0.04)',
        card: '0 2px 6px rgba(35,33,26,0.06), 0 8px 16px rgba(35,33,26,0.08)',
      },
      letterSpacing: {
        tight: '-0.01em',
        normal: '0em',
        elegant: '0.5px',                 // Otsikoiden spacing
      },
      lineHeight: {
        relaxed: '1.6em',                 // Body-tekstin riviväli
        heading: '1.3em',                 // Otsikoiden riviväli
      },
      transitionTimingFunction: {
        softEase: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      translate: {
        'press': '1px',                   // Aktiivinen painallus
        'hoverLift': '-1px',              // Hover-lift efekti
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
