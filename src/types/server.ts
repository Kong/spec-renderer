import type { IServer as IServerInternal } from '@stoplight/types'

export interface IServer extends IServerInternal {
  // this is to keep url as it was defined in the spec
  origUrl?: string
  // url property will hold formatted URL with parameters applied
}
