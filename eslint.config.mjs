// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // ── Archivos ignorados ──────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'prisma/generated/**',
      'generated/**',
      'eslint.config.mjs',
    ],
  },

  // ── Reglas base ─────────────────────────────────────────────────────────
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // ── Parser / entorno ────────────────────────────────────────────────────
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ── Reglas del proyecto ─────────────────────────────────────────────────
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': 'warn',
    },
  },

  // ── Tests ───────────────────────────────────────────────────────────────
  {
    // Jest matchers (expect.any, objectContaining, mockResolvedValue, ...)
    // are typed loosely on purpose, which trips the unsafe-* rules on every
    // assertion — relax them for test files only.
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  // ── Scripts de Prisma (seed) ────────────────────────────────────────────
  {
    files: ['prisma/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // Prettier siempre al final: desactiva las reglas de estilo que chocan
  // con el formateador y reporta diferencias de formato como errores. La
  // configuración de formato vive solo en .prettierrc.
  eslintPluginPrettierRecommended,
);
