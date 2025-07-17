// vite.config.js - VERSÃO FINAL PARA ESTRUTURA ORGANIZADA
const { resolve } = require('path');

module.exports = {
  // Define a 'src' como a pasta raiz do nosso código
  root: 'src',

  build: {
    // Define o diretório de saída para uma pasta 'dist' na raiz do projeto
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        cadastro: resolve(__dirname, 'src/cadastro.html'),
        configuracoes: resolve(__dirname, 'src/configuracoes.html'),
        familia: resolve(__dirname, 'src/familia.html'),
        historico: resolve(__dirname, 'src/historico.html'),
        lancamentos: resolve(__dirname, 'src/lancamentos.html'),
        login: resolve(__dirname, 'src/login.html'),
        relatorio: resolve(__dirname, 'src/relatorio.html'),
      },
    },
  },
};