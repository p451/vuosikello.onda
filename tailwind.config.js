// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: '#F8F9FA',   // Hellä vaalea tausta
        surface: '#FFFFFF',      // Korttipinta
        border: '#E5E7EB',       // Hillitty harmaa
        primary: '#2563EB',      // Korporaatioblue
        primaryHover: '#1E40AF', // Hover-sävy
        accent: '#6B7280',       // Neutraali aksentti
        textPrimary: '#111827',  // Kirkas teksti
        textSecondary: '#6B7280',// Himmennetty teksti
        placeholder: '#9CA3AF',
        error: '#DC2626',
        success: '#16A34A',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0,0,0,0.1)',
        card: '0 4px 16px rgba(0,0,0,0.1)',
      },
      letterSpacing: {
        tight: '-0.02em',
        normal: '0em',
        relaxed: '0.02em',
      },
      lineHeight: {
        relaxed: '1.5',
        heading: '1.25',
      },
      transitionTimingFunction: {
        soft: 'ease-in-out',
      },
      gridTemplateColumns: {
        bento: 'repeat(auto-fit, minmax(240px, 1fr))',
      },
    },
  },
  darkMode: false,
  plugins: [],
};