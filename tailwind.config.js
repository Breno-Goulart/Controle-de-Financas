/** @type {import('tailwindcss').Config} */
module.exports = {
  // Habilita o modo escuro baseado em classe
  darkMode: 'class',

  // Informa ao Tailwind quais arquivos devem ser analisados
  content: [
    "./src/**/*.{html,js}",
  ],

  // Configurações de tema (opcional, mas bom ter)
  theme: {
    extend: {
      fontFamily: {
        // Garante que a fonte 'Inter' esteja disponível
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  
  // Plugins (opcional)
  plugins: [],
}