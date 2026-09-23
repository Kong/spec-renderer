import type { HttpSecurityScheme } from '@stoplight/types'

export interface SecuritySchemeGroup {
  title: string
  key: string
  schemeList: HttpSecurityScheme[]
}

/** Result of the pre-request auth step run before a Try-It call goes out. */
export interface PreRequestAuthResult {
  ok: boolean
  response?: Response
  error?: Error
}

/**
 * A flow component's pre-request hook. `undefined` means "nothing to do".
 * A bare `Response` is the legacy clientCredentials shape and is treated as ok when `response.ok`.
 */
export type PreRequestAuthHandler = () =>
  | Promise<Response | PreRequestAuthResult | undefined>
  | Response
  | PreRequestAuthResult
  | undefined
