import type { IHttpOperation, IHttpService, IHttpWebhookOperation, NodeType } from '@stoplight/types'
import type { JSONSchema7 } from 'json-schema'

export enum NodeTypes {
  Paths = 'paths',
  Path = 'path',
  Operation = 'operation',
  Webhooks = 'webhooks',
  Webhook = 'webhook',
  Components = 'components',
  Models = 'models',
  Model = 'model',
}

export interface ISourceNodeMap {
  type: string;
  match?: string;
  notMatch?: string;
  children?: ISourceNodeMap[];
}

type Node<T, D> = {
  type: T;
  uri: string;
  name: string;
  data: D;
  tags: string[];
}

export enum SpecVersion {
  OAS2 = 'OAS 2.0',
  OAS3 = 'OAS 3.0',
  OAS31 = 'OAS 3.1',
  ASYNC = 'ASYNC',
}

export type OperationNode = Node<NodeType.HttpOperation, IHttpOperation>
export type WebhookNode = Node<NodeType.HttpWebhook, IHttpWebhookOperation>
export type SchemaNode = Node<NodeType.Model, JSONSchema7>
export type ServiceChildNode = OperationNode | WebhookNode | SchemaNode
export type ServiceNode = Node<NodeType.HttpService, IHttpService> & { children: ServiceChildNode[] } & { specVersion: SpecVersion }
