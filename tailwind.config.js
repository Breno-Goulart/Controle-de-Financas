/** @type {import('tailwindcss').Config} */
module.exports = {
  // Esta linha é a mais importante para o tema funcionar
  darkMode: 'class',

  content: [
    // Isto garante que o Tailwind analisa todos os seus ficheiros
    './src/**/*.{html,js}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}