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
export function filterSchemaObjectArray(candidate: unknown): SchemaObject[] {
  return Array.isArray(candidate) ? candidate.filter(isValidSchemaObject) : []
}

/**
 * Clones an object graph into a tree by dropping repeated object references.
 *
 * Why this exists:
 * - `JSON.stringify` fails on circular structures.
 * - Recursive walkers can overflow the call stack for deeply nested schemas.
 *
 * How it works:
 * - Uses a DFS stack (iterative traversal, no recursion).
 * - Uses a WeakMap to track objects that were already cloned.
 * - If a value was already seen, we skip assigning that key.
 *
 * Result:
 * - Circular links and duplicate shared refs are removed.
 * - Primitive values and the first encounter of each object are preserved.
 */
const removeCircularRefs = (obj: Record<string, any>): Record<string, any> => {
  const rootClone: Record<string, any> = Array.isArray(obj) ? [] : {}
  try {
    const seen = new WeakMap<object, Record<string, any>>()
    seen.set(obj, rootClone)

    const stack: Array<{ source: Record<string, any>, target: Record<string, any> }> = [{ source: obj, target: rootClone }]

    // Iterate explicitly to avoid recursive stack growth on deep schemas.
    while (stack.length > 0) {
      const current = stack.pop()
      if (!current) continue

      const { source, target } = current

      Object.keys(source).forEach((key) => {
        const value = source[key]

        if (typeof value === 'object' && value !== null) {
          // Skip repeated refs (including circular refs) to keep result tree-shaped.
          if (seen.has(value)) return

          const childClone: Record<string, any> = Array.isArray(value) ? [] : {}
          seen.set(value, childClone)
          target[key] = childClone
          stack.push({ source: value, target: childClone })
          return
        }

        target[key] = value
      })
    }
  } catch (error) {
    throw new Error(`Failed to remove circular references: ${error}`)
  }

  return rootClone
}

/**
 * Utility to resolve allOf fields in a schema object.
 *
 * If allOf is present, we merge the sub-schemas in allOf into the current schema object
 * @param {SchemaObject} schema
 * @returns {SchemaObject}
 */
const resolveAllOf = (schema: SchemaObject): SchemaObject => {
  if (Array.isArray(schema?.allOf) && schema.allOf.length > 0) {
    // do we have circular references?
    try {
      JSON.stringify(schema)
    } catch {
      // yes, we do have circular references, merge will fail, let's do it simpler way

      let resolvedAllOf: SchemaObject = {}
      for (const allEl of schema.allOf) {
        resolvedAllOf = { ...resolvedAllOf, ...removeCircularRefs(allEl as Record<string, any>) as Record<string, any> }
      }
      return {
        ...resolvedAllOf,
        ...(schema.title ? { title: schema.title } : {}),
      }
    }

    // we are clean and do not have any circular refs - safe to use merge
    return {
      ...(merge(schema, { mergeCombinarySibling: true }) as SchemaObject),
      ...(schema.title ? { title: schema.title } : {}),
    }
  } else {
    return schema
  }
}
/**
 * Utility to resolve the type of a schema object.
 * We return the type as it is if it's not a list.
 *
 * If type is a list:
 * - and includes 'array', we return 'array'
 * - else if it includes 'object', we return 'object'
 * - else we return the first item in the list
 */
export const resolveSchemaType = (schemaType: SchemaObject['type']): SchemaObject['type'] => {
  if (Array.isArray(schemaType)) {
    if (schemaType.includes('array')) {
      return 'array'
    } else if (schemaType.includes('object')) {
      return 'object'
    } else {
      return schemaType[0]
    }
  }

  return schemaType
}

/**
 * util to compute from where to extract the fields of the candidate object
 * - if it's a valid Schema Object, we can directly use it, as it is
 * - if candidate is of type array, we can extract the fields from items field
 *
 * it also resolves allOf fields, if present
 * @param candidate
 * @returns {SchemaObject | null}
 */
export const resolveSchemaObjectFields = (candidate: unknown): SchemaObject => {
  // if the candidate is not a valid schema object, we return empty object
  if (!isValidSchemaObject(candidate)) return {}

  const schemaType = resolveSchemaType(candidate.type)

  /**
   * If the candidate is an array, we need to derive the fields from its `items` field.
   * Else, we can directly use the fields from the candidate.
  */
  if (schemaType === 'array' && candidate.items && isValidSchemaObject(candidate.items)) {
    /**
       * we need —
       * - fields listed directly under the model, except items
       * - fields listed under items, so we destructure items
       * - data type as 'array' and format as the array item data type
       * if a field is present in both items and the model itself, we use the one from items
       */
    const candidateWithoutItems = { ...candidate }
    delete candidateWithoutItems.items
    return {
      ...candidateWithoutItems,
      ...resolveAllOf(candidate.items),
      type: candidate.type,
      itemType: candidate.items.type,
    }
  }

  return resolveAllOf(candidate)
}

// only needed till we figure out how to add title field to anyOf/oneOf objects while parsing
export const inheritedPropertyName = (itemIndex: number, itemName?: string) => itemName ?? `Variant ${itemIndex + 1}`

type SchemaPropertyFilterMethod = (property: SchemaObject) => boolean

/**
 * Utility to filter out fields from a properties object based on the conditions in filterMethod
 */
function filterSchemaProperties(
  propertiesObject: SchemaObject['properties'],
  filterMethod: SchemaPropertyFilterMethod,
): NonNullable<SchemaObject['properties']> {
  if (!propertiesObject) return {}

  const filteredObj: SchemaObject['properties'] = {}

  Object.keys(propertiesObject).forEach((key) => {
    const currentItem = propertiesObject[key]
    // we only need to operate on valid schema objects
    if (!isValidSchemaObject(currentItem)) return {}

    // If the current object fails the condition in filterMethod, we need to remove it
    if (filterMethod(currentItem)) {
      return {}
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
  const newObj: SchemaObject = removeCircularRefs(schemaObject)

  if (newObj.properties) {
    const filteredProperties = filterSchemaProperties(newObj.properties, filterMethod)
    newObj.properties = filteredProperties
  }
  if (isValidSchemaObject(newObj.items)) {
    // items itself is a valid schema object, so we need to filter its properties, oneOf and anyOf
    const filteredItemsObject = removeFieldsFromSchemaObject(newObj.items, filterMethod)
    newObj.items = filteredItemsObject
  }
  if (newObj.oneOf?.length) {
    const newOneOfList: SchemaObject['oneOf'] = []
    newObj.oneOf.forEach((item) => {
      // if the item is not a valid schema object or it fails the condiiton in filterMethod, we skip it
      if (!isValidSchemaObject(item) || filterMethod(item)) return

      // if the item is valid, we remove the fields from its properties
      const filteredProperties = filterSchemaProperties(item.properties, filterMethod)
      newOneOfList.push({ ...item, properties: filteredProperties })
    })
    newObj.oneOf = newOneOfList
  }
  if (newObj.anyOf?.length) {
    const newAnyOfList: SchemaObject['anyOf'] = []
    newObj.anyOf.forEach((item) => {
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
