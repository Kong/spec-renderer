import type { SchemaObject } from '@/types'

export const isNestedObj = (property: SchemaObject) => Boolean(property.type === 'object' && property.properties && Reflect.ownKeys(property.properties).length)

/**
 * Type guard for verifying object is of type SchemaObject
 */
export function isValidSchemaObject(candidate?: unknown): candidate is SchemaObject {
  return Boolean(candidate && !Object.prototype.hasOwnProperty.call(candidate, '$ref'))
}

/**
 * util to compute whether to
 * - directly use a schema object as it is if it's a valid Schem Object
 * - or extract the properties from items field if candidate is an array
 * @param candidate
 * @returns {SchemaObject | null}
 */
export const schemaObjectProperties = (candidate: unknown) => {

  // if the candidate is not a valid schema object, we return null
  if (!isValidSchemaObject(candidate)) return null

  /**
   * If the candidate is an array, we need to derive the properties from the `items` field of the Schema Model.
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

// We need to fix the order in which the components for these fields are rendered
export const orderedFieldList = (itemData: SchemaObject, itemName?: string) => {
  const fields : Array<keyof SchemaObject> = []

  if (itemData.title || itemName) {
    fields.push('title')
  }
  if (itemData.description) {
    fields.push('description')
  }
  if (itemData.enum) {
    fields.push('enum')
  }
  if (itemData.pattern) {
    fields.push('pattern')
  }
  if (itemData.maximum || itemData.minimum) {
    fields.push('maximum')
  }
  if (itemData.example) {
    fields.push('example')
  }
  return fields
}

// only needed till we figure out how to add title field to anyOf/oneOf objects while parsing
export const inheritedPropertyName = (itemIndex: number, itemName?: string) => itemName ?? `Variant ${itemIndex + 1}`
