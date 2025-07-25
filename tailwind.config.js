/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f4',
          100: '#dcf2e4',
          200: '#bce5cd',
          300: '#8dd1aa',
          400: '#57b67f',
          500: '#006a34', // Couleur principale
          600: '#005529',
          700: '#004422',
          800: '#00361c',
          900: '#002d17',
        },
        paiecash: {
          DEFAULT: 'rgb(0,106,52)',
          light: 'rgb(0,126,62)',
          dark: 'rgb(0,86,42)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}