import type { SchemaObject } from '@/types'
import { merge } from 'allof-merge'

/**
 * Type guard for verifying object is of type SchemaObject
 */
export function isValidSchemaObject(candidate?: unknown): candidate is SchemaObject {
  // the only check for SchemaObject is that it should be a valid object
  // even {} is a valid SchemaObject
  return Boolean(typeof candidate === 'object' && candidate !== null && !Array.isArray(candidate))
}

/**
 * Filter util for filtering out invalid schema objects from an array of schema objects
 * Useful for infering correct types and filtering arrays of type Array<JSONSchema7Definition>
 */
export function filterSchemaObjectArray(candidate: unknown): Array<SchemaObject> {
  return Array.isArray(candidate) ? candidate.filter(isValidSchemaObject) : []
}

/**
 * Utility to resolve allOf fields in a schema object.
 *
 * If allOf is present, we merge the sub-schemas in allOf into the current schema object
 * @param {SchemaObject} schema
 * @returns {SchemaObject}
 */
const resolveAllOf = (schema: SchemaObject): SchemaObject =>
  Array.isArray(schema.allOf) && schema.allOf.length > 0
    ? (merge(schema) as SchemaObject)
    : schema

/**
 * util to compute from where to extract the fields of the candidate object
 * - if it's a valid Schema Object, we can directly use it, as it is
 * - if candidate is of type array, we can extract the fields from items field
 *
 * it also resolves allOf fields, if present
 * @param candidate
 * @returns {SchemaObject | null}
 */
export const resolveSchemaObjectFields = (candidate: unknown) => {
  // if the candidate is not a valid schema object, we return null
  if (!isValidSchemaObject(candidate)) return null

  /**
   * If the candidate is an array, we need to derive the fields from its `items` field.
   * Else, we can directly use the fields from the candidate.
  */
  if (candidate.type === 'array') {
    if (isValidSchemaObject(candidate.items)) {
      return resolveAllOf(candidate.items)
    } else {
      // if the items field is not a valid schema object, we return null
      return null
    }
  }
  const schema = resolveAllOf(candidate)
  return schema
}

// only needed till we figure out how to add title field to anyOf/oneOf objects while parsing
export const inheritedPropertyName = (itemIndex: number, itemName?: string) => itemName ?? `Variant ${itemIndex + 1}`

type SchemaPropertyFilterMethod = (property: SchemaObject) => boolean

/**
 * Utility to filter out fields from a properties object based on the conditions in filterMethod
 */
function filterSchemaProperties(propertiesObject: SchemaObject['properties'], filterMethod: SchemaPropertyFilterMethod): SchemaObject['properties'] {
  if (!propertiesObject) return

  const filteredObj: SchemaObject['properties'] = {}

  Object.keys(propertiesObject).forEach((key) => {
    const currentItem = propertiesObject[key]
    // we only need to operate on valid schema objects
    if (!isValidSchemaObject(currentItem)) return

    // If the current object fails the condition in filterMethod, we need to remove it
    if (filterMethod(currentItem)) {
      return
    }

    /**
     * If the current object passes the condition in filterMethod, we still need to filter:
     * - properties of the current object
     * - properties under items object, if currentItem is an array
     * - properties under oneOf/anyOf, if present
     * which is done by calling removeFieldsFromSchemaObject
     */
    filteredObj[key] = removeFieldsFromSchemaObject(currentItem, filterMethod)
  })

  return filteredObj
}

/**
 * Utility to remove fields from a schema object based on the conditions in filterMethod
 * The default filterMethod removes readonly fields
 *
 * It removes fields from:
 * - properties of current object
 * - items object
 * - oneOf/anyOf
 */
export function removeFieldsFromSchemaObject(schemaObject: SchemaObject, filterMethod: SchemaPropertyFilterMethod = removeReadonlyFields): SchemaObject {
  const newObj: SchemaObject = JSON.parse(JSON.stringify(schemaObject))

  if (schemaObject.properties) {
    const filteredProperties = filterSchemaProperties(schemaObject.properties, filterMethod)
    newObj.properties = filteredProperties
  }
  if (isValidSchemaObject(schemaObject.items)) {
    // items itself is a valid schema object, so we need to filter its properties, oneOf and anyOf
    const filteredItemsObject = removeFieldsFromSchemaObject(schemaObject.items, filterMethod)
    newObj.items = filteredItemsObject
  }
  if (schemaObject.oneOf?.length) {
    const newOneOfList: SchemaObject['oneOf'] = []
    schemaObject.oneOf.forEach((item) => {
      // if the item is not a valid schema object or it fails the condiiton in filterMethod, we skip it
      if (!isValidSchemaObject(item) || filterMethod(item)) return

      // if the item is valid, we remove the fields from its properties
      const filteredProperties = filterSchemaProperties(item.properties, filterMethod)
      newOneOfList.push({ ...item, properties: filteredProperties })
    })
    newObj.oneOf = newOneOfList
  }
  if (schemaObject.anyOf?.length) {
    const newAnyOfList: SchemaObject['anyOf'] = []
    schemaObject.anyOf.forEach((item) => {
      if (!isValidSchemaObject(item) || filterMethod(item)) return
      const filteredProperties = filterSchemaProperties(item.properties, filterMethod)
      newAnyOfList.push({ ...item, properties: filteredProperties })
    })
    newObj.anyOf = newAnyOfList
  }

  return newObj
}

export function removeReadonlyFields(schemaObject: SchemaObject): boolean {
  return Boolean(schemaObject.readOnly)
}
