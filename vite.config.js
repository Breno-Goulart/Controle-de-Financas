// vite.config.js - Versão final e corrigida
import { defineConfig } from 'vite'

export default defineConfig({
  // 1. Define a pasta 'src' como a raiz do seu site
  root: 'src',
  
  // 2. Configura o processo de construção (build)
  build: {
    // 3. Define a pasta de saída para '../dist', que cria uma pasta 'dist' na raiz do projeto
    outDir: '../dist',
    // 4. Garante que a pasta de saída seja limpa antes de cada nova construção
    emptyOutDir: true,
  }
})