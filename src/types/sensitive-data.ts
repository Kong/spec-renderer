export type SensitiveDataMaskType = 'full' | 'regex' | 'hash' | 'remove'

export interface XSensitiveData {
  mask: SensitiveDataMaskType
  /** Regex pattern string — only used when mask is 'regex' */
  pattern?: string
  /** Hash algorithm name — only used when mask is 'hash' (e.g. 'sha256') */
  algorithm?: string
}

export interface SecuritySchemeMaskRule {
  location: 'header' | 'query' | 'cookie'
  /** Header/query/cookie parameter name to match against, case-insensitive */
  paramName: string
  /** Replacement placeholder shown in code samples and displayed output */
  placeholder: string
}
