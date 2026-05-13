import {defineConfig} from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'warn',
    style: 'error',
  },
  ignorePatterns: ['node_modules/**', '**/node_modules/**'],
  overrides: [
    {
      files: ['src/**/*.ts', 'src/**/*.tsx'],
      rules: {
        'func-style': 'off',
        'id-length': 'off',
        'init-declarations': 'off',
        'max-statements': 'off',
        'no-magic-numbers': 'off',
        'no-ternary': 'off',
        'parameter-properties': 'off',
        'prefer-ternary': 'off',
        'sort-imports': 'off',
        // PascalCase filenames are conventional for class files
        'unicorn/filename-case': 'off',
        // consecutive-comma destructuring is required when prefer-destructuring is on
        'unicorn/no-unreadable-array-destructuring': 'off',
      },
    },
  ],
  rules: {
    'unicorn/empty-brace-spaces': 'error',
  },
});
