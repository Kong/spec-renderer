import type { ServiceNode } from '../../stoplight/elements/utils/oas/types'
import { NodeType } from '@stoplight/types'

import HttpService from './HttpService.vue'
import HttpOperation from './HttpOperation.vue'
import ModelNode from './ModelNode.vue'
import ArticleNode from './ArticleNode.vue'
import UnknownNode from './UnknownNode.vue'

export const docComponent = (node: ServiceNode) => {
  switch (node.type as NodeType) {
    case NodeType.Article:
      return ArticleNode
    case NodeType.HttpOperation:
    case NodeType.HttpWebhook:
      return HttpOperation
    case NodeType.HttpService:
      return HttpService
    case NodeType.Model:
      return ModelNode
    default:
      return UnknownNode
  }
}
