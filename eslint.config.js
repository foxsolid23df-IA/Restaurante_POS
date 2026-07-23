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
      'no-undef': 'warn'
    }
  },
  {
    ignores: ['dist/**', 'out/**', 'node_modules/**', 'release/**', 'build/**']
  }
]
