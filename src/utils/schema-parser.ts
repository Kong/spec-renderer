import composables from '../composables'
import type { SchemaObject, ReferenceObject } from '@/types'

const {
  parse,
  parsedDocument,
  jsonDocument,
  tableOfContents,
  validationResults,
} = composables.useSchemaParser()

/**
 * Type guard for verifying object is of type SchemaObject
 */
function isValidSchemaObject(candidate?: SchemaObject | ReferenceObject): candidate is SchemaObject {
  return Boolean(candidate && !Object.prototype.hasOwnProperty.call(candidate, '$ref'))
}

export {
  parse,
  parsedDocument,
  jsonDocument,
  tableOfContents,
  validationResults,
  isValidSchemaObject,
}
