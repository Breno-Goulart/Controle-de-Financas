// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        cadastro: resolve(__dirname, 'cadastro.html'),
        configuracoes: resolve(__dirname, 'configuracoes.html'),
        familia: resolve(__dirname, 'familia.html'),
        historico: resolve(__dirname, 'historico.html'),
        lancamentos: resolve(__dirname, 'lancamentos.html'),
        login: resolve(__dirname, 'login.html'),
        relatorio: resolve(__dirname, 'relatorio.html'),
      },
    },
  },
});