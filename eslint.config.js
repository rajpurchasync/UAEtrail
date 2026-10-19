import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import uaetrail from './eslint/uaetrail-plugin.mjs';
import { r8HooksNonFacadeFiles, r8UiLayerFiles } from './eslint/r8-api-facade.mjs';

export default tseslint.config(
  { ignores: ['dist', 'public/sw.js'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // React Hooks v7 `recommended` adds compiler-style rules; keep classic hooks lint until migrated.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      // HMR-only; co-located non-component exports are intentional
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/api/**', 'src/messaging/clientGuard.test.ts', 'src/components/messages/index.ts'],
    plugins: { uaetrail },
    rules: {
      'uaetrail/no-retired-messaging-api': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/api/services', '**/api/services.ts'],
              message: 'Import from the canonical API surface: same-depth `../api/index` or `../api` (see src/api/index.ts).',
            },
          ],
        },
      ],
    },
  },
  {
    files: r8UiLayerFiles,
    plugins: { uaetrail },
    rules: {
      'uaetrail/no-direct-api-facade-ui': 'error',
    },
  },
  {
    files: r8HooksNonFacadeFiles,
    ignores: ['**/*Api.ts', '**/*ClientApi.ts', '**/*.test.ts'],
    plugins: { uaetrail },
    rules: {
      'uaetrail/no-direct-api-facade-hooks': 'error',
    },
  },
  {
    files: ['src/explore/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '../../utils/exploreRouting',
              message: 'Import from ../routing (or src/explore/routing) — exploreRouting is a deprecated shim.',
            },
            {
              name: '../utils/exploreRouting',
              message: 'Import from ../explore/routing — exploreRouting is a deprecated shim.',
            },
          ],
          patterns: [
            {
              group: ['**/api/services', '**/api/services.ts'],
              message: 'Import from the canonical API surface: `../../api/index` (see src/api/index.ts).',
            },
          ],
        },
      ],
    },
  }
);
