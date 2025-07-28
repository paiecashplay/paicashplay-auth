/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        paiecash: {
          DEFAULT: 'rgb(0,106,52)',
          light: 'rgb(0,126,62)',
          dark: 'rgb(0,86,42)',
        },
      },
    },
  },
  plugins: [],
}