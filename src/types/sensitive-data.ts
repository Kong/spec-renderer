export type SensitiveDataMaskType = 'full' | 'regex' | 'hash' | 'remove'

export interface XSensitiveData {
  /** Masking strategy: 'full' replaces the entire value, 'regex' replaces matched portions, 'hash' fingerprints, 'remove' omits the key */
  mask: SensitiveDataMaskType
  /** Regex pattern string — only used when mask is 'regex' */
  pattern?: string
}

export interface SecuritySchemeMaskRule {
  /** Where the credential lives — determines which masking function handles this rule */
  location: 'header' | 'query' | 'cookie'
  /** Header/query/cookie parameter name to match against, case-insensitive */
  paramName: string
  /** Replacement placeholder shown in code samples and displayed output */
  placeholder: string
}
