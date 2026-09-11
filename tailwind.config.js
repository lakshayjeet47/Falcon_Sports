/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        courtNavy: '#101A2B',
        courtNavyLight: '#1B2A45',
        chalk: '#F4F6F1',
        falconAmber: '#E8A23D',
        falconAmberDark: '#C77F1F',
        hawkRed: '#D64545',
        ink: '#12151C',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        sans: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
