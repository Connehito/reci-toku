module.exports = {
  extends: ['./base.js'],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    // Nest.js固有のルール
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error',

    // デコレータ使用時の警告を無効化
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        // デコレータで使用されるパラメータを無視
        ignoreRestSiblings: true,
      },
    ],
  },
};
