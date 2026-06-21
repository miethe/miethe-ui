/**
 * ESLint flat config for @miethe/ui — standalone, no Next.js-specific rules.
 *
 * Stack mirrors what the web app uses (eslint v9 + @typescript-eslint v8 +
 * eslint-plugin-react v7 + eslint-plugin-react-hooks v5), but without the
 * next-specific plugins or app-specific import restrictions.
 */

import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksBase from 'eslint-plugin-react-hooks';
import globals from 'globals';

// ---------------------------------------------------------------------------
// Patch react-hooks plugin to absorb invalid em-dash eslint-disable annotations.
//
// Source files contain: // eslint-disable-line react-hooks/exhaustive-deps — intentional mount-once
//
// ESLint v9 parses "react-hooks/exhaustive-deps — intentional mount-once" as a
// plugin-qualified rule name: plugin="react-hooks", rule="exhaustive-deps — intentional mount-once".
// The plugin does not define that rule, causing an error.
// Adding a no-op rule with that name silences the error without changing behaviour.
// ---------------------------------------------------------------------------
const reactHooks = {
  ...reactHooksBase,
  rules: {
    ...reactHooksBase.rules,
    'exhaustive-deps — intentional mount-once': {
      create: () => ({}),
      meta: { type: 'suggestion', schema: [] },
    },
  },
};

export default [
  // Ignore build output and node_modules
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '**/*.d.ts'],
  },

  // Base JS recommended
  js.configs.recommended,

  // Global linter config
  {
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },

  // TypeScript source files
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      // Provide browser + node globals so no-undef doesn't flag window/console/performance
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // TypeScript baseline (ts-eslint handles undef via type checking)
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      // Disable base no-undef — TypeScript's type checker handles this more accurately
      'no-undef': 'off',
      // Dynamic require() is used intentionally in lowlight lazy-loader; downgrade to warn
      '@typescript-eslint/no-require-imports': 'warn',
      // Empty interface pattern used in primitive components; downgrade to warn
      '@typescript-eslint/no-empty-object-type': 'warn',

      // React baseline
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Not needed with automatic JSX runtime
      'react/prop-types': 'off', // TypeScript covers this
      'react/no-unescaped-entities': 'off',
      // children-as-prop: downgrade; some patterns pass children to createElement
      'react/no-children-prop': 'warn',

      // Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // No-op rule absorbing em-dash annotations (see patchReactHooks above)
      'react-hooks/exhaustive-deps — intentional mount-once': 'off',
    },
  },

  // Test files — relax some rules and add jest globals
  {
    files: [
      'src/**/__tests__/**/*.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-undef': 'off',
    },
  },
];
