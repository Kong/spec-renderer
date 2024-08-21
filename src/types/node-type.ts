import type { IHttpService } from '@stoplight/types'
import { NodeType as OasNodeType } from '@stoplight/types'
import type { Node, OperationNode, WebhookNode, SchemaNode, SpecVersion } from '@/stoplight/elements/utils/oas/types'
import type { JSONSchema7 } from 'json-schema'


export const NodeType = {
  ...OasNodeType,
  AsyncMessage: 'async_message',
  AsyncOperation: 'async_operations',
} as const


export type AsyncMessageNode = Node<typeof NodeType.AsyncMessage, JSONSchema7>
export type ServiceChildNode = OperationNode | WebhookNode | SchemaNode | AsyncMessageNode
export type ServiceNode = Node<typeof NodeType.HttpService, IHttpService> & { children: ServiceChildNode[] } & { specVersion: SpecVersion }

