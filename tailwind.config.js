/** @type {import('tailwindcss').Config} */
module.exports = {
  // Esta é a linha mais importante que faltava.
  // Ela diz ao Tailwind: "Ative as classes 'dark:' quando a classe 'dark' for adicionada ao HTML".
  darkMode: 'class',

  content: [
    // Isto garante que o Tailwind procura por classes em todos os seus ficheiros.
    './src/**/*.{html,js}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}