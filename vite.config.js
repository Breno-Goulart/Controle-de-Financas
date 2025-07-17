// vite.config.js - VERSÃO FINAL E CORRIGIDA
const { resolve } = require('path');

module.exports = {
  // Removemos a propriedade 'root' para evitar confusão no build.
  // Todos os caminhos agora são lidos a partir da pasta principal.
  build: {
    // A pasta de saída será 'dist', criada na raiz do projeto.
    outDir: 'dist',
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