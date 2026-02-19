module.exports = {
  extends: ['./base.js', 'next/core-web-vitals'],
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  rules: {
    // Next.js固有のルール
    '@next/next/no-html-link-for-pages': 'off',

    // React固有のルール
    'react/react-in-jsx-scope': 'off', // Next.js 13以降は不要
    'react/prop-types': 'off', // TypeScriptを使用するため

    // TypeScriptルール（base.jsから継承）
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
