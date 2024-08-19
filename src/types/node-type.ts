import { NodeType as OasNodeType } from '@stoplight/types'

export const NodeType = {
  ...OasNodeType,
  AsyncMessage: 'async_message',
  AsyncOperation: 'async_operations',
} as const

