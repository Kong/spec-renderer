import eslintKongUiConfig from '@kong/eslint-config-kong-ui'
import designTokens from '@kong/design-tokens/eslint-plugin'

export default [
  ...eslintKongUiConfig,
  {
    files: ['**/*.vue'],
    plugins: {
      '@kong/design-tokens': designTokens,
    },
    rules: {
      '@kong/design-tokens/token-constant-requires-css-var': 'error',
    },
  },
]
