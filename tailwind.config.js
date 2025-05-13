/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F9F6F1',         // Päätausta
        surface: '#FAF8F5',            // Kortit, inputit
        primary: '#C44B3F',            // Primary-painikkeet & korostus
        primaryDark: '#A03C33',        // Hover-tilat & painikkeiden varjostus
        secondary: '#E5DED5',          // Toissijaiset elementit, napit
        border: '#DDD6CE',             // Viivat ja rajaukset
        textPrimary: '#2D2D2D',        // Pääteksti
        textSecondary: '#5A5A5A',      // Labelit & sekundaaritekstit
        graphite: '#4A4A4A',           // Ikonit
        placeholder: '#A0A0A0',        // Placeholder-tekstit
        highlight: '#F3E6E8',          // Valitut elementit (esim. calendar-day)
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],        // Pääfontti
        serif: ['Spectral SC', 'serif'],      // Otsikot (small caps)
      },
      borderRadius: {
        md: '6px',
        lg: '8px',                           // Nappien & inputtien border-radius
        xl: '12px',                          // Kortit, modaalit
      },
      boxShadow: {
        soft: '0 2px 4px rgba(0,0,0,0.06)',  // Pehmeä varjo peruselementeille
        softHover: '0 4px 8px rgba(0,0,0,0.08)', // Hover-nosto
        subtle: '0 1px 2px rgba(0,0,0,0.04)', // Erittäin kevyt shadow
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
    },
  },
  plugins: [],
}
