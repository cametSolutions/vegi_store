import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import babelParser from '@babel/eslint-parser';
import { globalIgnores } from 'eslint/config';

export default [
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        babelOptions: {
          parserOpts: {
            plugins: ['jsx'],
          },
        },
      },
      globals: globals.browser,
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
    ...reactRefresh.configs.vite,
  },
];
