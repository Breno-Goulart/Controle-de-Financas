// vite.config.js - CORRIGIDO
const { resolve } = require('path');

module.exports = {
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
};