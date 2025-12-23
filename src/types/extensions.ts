export interface ExtraTokenRequestParameter {
  name: string
  label?: string
  description?: string
  defaultValue?: string
  omitIfEmpty?: boolean
  required?: boolean
  readonly?: boolean
  hidden?: boolean
}

export interface XKongClientCredentialsConfig {
  extraTokenRequestParameters?: ExtraTokenRequestParameter[]
}
