/* eslint-disable import/no-commonjs */
module.exports = {
  root: true,
  env: { es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: false,
  },
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: { alwaysTryTypes: true, project: '.' },
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-native', 'import', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended', // adds prettier plugin + sets "prettier/prettier": "error"
  ],
  rules: {
    // RN/React quality
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',

    // Tone down noisy RN rules for this project
    'react-native/no-color-literals': 'off',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-unused-styles': 'warn',

    // TS tweaks
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

    // Imports & order
    'import/order': [
      'warn',
      {
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
          'object',
          'type',
        ],
      },
    ],

    // Prettier
    'prettier/prettier': ['error', { endOfLine: 'auto' }],

    // Misc
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        'no-undef': 'off',
      },
    },
  ],
};
