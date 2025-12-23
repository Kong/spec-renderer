export interface ExtraTokenRequestParameter {
  name: string
  label?: string
  description?: string
  value?: string
  omitIfEmpty?: boolean
  required?: boolean
  readOnly?: boolean
  hidden?: boolean
}

export interface XKongClientCredentialsConfig {
  extraTokenRequestParameters?: ExtraTokenRequestParameter[]
}
