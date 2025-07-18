// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // Não definimos a propriedade 'root', para que a raiz do projeto seja o padrão.
  build: {
    // A pasta de saída será 'dist', criada na raiz do projeto.
    outDir: 'dist',
    rollupOptions: {
      // Mapeamos cada arquivo HTML usando caminhos relativos simples
      // a partir da pasta principal do projeto.
      input: {
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