const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  {
    ignores: ['node_modules/**']
  },
  js.configs.recommended,
  {
    // Backend (Node.js, CommonJS)
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: globals.node
    },
    rules: {
      // Express error handlers must declare 4 params, even if `next` is unused
      'no-unused-vars': ['error', { argsIgnorePattern: '^next$' }]
    }
  },
  {
    // Frontend scripts loaded via <script> tags in html/; their top-level
    // declarations are globals used by the pages
    files: ['js/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: globals.browser
    },
    rules: {
      'no-unused-vars': ['error', { vars: 'local' }]
    }
  }
]
