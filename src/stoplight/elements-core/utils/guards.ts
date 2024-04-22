// @ts-nocheck
import type { IHttpOperation, IHttpService, IHttpWebhookOperation, INode } from '@stoplight/types'
import type { JSONSchema7 } from 'json-schema'
import { isObject, isPlainObject } from 'lodash'
/*
interface IMarkdownViewerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onError'> {
  markdown: string;
  className?: string;
  // parseOptions?: ParseOptions;
  includeToc?: boolean;
  tocMaxDepth?: 1 | 2 | 3 | 4;
  tocBasePath?: string;
}
const isArray = (a: any) => Array.isArray(a)

export function isSMDASTRoot(maybeAst: unknown): maybeAst is IMarkdownViewerProps['markdown'] {
  return isObject(maybeAst) && maybeAst.type === 'root' && isArray(maybeAst.children)
}
*/

export function isJSONSchema(maybeSchema: unknown): maybeSchema is JSONSchema7 {
  // the trick is, JSONSchema doesn't define any required properties, so technically even an empty object is a valid JSONSchema
  return isPlainObject(maybeSchema)
}

function isStoplightNode(maybeNode: unknown): maybeNode is INode {
  return isObject(maybeNode) && 'id' in maybeNode
}

export function isHttpService(maybeHttpService: unknown): maybeHttpService is IHttpService {
  console.log(isStoplightNode(maybeHttpService))
  return isStoplightNode(maybeHttpService) && 'name' in maybeHttpService && 'version' in maybeHttpService
}

export function isHttpOperation(maybeHttpOperation: unknown): maybeHttpOperation is IHttpOperation {
  return isStoplightNode(maybeHttpOperation) && 'method' in maybeHttpOperation && 'path' in maybeHttpOperation
}

export function isHttpWebhookOperation(
  maybeHttpWebhookOperation: unknown,
): maybeHttpWebhookOperation is IHttpWebhookOperation {
  return (
    isStoplightNode(maybeHttpWebhookOperation) &&
    'method' in maybeHttpWebhookOperation &&
    'name' in maybeHttpWebhookOperation
  )
}

const properUrl =
// eslint-disable-next-line no-useless-escape
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/

export function isProperUrl(url: string) {
  return properUrl.test(url)
}
