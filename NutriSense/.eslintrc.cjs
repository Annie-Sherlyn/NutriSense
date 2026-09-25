module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/mocks/*', '../mocks/*', './mocks/*'],
            message: 'Components and pages must never import mock data directly. Only services/ may import from mocks/.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      // Allow services to import from mocks
      files: ['src/services/**/*', 'src/mocks/**/*'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
};
