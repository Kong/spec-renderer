import type { TableOfContentsItem } from '../stoplight/elements-core/components/Docs/types'
import type { ServiceNode } from '../stoplight/elements/utils/oas/types'
import { SpecVersion } from '../stoplight/elements/utils/oas/types'
import type { AsyncAPIDocumentInterface, OperationInterface } from '@asyncapi/parser'
import { PayloadType } from '@/types'
import { NodeType } from '@stoplight/types'

const getOperationTypeLabel = ({
  type,
  isAsyncAPIv2,
}: {
  type: PayloadType
  isAsyncAPIv2: boolean
}):string => {
  if (type === PayloadType.RECEIVE) {
    return !isAsyncAPIv2
      ? 'RECEIVE'
      : 'PUB'
  }
  if (type === PayloadType.REPLY) {
    return 'REPLY'
  }
  if (type === PayloadType.REQUEST) {
    return 'REQUEST'
  }
  return !isAsyncAPIv2
    ? 'SEND'
    : 'SUB'
}

const getOperationType = (operation: OperationInterface) =>{
  if (operation.isSend()) {
    if (operation.reply() !== undefined) {
      return PayloadType.REQUEST
    } else {
      return PayloadType.SEND
    }
  }
  if (operation.isReceive() && operation.reply() !== undefined) {
    return PayloadType.REPLY
  }
  return PayloadType.RECEIVE
}


export const transform = (document: AsyncAPIDocumentInterface, transformOptions: Record<string, any>): {
  document: ServiceNode
  toc: TableOfContentsItem[]
} => {

  const info = document.info()
  const specV = document.version()
  const version = specV.localeCompare('2.6.0', undefined, { numeric: true })
  const isAsyncAPIv2 = version === 0

  const resTOC: TableOfContentsItem[] = []
  const resDOC: ServiceNode = {
    type: NodeType.HttpService,
    name: info.title(),
    // @ts-ignore version of async is not yet in SpecVersion enum
    specVersion: SpecVersion.ASYNC + ' ' + specV,
    uri: '/',
    tags:[],
    children: [],
    data: {
      id: 'undefined',
      version: info.version(),
      name: info.title(),
      description: info.description(),
    },
  }



  //TODO: see if we need to support group by tag
  // showServers ?: 'byDefault' | 'bySpecTags' | 'byServersTags';
  // showOperations ?: 'byDefault' | 'bySpecTags' | 'byOperationsTags';

  //  const tags = info.tags().all()

  if (info) {
    resTOC.push(
      { id: '/', slug: '/', title: 'Introduction', type: 'overview', meta: '' })
  }


  const servers = document.allServers()
  if (servers && servers.length) {
    const serversGroup = {
      title: 'Servers', items: <TableOfContentsItem[]>[], hideTitle: false, initiallyExpanded: true,
    }
    servers.forEach((server) => {
      if (!serversGroup.initiallyExpanded && `/server-${server.id()}` === transformOptions.currentPath) {
        serversGroup.initiallyExpanded = true
      }
      serversGroup.items.push({
        id: `/operation-${server.id()}`,
        slug: `/operation-${server.id()}`,
        title: server.id() || '',
        type: 'http_operation',
        meta: '',
      })
    })
    resTOC.push(serversGroup)
  }

  const operations = document.allOperations()
  if (operations && operations.length) {
    const operationsGroup = {
      title: 'Operations', items: <TableOfContentsItem[]>[], hideTitle: false, initiallyExpanded: true,
    }
    operations.forEach((operation) => {
      if (!operationsGroup.initiallyExpanded && `/operation-${operation.id()}` === transformOptions.currentPath) {
        operationsGroup.initiallyExpanded = true
      }
      operationsGroup.items.push({
        id: `/operation-${operation.id()}`,
        slug: `/operation-${operation.id()}`,
        title: operation.id() || '',
        type: 'http_operation',
        meta: getOperationTypeLabel({ type: getOperationType(operation), isAsyncAPIv2 }),
      })
    })
    resTOC.push(operationsGroup)
  }

  const messages = document.allMessages()
  if (messages && messages.length) {
    const messagesGroup = {
      title: 'Messages', items: <TableOfContentsItem[]>[], hideTitle: false, initiallyExpanded: true,
    }
    messages.forEach((message) => {
      if (!messagesGroup.initiallyExpanded && `/message-${message.id()}` === transformOptions.currentPath) {
        messagesGroup.initiallyExpanded = true
      }
      messagesGroup.items.push({
        id: `/message-${message.id()}`,
        slug: `/message-${message.id()}`,
        title: message.id() || '',
        type: 'model',
        meta: '',
      })
    })
    resTOC.push(messagesGroup)
  }

  const schemas = document.components().schemas().all()
  if (schemas && schemas.length && !transformOptions.hideSchemas) {
    const schemasGroup = {
      title: 'Schemas', items: <TableOfContentsItem[]>[], hideTitle: false, initiallyExpanded: false,
    }
    schemas.forEach((schema) => {
      if (!schemasGroup.initiallyExpanded && `/schema-${schema.id()}` === transformOptions.currentPath) {
        schemasGroup.initiallyExpanded = true
      }
      schemasGroup.items.push({
        id: `/schema-${schema.id()}`,
        slug: `/schema-${schema.id()}`,
        title: schema.id() || '',
        type: 'model',
        meta: '',
      })
    })
    resTOC.push(schemasGroup)
  }
  return { toc: resTOC, document: resDOC }
}
