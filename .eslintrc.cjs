module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  ignorePatterns: ['dist', 'coverage'],
  rules: {
    'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
  },
  overrides: [
    {
      files: ['src/contexts/AuthContext.tsx'],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
  ],
}
