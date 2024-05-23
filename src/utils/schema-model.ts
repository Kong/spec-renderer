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
