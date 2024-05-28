import type { SchemaObject } from '@/types'

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
 * util to compute from where to extract the fields of the candidate object
 * - if it's a valid Schema Object, we can directly use it, as it is
 * - if candidate is of type array, we can extract the fields from items field
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
      return candidate.items
    } else {
      // if the items field is not a valid schema object, we return null
      return null
    }
  }
  return candidate
}

// only needed till we figure out how to add title field to anyOf/oneOf objects while parsing
export const inheritedPropertyName = (itemIndex: number, itemName?: string) => itemName ?? `Variant ${itemIndex + 1}`

export function isModelPropertyVisible(property: SchemaObject, readonlyVisible = true): boolean {
  return readonlyVisible ? true : !property.readOnly
}

/**
 * Utility to filter out readOnly properties from a properties object
 */
function filterReadonlyProperties(propertiesObject: SchemaObject['properties']): SchemaObject['properties'] {
  if (!propertiesObject) return

  const filteredObj: SchemaObject['properties'] = {}

  Object.keys(propertiesObject).forEach((key) => {
    const currentItem = propertiesObject[key]
    // we only need to operate on valid schema objects
    if (!isValidSchemaObject(currentItem)) return

    // If the current object is readOnly, we need to remove it
    if (currentItem.readOnly) {
      return
    }

    /**
     * If the current object is not readOnly, we need to filter:
     * - properties of the current object
     * - properties under items object, if currentItem is an array
     * - properties under oneOf/anyOf, if present
     */
    filteredObj[key] = removeReadonlyFields(currentItem)
  })

  return filteredObj
}

/**
 * Utility to remove readOnly fields from a schema object
 *
 * It removes:
 * - readOnly properties of the current object
 * - readOnly fields under items object
 * - properties under oneOf/anyOf, if present
 */
export function removeReadonlyFields(schemaObject: SchemaObject): SchemaObject {
  const newObj: SchemaObject = JSON.parse(JSON.stringify(schemaObject))

  if (schemaObject.properties) {
    const filteredProperties = filterReadonlyProperties(schemaObject.properties)
    newObj.properties = filteredProperties
  }
  if (isValidSchemaObject(schemaObject.items)) {
    // items itself is a valid schema object, so we need to filter its properties, oneOf and anyOf
    const filteredItemsObject = removeReadonlyFields(schemaObject.items)
    newObj.items = filteredItemsObject
  }
  if (schemaObject.oneOf?.length) {
    const newOneOfList: SchemaObject['oneOf'] = []
    schemaObject.oneOf.forEach((item) => {
      // if the item is not a valid schema object or is readOnly, we skip it
      if (!isValidSchemaObject(item) || item.readOnly) return

      // if the item is valid, we remove its readOnly properties
      const filteredProperties = filterReadonlyProperties(item.properties)
      newOneOfList.push({ ...item, properties: filteredProperties })
    })
    newObj.oneOf = newOneOfList
  }
  if (schemaObject.anyOf?.length) {
    const newAnyOfList: SchemaObject['anyOf'] = []
    schemaObject.anyOf.forEach((item) => {
      if (!isValidSchemaObject(item) || item.readOnly) return
      const filteredProperties = filterReadonlyProperties(item.properties)
      newAnyOfList.push({ ...item, properties: filteredProperties })
    })
    newObj.anyOf = newAnyOfList
  }

  return newObj
}
