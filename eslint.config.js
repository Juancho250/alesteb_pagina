import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Dynamic React components are commonly passed as callback arguments
      // (for example route.Component or icon renderers). Keep the existing
      // uppercase convention for both variables and arguments.
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^(?:[A-Z_]|motion$)',
        argsIgnorePattern: '^[A-Z_]',
      }],
    },
  },
  {
    // Context modules intentionally export both a Provider and its consumer hook.
    // That module boundary is stable and should not be split only to satisfy HMR.
    files: [
      'src/context/**/*.{js,jsx}',
      'src/platform/runtime/**/*Context.{js,jsx}',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
