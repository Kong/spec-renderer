import type { IHttpService } from '@stoplight/types'
import { NodeType as OasNodeType } from '@stoplight/types'
import type { Node, OperationNode, WebhookNode, SchemaNode, SpecVersion } from '@/stoplight/elements'
import type { JSONSchema7 } from 'json-schema'
import type { SchemaObject } from './spec-renderer'
import type { OperationInterface, MessageInterface } from '@asyncapi/parser'


export const NodeType = {
  ...OasNodeType,
  AsyncMessage: 'async_message',
  AsyncOperation: 'async_operation',
} as const

export interface AsyncMessageObject extends SchemaObject {
  payload?: SchemaObject
  summary?: string
  messageId?: string
  correlationId?: string
  message?: MessageInterface
}

export interface AsyncOperationObject extends SchemaObject {
  operation: OperationInterface
  summary?: string
  name?: string
  method?: string
}


export type AsyncMessageNode = Node<typeof NodeType.AsyncMessage, JSONSchema7>
export type AsyncOperationNode = Node<typeof NodeType.AsyncOperation, AsyncOperationObject>


export type ServiceChildNode = OperationNode | WebhookNode | SchemaNode | AsyncMessageNode | AsyncOperationNode
export type ServiceNode = Node<typeof NodeType.HttpService, IHttpService> & { children: ServiceChildNode[] } & { specVersion: SpecVersion }

