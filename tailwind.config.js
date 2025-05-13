/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          sand: '#F3F1EE',
          slate: '#2D3E50',
          wine: '#8C2F39',
          sandlight: '#F8F6F3',
          sandborder: '#DDD6CE',
          sandneutral: '#E5DED5',
          graphite: '#4A4A4A',
          placeholder: '#B0AFAE',
        },
        fontFamily: {
          sans: ['IBM Plex Sans', 'Arial', 'sans-serif'],
          serif: ['Spectral SC', 'serif'],
        },
        borderRadius: {
          xl: '12px',
          md: '6px',
        },
        boxShadow: {
          soft: '0 2px 6px rgba(0,0,0,0.08)',
          softHover: '0 4px 12px rgba(0,0,0,0.12)',
        },
        letterSpacing: {
          elegant: '0.5px',
        },
        lineHeight: {
          relaxed: '1.6em',
          heading: '1.3em',
        },
      },
    },
    plugins: [],
  }