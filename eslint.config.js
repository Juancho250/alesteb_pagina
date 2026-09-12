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
      // Legacy cleanup stays visible while CI is introduced progressively.
      // React correctness rules (rules-of-hooks/exhaustive-deps) remain enabled.
      'no-unused-vars': ['warn', {
        varsIgnorePattern: '^(?:[A-Z_]|motion$)',
        argsIgnorePattern: '^[A-Z_]',
      }],
      'no-empty': ['error', { allowEmptyCatch: true }],

      // These React 19/compiler-oriented rules expose useful modernization debt,
      // but they are not allowed to block the first repository CI baseline.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/use-memo': 'warn',
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
  {
    // Checkout currently exports BANK_INFO beside the page component. This is
    // tracked multi-tenant debt and will move to backend-owned payment config.
    files: ['src/pages/Checkoutpage.jsx'],
    rules: {
      'react-refresh/only-export-components': 'warn',
    },
  },
])
