/** @type {import('tailwindcss').Config} */
module.exports = {
  // A linha mais importante que faltava:
  darkMode: 'class',

  content: [
    // Garante que o Tailwind analisa todos os seus ficheiros
    './src/**/*.{html,js}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}