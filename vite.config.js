// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        // O nome à esquerda é o nome do arquivo final (ex: main.html -> index.html)
        // O valor à direita é o caminho para o arquivo-fonte
        main: 'src/index.html',
        login: 'src/login.html',
        cadastro: 'src/cadastro.html',
        familia: 'src/familia.html',
        lancamentos: 'src/lancamentos.html',
        configuracoes: 'src/configuracoes.html',
        historico: 'src/historico.html',
        relatorio: 'src/relatorio.html',
      },
    },
  },
});