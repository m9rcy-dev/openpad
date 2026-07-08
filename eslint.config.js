import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

/**
 * ESLint flat configuration.
 *
 * Layers, in order: JS recommended rules, type-aware TypeScript rules,
 * React hooks correctness rules, React Fast Refresh constraints, and
 * finally eslint-config-prettier to disable stylistic rules that would
 * conflict with Prettier (formatting is Prettier's job, not ESLint's).
 */
export default tseslint.config(
  { ignores: ['dist', 'coverage', 'docs'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // The codebase bans `any` outright (see docs/CONTRIBUTING.md).
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  prettier,
)
