/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#248C70',
          dark: '#1c6d57',
          light: '#31a687',
        },
        accent: {
          DEFAULT: '#E89D1E',
          dark: '#c48214',
          light: '#f5b038',
        },
        darkblack: '#2C2C2C',
        lightgreen: '#94B2AA',
        lightorange: '#EDB35E',
        offwhite: '#F5FAF8',
        cream: '#E9E2CE',
      },
    },
  },
  plugins: [],
}
