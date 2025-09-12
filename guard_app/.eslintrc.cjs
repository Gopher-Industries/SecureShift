/* eslint-disable import/no-commonjs */
module.exports = {
  root: true,
  env: { es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    // don't set "project" to avoid perf/compat issues
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
    'plugin:react-native/all',            // keep full RN rules...
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  rules: {
    // React/RN
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-native/no-color-literals': 'off',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-unused-styles': 'warn',
    'react-native/no-raw-text': 'off',
    'react-native/sort-styles': 'off',    // <-- turn OFF the style/class sorting errors

    // TS
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

    // Import order (keep as warning so CI doesn’t fail)
    'import/order': [
      'warn',
      {
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'object', 'type'],
      },
    ],

    // Prettier + misc
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: { 'no-undef': 'off' },
    },
  ],
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'babel.config.js', 'metro.config.js'],
};
