import type { HttpSecurityScheme } from '@stoplight/types'

export interface SecuritySchemeGroup {
  title: string
  key: string
  schemeList: HttpSecurityScheme[]
}

/** Result of the pre-request auth step run before a Try-It call goes out. */
export type PreRequestAuthResult =
  | { ok: true }
  | {
    ok: false
    /** the token endpoint's response, set when it failed */
    response?: Response
    error?: Error
  }

/** A flow panel's pre-request hook, run before a Try-It call goes out. */
export type PreRequestAuthHandler = () => Promise<PreRequestAuthResult>
