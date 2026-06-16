import eslintKongUiConfig from '@kong/eslint-config-kong-ui'
import designTokens from '@kong/eslint-plugin-design-tokens'

export default [
  ...eslintKongUiConfig,
  {
    files: ['**/*.vue'],
    plugins: {
      '@kong/eslint-plugin-design-tokens': designTokens,
    },
    rules: {
      '@kong/eslint-plugin-design-tokens/token-constant-requires-css-var': 'error',
    },
  },
]
