/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F9F6F1',         // Päätausta
        surface: 'rgba(255,255,255,0.6)',            // Kortit, inputit
        primary: '#D04C2A',            // Primary-painikkeet & korostus
        primaryDark: '#A03C33',        // Hover-tilat & painikkeiden varjostus
        primaryHover: '#A03C33',
        secondary: '#E5DED5',          // Toissijaiset elementit, napit
        border: '#DDD6CE',             // Viivat ja rajaukset
        textPrimary: '#2D2D2D',        // Pääteksti
        textSecondary: '#5A5A5A',      // Labelit & sekundaaritekstit
        graphite: '#4A4A4A',           // Ikonit
        placeholder: '#A0A0A0',        // Placeholder-tekstit
        highlight: '#F3E6E8',          // Valitut elementit (esim. calendar-day)
        sakura: '#F2E1E6',
        metal: '#939AA2',
        accentPink: '#FBB1C1',
        lowlightBg: '#2E3034',
        lowlightText: '#BBBFC4',
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],        // Pääfontti
        serif: ['Noto Serif', 'serif'],      // Otsikot (small caps)
      },
      borderRadius: {
        sm: '6px', // pienet komponentit
        md: '8px',                           // Nappien & inputtien border-radius
        lg: '12px',                          // Kortit, modaalit
        xl: '12px',                          // Kortit, modaalit
      },
      boxShadow: {
        soft: '0 2px 4px rgba(0,0,0,0.06)',  // Pehmeä varjo peruselementeille
        softHover: '0 4px 8px rgba(0,0,0,0.08)', // Hover-nosto
        subtle: '0 1px 2px rgba(0,0,0,0.04)', // Erittäin kevyt shadow
        hover: '0 4px 8px rgba(0,0,0,0.08)',
        glass: '0 2px 6px rgba(35,33,26,0.06), 0 8px 16px rgba(35,33,26,0.08)',
      },
      letterSpacing: {
        normal: '0.01em',
        elegant: '0.5px',                    // Otsikoiden hienosäätö
      },
      lineHeight: {
        relaxed: '1.6em',                    // Body-tekstin riviväli
        heading: '1.3em',                    // Otsikoiden riviväli
      },
      transitionTimingFunction: {
        softEase: 'cubic-bezier(0.4, 0, 0.2, 1)',  // Pehmeä easing efekti
      },
      translate: {
        'press': '1px',                      // Painallus-efekti active state
        'hoverLift': '-1px',                 // Hover-lift efekti painikkeille
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
