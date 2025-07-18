// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        login: resolve(__dirname, 'src/login.html'),
        cadastro: resolve(__dirname, 'src/cadastro.html'),
        familia: resolve(__dirname, 'src/familia.html'),
        lancamentos: resolve(__dirname, 'src/lancamentos.html'),
        configuracoes: resolve(__dirname, 'src/configuracoes.html'),
        historico: resolve(__dirname, 'src/historico.html'),
        relatorio: resolve(__dirname, 'src/relatorio.html'),
      },
    },
  },
});