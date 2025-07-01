import type { TableOfContentsItem } from '@/stoplight/elements-core'
import type { SchemaNode } from '@/stoplight/elements'
import { SpecVersion } from '@/stoplight/elements'
import type { ServiceNode, AsyncMessageNode } from '@/types'
import type { AsyncAPIDocumentInterface, MessageInterface, OperationInterface, SchemaInterface } from '@asyncapi/parser'
import type { SchemaObject, AsyncMessageObject, AsyncOperationNode } from '@/types'
import { PayloadType } from '@/types'
import { NodeType } from '@/types'
import type { IHttpService, HttpSecurityScheme } from '@stoplight/types'

/**
 * return label for opetation type
 *
 * @param param0
 * @returns
 */
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

/**
 *  transform async message
 * @param message
 * @returns
 */
export const transformMessage = (message: MessageInterface): AsyncMessageNode => {

  return <AsyncMessageNode>{
    type: NodeType.AsyncMessage,
    uri: `/message-${message.id()}`,
    name: message.id() || '',
    data: <AsyncMessageObject>{
      description: message.description(),
      summary: message.summary(),
      correlationId: message.correlationId()?.location(),
      title: message.title(),
      messageId: message.id(),
      ...(message.hasPayload() ? {
        payload: <SchemaObject>transformSchema(message.payload()),
      } : null),
    },
  }
}

/**
 *
 * @param operation Return operation type
 * @returns
 */
const getOperationType = (operation: OperationInterface) => {
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

/**
 *
 * @param schema transform properties
 * @returns
 */
export const transformSchema = (schema: SchemaInterface | undefined):Record<string, any> => {
  if (!schema) {
    return {}
  }

  const resProps = <Record<string, any>>{
    ...(schema.description() ? { description: schema.description() } : null),
    ...(schema.examples() ? { examples: schema.examples() } : null),
    ...(schema.format() ? { format: schema.format() } : null),
    ...(schema.pattern() ? { pattern: schema.pattern() } : null),
    ...(schema.title() ? { title: schema.title() } : null),
    ...(schema.required() ? { required: schema.required() } : null),
    ...(schema.type() ? { type: schema.type() } : null),
    ...((schema.additionalProperties !== undefined) ? { additionalProperties: schema.additionalProperties() } : null),
    ...(schema.enum() ? { enum: schema.enum() } : null),
    ...(schema.isCircular() ? { isCircular: schema.isCircular() } : null),
    ...(schema.const() ? { const: schema.const() } : null),
    ...((schema.default() !== undefined) ? { default: schema.default() } : null),
  }

  // parsing props
  const props = schema.properties()
  if (props) {
    resProps.properties = {}
    Object.keys(props).forEach(propKey => {
      resProps.properties[propKey] = transformSchema(props[propKey])
    })
  }

  // parsing items
  const items = schema.items()
  if (items) {
    if (Array.isArray(items)) {
      resProps.items = []
      for (let i = 0; i < items.length; i++) {
        resProps.push(transformSchema(items[i]))
      }
    } else {
      resProps.items = transformSchema(items)
    }
  }

  // parsing allOf
  const allOf = schema.allOf()
  if (allOf) {
    resProps.allOf = []
    for (let i = 0; i < allOf.length; i++) {
      resProps.allOf.push(transformSchema(allOf[i]))
    }
  }

  // parsing anyOf
  const anyOf = schema.anyOf()
  if (anyOf) {
    resProps.anyOf = []
    for (let i = 0; i < anyOf.length; i++) {
      resProps.anyOf.push(transformSchema(anyOf[i]))
    }
  }
  // parsing oneOf
  const oneOf = schema.oneOf()
  if (oneOf) {
    resProps.oneOf = []
    for (let i = 0; i < oneOf.length; i++) {
      resProps.oneOf.push(transformSchema(oneOf[i]))
    }
  }

  return resProps
}

/**
 * Transofrm async document into stoplight AST
 * @param document
 * @param transformOptions
 * @returns
 */
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
    tags: [],
    children: [],
    data: <IHttpService>{
      id: 'undefined',
      version: info.version(),
      name: info.title(),
      description: info.description(),
      ...(info.hasExternalDocs() ? {
        externalDocs: {
          url: info.externalDocs()?.url(),
          description: info.externalDocs()?.description() || 'External Docs',
        },
      } : null),
      ...(info.hasContact() ? {
        contact: {
          name: info.contact()?.name(),
          email: info.contact()?.email(),
          url: info.contact()?.url(),
        },
      } : null),
      ...(info.hasLicense() ? {
        license: {
          name: info.license()?.name(),
          url: info.license()?.url(),
        },
      } : null),
    },
  }

  //TODO: see if we need to support group by tag
  // showServers ?: 'byDefault' | 'bySpecTags' | 'byServersTags';
  // showOperations ?: 'byDefault' | 'bySpecTags' | 'byOperationsTags';

  //  const tags = info.tags().all()

  if (info) {
    resTOC.push(
      { id: '/', slug: '/', title: 'Overview', type: 'overview', meta: '' })
  }
  const securitySchemes: HttpSecurityScheme[] = []

  const securitySchemesAsync = document.securitySchemes()
  if (securitySchemesAsync && securitySchemesAsync.length) {
    securitySchemesAsync.forEach(securityScheme => {
      securitySchemes.push({
        id: securityScheme.id(),
        key: securityScheme.id(),
        //@ts-ignore converting string to enum
        in: securityScheme.in(),
        name: securityScheme.name() || securityScheme.id(),
        //@ts-ignore converting string to enum
        type: securityScheme.type(),
        description: securityScheme.description() || securityScheme.openIdConnectUrl(),
      })
    })
    resDOC.data.securitySchemes = securitySchemes
  }

  const servers = document.allServers()
  if (servers && servers.length) {
    resDOC.data.servers = []
    const serversGroup = {
      title: 'Servers', items: <TableOfContentsItem[]>[], hideTitle: false, initiallyExpanded: true,
    }
    servers.forEach((server) => {
      if (!serversGroup.initiallyExpanded && `/server-${server.id()}` === transformOptions.currentPath) {
        serversGroup.initiallyExpanded = true
      }
      resDOC.data.servers?.push({ id: server.id(), url: server.url(), name: server.id(), description: server.description() })
      serversGroup.items.push({
        id: `/operation-${server.id()}`,
        slug: `/operation-${server.id()}`,
        title: server.id() || '',
        type: 'http_operation',
        meta: '',
      })
    })
    // we do not need servers in TOC, we show servers in Overview
    //resTOC.push(serversGroup)
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

      resDOC.children.push(<AsyncOperationNode>{
        type: 'async_operation',
        uri: `/operation-${operation.id()}`,
        name: operation.id() || '',
        data: {
          operation,
          method: getOperationTypeLabel({ type: getOperationType(operation), isAsyncAPIv2 }),
        },
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
        type: NodeType.Model,
        meta: '',
      })
      resDOC.children.push(transformMessage(message))
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
        type: NodeType.Model,
        meta: '',
      })
      resDOC.children.push(<SchemaNode>{
        type: NodeType.Model,
        uri: `/schema-${schema.id()}`,
        name: schema.id() || '',
        data: <SchemaObject>transformSchema(schema),
      })

    })
    resTOC.push(schemasGroup)
  }
  return { toc: resTOC, document: resDOC }
}

