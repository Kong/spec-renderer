import type { HttpSecurityScheme } from '@stoplight/types'

export interface SecuritySchemeGroup {
  title: string
  key: string
  schemeList: HttpSecurityScheme[]
}
