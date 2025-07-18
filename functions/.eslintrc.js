module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2018,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    // Desabilitar a regra de quebra de linha para evitar conflitos entre sistemas operacionais
    "linebreak-style": "off", // <--- DESABILITADO DEFINITIVAMENTE

    // Desabilitar a regra de nova linha no final do arquivo
    "eol-last": "off", // <--- DESABILITADO

    // Outras regras de formatação do Google Style Guide (ajustadas para serem menos problemáticas)
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    "max-len": ["error", { "code": 120, "ignoreComments": true, "ignoreUrls": true, "ignoreStrings": true, "ignoreTemplateLiterals": true }],
    "indent": ["error", 2, { "SwitchCase": 1 }], // Padrão Google é 2 espaços
    "object-curly-spacing": ["error", "always"], // Exige espaço após '{' e antes de '}'
    "comma-dangle": ["error", "always-multiline"], // Permite vírgulas penduradas em múltiplas linhas
    "arrow-parens": ["error", "always"], // Exige parênteses em volta de argumentos de funções de seta
    "padded-blocks": ["error", "never"], // Não permite linhas em branco no início/fim de blocos
    "no-trailing-spaces": "error", // Não permite espaços no final da linha
    "operator-linebreak": ["error", "after"] // Operadores como '?' e ':' devem estar no final da linha anterior
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
