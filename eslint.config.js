import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  },
  {
    ignores: ['dist/**', 'out/**', 'node_modules/**', 'release/**', 'build/**']
  },
  {
    files: ['src/**/*.test.js', 'src/__tests__/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        vitest: 'readonly'
      }
    }
  }
]
