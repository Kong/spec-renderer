import type { SchemaObject } from '@/types'
import { isValidSchemaObject } from './schema-parser'

const isNestedObj = (property: SchemaObject) => property.type === 'object' && property.properties && Reflect.ownKeys(property.properties).length

export const schemaObjectProperties = (candidate: SchemaObject) => {
  let computedObj: Partial<SchemaObject> | null = null

  /**
   * We have to enumerate over the properties of the Schema Model and render them out via `ModelProperty` component.
   * For this, we need to compute the properties and required fields of the Schema Model.
   * If the top level Schema Model is an object, we can directly use the `properties` field of the object.
   * If it's an array, we need to derive the properties from the `items` field of the Schema Model.
   */
  if (isNestedObj(candidate)) {
    computedObj = { properties: candidate.properties, required: candidate.required }
  } else if (candidate.type === 'array' && isValidSchemaObject(candidate.items)) {
    computedObj = { properties: candidate.items.properties, required: candidate.items.required }
  }

  return computedObj
}
