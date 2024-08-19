import type { NodeType as OasNodeType } from '@stoplight/types'

export enum AsyncNodeType {
  AsyncMessage = 'async_message',
  AsyncOperation = 'async_operations',
}


type AllNodeType = OasNodeType | AsyncNodeType
export let NodeType:AllNodeType
