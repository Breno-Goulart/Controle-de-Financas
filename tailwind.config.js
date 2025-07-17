/** @type {import('tailwindcss').Config} */
module.exports = {
  // A linha mais importante é esta: 'darkMode: "class"'
  darkMode: 'class',

  content: [
    // Diz ao Tailwind para procurar classes em todos os ficheiros HTML e JS
    './src/**/*.{html,js}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}