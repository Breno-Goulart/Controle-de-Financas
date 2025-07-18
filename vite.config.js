// vite.config.js

import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  // 1. Define a raiz do seu código-fonte
  root: 'src',

  build: {
    // 2. Define o diretório de saída para a raiz do projeto
    outDir: '../dist',
    rollupOptions: {
      // 3. Os caminhos agora são relativos à 'root' que definimos acima
      input: {
        main: resolve(__dirname, 'src/index.html'),
        login: resolve(__dirname, 'src/login.html'),
        cadastro: resolve(__dirname, 'src/cadastro.html'),
        familia: resolve(__dirname, 'src/familia.html'),
        lancamentos: resolve(__dirname, 'src/lancamentos.html'),
        historico: resolve(__dirname, 'src/historico.html'),
        relatorio: resolve(__dirname, 'src/relatorio.html'),
        configuracoes: resolve(__dirname, 'src/configuracoes.html'),
      },
    },
  },
})