// vite.config.js - VERSÃO ORGANIZADA
const { resolve } = require('path');

module.exports = {
  // Adicione esta linha para dizer ao Vite onde está o nosso código-fonte
  root: 'src',

  build: {
    // E esta linha para que o resultado final vá para a pasta 'dist' principal
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