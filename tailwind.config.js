// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <--- Adicionado para habilitar o modo escuro baseado em classes
  content: [
    "./src/**/*.{html,js}", // Procura em todos os ficheiros .html e .js dentro de src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
