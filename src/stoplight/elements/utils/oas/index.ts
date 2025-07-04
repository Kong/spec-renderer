// @ts-nocheck external file
import { encodePointerFragment, pointerToPath } from '@stoplight/json'
import type { IHttpOperation, IHttpWebhookOperation } from '@stoplight/types'
import { NodeType } from '@stoplight/types'
import { get, isObject, last } from 'lodash-es'
import type { OpenAPIObject as _OpenAPIObject, PathObject } from 'openapi3-ts'
import type { Spec } from 'swagger-schema-official'

import type {
  Oas2HttpOperationTransformer,
  Oas2HttpServiceTransformer,
  Oas3HttpEndpointOperationTransformer,
  Oas3HttpServiceTransformer,
} from '@stoplight/http-spec/oas'
import { OPERATION_CONFIG, WEBHOOK_CONFIG } from '@stoplight/http-spec/oas'
import { transformOas2Operation, transformOas2Service } from '@stoplight/http-spec/oas2'
import { transformOas3Operation, transformOas3Service } from '@stoplight/http-spec/oas3'
import { slugify } from '../../../elements-core/utils/string'
import { oas2SourceMap } from './oas2'
import { oas3SourceMap } from './oas3'
import type { ISourceNodeMap, ServiceChildNode, ServiceNode } from './types'
import { NodeTypes, SpecVersion } from './types'

type OpenAPIObject = _OpenAPIObject & {
  webhooks?: PathObject
}

const isOas2 = (parsed: unknown): parsed is Spec =>
  isObject(parsed) &&
  'swagger' in parsed &&
  Number.parseInt(String((parsed as Partial<{ swagger: unknown }>).swagger)) === 2

const isOas3 = (parsed: unknown): parsed is OpenAPIObject =>
  isObject(parsed) &&
  'openapi' in parsed &&
  Number.parseFloat(String((parsed as Partial<{ openapi: unknown }>).openapi)) >= 3

const isOas31 = (parsed: unknown): parsed is OpenAPIObject =>
  isObject(parsed) &&
  'openapi' in parsed &&
  Number.parseFloat(String((parsed as Partial<{ openapi: unknown }>).openapi)) === 3.1

const OAS_MODEL_REGEXP = /((definitions|components)\/?(schemas)?)\//

export function transformOasToServiceNode(apiDescriptionDocument: unknown) {
  if (isOas31(apiDescriptionDocument)) {
    return computeServiceNode(
      { ...apiDescriptionDocument, jsonSchemaDialect: 'http://json-schema.org/draft-07/schema#' },
      oas3SourceMap,
      transformOas3Service,
      transformOas3Operation,
      SpecVersion.OAS31,
    )
  }
  if (isOas3(apiDescriptionDocument)) {
    return computeServiceNode(
      apiDescriptionDocument,
      oas3SourceMap,
      transformOas3Service,
      transformOas3Operation,
      SpecVersion.OAS3,
    )
  } else if (isOas2(apiDescriptionDocument)) {
    return computeServiceNode(
      apiDescriptionDocument,
      oas2SourceMap,
      transformOas2Service,
      transformOas2Operation,
      SpecVersion.OAS2,
    )
  }

  return undefined
}
function computeServiceNode(
  document: Spec | OpenAPIObject,
  map: ISourceNodeMap[],
  transformService: Oas2HttpServiceTransformer | Oas3HttpServiceTransformer,
  transformOperation: Oas2HttpOperationTransformer | Oas3HttpEndpointOperationTransformer,
  specVersion: SpecVersion,
) {
  const serviceDocument = transformService({ document })
  const serviceNode: ServiceNode = {
    type: NodeType.HttpService,
    uri: '/',
    name: serviceDocument.name,
    data: serviceDocument,
    tags: serviceDocument.tags?.map(tag => tag.name) || [],
    children: computeChildNodes(document, document, map, transformOperation),
    specVersion,
  }

  return serviceNode
}

function computeChildNodes(
  document: Spec | OpenAPIObject,
  data: unknown,
  map: ISourceNodeMap[],
  transformer: Oas2HttpOperationTransformer | Oas3HttpEndpointOperationTransformer,
  parentUri: string = '',
) {
  const nodes: ServiceChildNode[] = []

  if (!isObject(data)) return nodes

  for (const key of Object.keys(data)) {
    const sanitizedKey = encodePointerFragment(key)
    const match = findMapMatch(sanitizedKey, map)

    if (match) {
      const uri = `${parentUri}/${sanitizedKey}`
      const jsonPath = pointerToPath(`#${uri}`)

      if (match.type === NodeTypes.Operation && jsonPath.length === 3) {
        const path = String(jsonPath[1])
        const method = String(jsonPath[2])
        const operationDocument = transformer({
          document,
          name: path,
          method,
          config: OPERATION_CONFIG,
        }) as IHttpOperation
        let parsedUri
        const encodedPath = String(encodePointerFragment(path))

        if (operationDocument.iid) {
          parsedUri = `/operations/${operationDocument.iid}`
        } else {
          parsedUri = uri.replace(encodedPath, slugify(path))
        }

        nodes.push({
          type: NodeType.HttpOperation,
          uri: parsedUri,
          data: operationDocument,
          name: operationDocument.summary || operationDocument.iid || operationDocument.path,
          tags: operationDocument.tags?.map(tag => tag.name) || [],
        })
      } else if (match.type === NodeTypes.Webhook && jsonPath.length === 3) {
        const name = String(jsonPath[1])
        const method = String(jsonPath[2])
        const webhookDocument = transformer({
          document,
          name,
          method,
          config: WEBHOOK_CONFIG,
        }) as IHttpWebhookOperation

        let parsedUri
        const encodedPath = String(encodePointerFragment(name))

        if (webhookDocument.iid) {
          parsedUri = `/webhooks/${webhookDocument.iid}`
        } else {
          parsedUri = uri.replace(encodedPath, slugify(name))
        }

        nodes.push({
          type: NodeType.HttpWebhook,
          uri: parsedUri,
          data: webhookDocument,
          name: webhookDocument.summary || webhookDocument.name,
          tags: webhookDocument.tags?.map(tag => tag.name) || [],
        })
      } else if (match.type === NodeTypes.Model) {
        const schemaDocument = get(document, jsonPath)
        const parsedUri = uri.replace(OAS_MODEL_REGEXP, 'schemas/')

        nodes.push({
          type: NodeType.Model,
          uri: parsedUri,
          data: schemaDocument,
          name: schemaDocument.title || last(uri.split('/')) || '',
          tags: schemaDocument['x-tags'] || [],
        })
      }

      if (match.children) {
        nodes.push(...computeChildNodes(document, data[key], match.children, transformer, uri))
      }
    }
  }

  return nodes
}

function findMapMatch(key: string | number, map: ISourceNodeMap[]): ISourceNodeMap | void {
  if (typeof key === 'number') return
  for (const entry of map) {
    const escapedKey = key.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&')

    if (!!entry.match?.match(escapedKey) || (entry.notMatch !== void 0 && !entry.notMatch.match(escapedKey))) {
      return entry
    }
  }
}

export function isJson(value: string) {
  try {
    JSON.parse(value)
  } catch {
    return false
  }
  return true
}
