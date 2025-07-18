// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Define a pasta 'src' como a raiz para desenvolvimento.
  // Isto resolve automaticamente a estrutura de pastas no build final.
  root: 'src',

  build: {
    // Coloca os arquivos finais numa pasta 'dist' na raiz do projeto.
    outDir: '../dist',
    // Limpa a pasta 'dist' antes de cada build.
    emptyOutDir: true,
  },
});