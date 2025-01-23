export default {
  extends: [
    'stylelint-config-html',
    'stylelint-config-recommended-scss',
    'stylelint-config-recommended-vue/scss',
  ],
  plugins: [
    'stylelint-order',
    '@kong/design-tokens/stylelint-plugin',
    '@stylistic/stylelint-plugin',
  ],
  rules: {
    'order/properties-alphabetical-order': true,
    'unit-disallowed-list': [
      ['rem', 'em'],
    ],
    '@stylistic/indentation': [
      2,
      {
        baseIndentLevel: 0,
      },
    ],
    // Only allow @kong/design-tokens CSS custom properties
    'custom-property-pattern': [
      '^(kui-).+$',
      {
        message: "Expected custom property \"%s\" to be sourced from @kong/design-tokens with prefix '--kui-'",
      },
    ],
    '@kong/design-tokens/use-proper-token': true,
    'rule-empty-line-before': ['always', { ignore: ['after-comment', 'first-nested'] }],
    '@stylistic/block-opening-brace-space-before': 'always',
    '@stylistic/declaration-colon-space-after': 'always',
    '@stylistic/media-feature-colon-space-after': 'always',
    // Disable the following rules
    'custom-property-no-missing-var-function': null,
    'no-descending-specificity': null,
  },
}
