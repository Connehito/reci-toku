module.exports = {
  extends: ['./base.js'],
  env: {
    browser: true,
    es2022: true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // TypeScriptルール（base.jsから継承）
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
