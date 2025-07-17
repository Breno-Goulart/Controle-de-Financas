// vite.config.js - VERSÃO CORRIGIDA E FINAL
const { resolve } = require('path');

module.exports = {
  build: {
    rollupOptions: {
      // Adicione esta seção para tratar o 'crypto' como externo
      external: [
        'crypto',
      ],
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