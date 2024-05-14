import type { ReferenceObject, SchemaObject } from '@/types'

export const isNestedObj = (property: SchemaObject) => Boolean(property.type === 'object' && property.properties && Reflect.ownKeys(property.properties).length)

/**
 * Type guard for verifying object is of type SchemaObject
 */
export function isValidSchemaObject(candidate?: SchemaObject | ReferenceObject): candidate is SchemaObject {
  return Boolean(candidate && !Object.prototype.hasOwnProperty.call(candidate, '$ref'))
}

export const schemaObjectProperties = (candidate: SchemaObject) => {
  let computedObj: Partial<SchemaObject> | null = null

  /**
   * We have to enumerate over the properties of the Schema Model and render them out via `ModelProperty` component.
   * For this, we need to compute the properties and required fields of the Schema Model.
   * If the top level Schema Model is an object, we can directly use the `properties` field of the object.
   * If it's an array, we need to derive the properties from the `items` field of the Schema Model.
   */
  if (isNestedObj(candidate)) {
    computedObj = {
      properties: candidate.properties,
      required: candidate.required,
      oneOf: candidate.oneOf,
      anyOf: candidate.anyOf,
    }
  } else if (candidate.type === 'array' && isValidSchemaObject(candidate.items)) {
    computedObj = {
      properties: candidate.items.properties,
      required: candidate.items.required,
      oneOf: candidate.items.oneOf,
      anyOf: candidate.items.anyOf,
    }
  }

  return computedObj
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
