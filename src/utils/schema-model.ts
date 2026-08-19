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


const removeCircularRefs = (obj: Record<string, any>):Record<string, any> => {
  const cache = new Set()
  const jsonString = JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        // Circular reference found, discard key
        return
      }
      // Store value in our collection
      cache.add(value)
    }
    return value
  })
  const res = JSON.parse(jsonString)
  return res
}

/**
 * Merges a schema's allOf sub-schemas via allof-merge, then makes the schema's own sibling
 * `title`/`example`/`examples` win over the merge result.
 *
 * @param originalSchema the schema to merge; also read for the sibling overrides
 * @param allOfForMerge the allOf array to merge, if different from originalSchema.allOf (e.g. a
 * circular-reference-safe copy - see resolveAllOf)
 */
const mergeAllOf = (originalSchema: SchemaObject, allOfForMerge: SchemaObject['allOf'] = originalSchema.allOf): SchemaObject => {
  const merged: SchemaObject = { ...(merge({ ...originalSchema, allOf: allOfForMerge }, { mergeCombinarySibling: true }) as SchemaObject) }

  // restore title as allof-merge lets an allOf branch's title silently overwrite the sibling's
  if (originalSchema.title) {
    merged.title = originalSchema.title
  }

  // allof-merge concatenates example/examples across allOf branches instead of letting the sibling
  // override - keep only the sibling's own value, clearing the other key so it can't win instead
  if (Object.hasOwn(originalSchema, 'examples')) {
    merged.examples = originalSchema.examples
    delete merged.example
  } else if (Object.hasOwn(originalSchema, 'example')) {
    merged.example = originalSchema.example
    delete merged.examples
  }

  return merged
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
      // circular references detected, for each allOf item, only call removeCircularRefs if the
      // item itself is circular, otherwise use it as-is to preserve shared schema references
      // (e.g. two properties pointing to the same $ref object). also strip oneOf/anyOf to
      // avoid showing inherited variant selectors
      const cleanedAllOf = filterSchemaObjectArray(schema.allOf).map((item) => {
        let result: SchemaObject
        try {
          JSON.stringify(item)
          result = { ...item }
        } catch {
          result = removeCircularRefs(item)
        }
        delete result.oneOf
        delete result.anyOf
        return result
      })
      return mergeAllOf(schema, cleanedAllOf)
    }

    // we are clean and do not have any circular refs - safe to use merge
    return mergeAllOf(schema)
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
 *
 * @param seen Memoizes the filtered result per schema object, keyed by the original object's
 * identity. Revisiting the same object (a circular `$ref`, or a schema shared non-circularly by
 * sibling properties) returns the already-filtered result instead of recursing again.
 */
function filterSchemaProperties(
  propertiesObject: SchemaObject['properties'],
  filterMethod: SchemaPropertyFilterMethod,
  seen: WeakMap<object, SchemaObject>,
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
    filteredObj[key] = removeFieldsFromSchemaObject(currentItem, filterMethod, seen)
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
 *
 * @param schemaObject The schema object to filter
 * @param filterMethod Decides whether a given property should be removed
 * @param seen Internal only: memoizes the filtered result per schema object, keyed by identity.
 * A circular `$ref` (preserved as a live circular object reference via
 * `dereference: { circular: true }`) would otherwise recurse forever and crash the render, so the
 * result is registered before recursing into its own properties/items/oneOf/anyOf, letting a
 * cycle resolve to that same object instead of an unfiltered copy. It also means a schema reached
 * via more than one non-circular path is filtered once and shared, not reprocessed.
 *
 * `seen` only guards against revisiting an object, not sheer nesting depth, since a single
 * `JSON.stringify` call (and its `removeCircularRefs` fallback) can still overflow the stack on a
 * very deeply nested schema. Each step below has its own `try`/`catch` so that failure only
 * degrades that one step, not the whole node or document.
 */
export function removeFieldsFromSchemaObject(schemaObject: SchemaObject, filterMethod: SchemaPropertyFilterMethod = removeReadonlyFields, seen: WeakMap<object, SchemaObject> = new WeakMap()): SchemaObject {
  const cached = seen.get(schemaObject)
  if (cached) return cached

  let newObj: SchemaObject
  // a RangeError means we've hit real stack depth (not just a circular reference, which throws
  // TypeError). Recursing further would just repeat the same overflow at every remaining level,
  // so give up on this whole subtree right away instead of retrying node by node.
  let stackOverflowed = false
  try {
    newObj = JSON.parse(JSON.stringify(schemaObject))
  } catch (err) {
    if (err instanceof RangeError) {
      newObj = { ...schemaObject }
      stackOverflowed = true
    } else {
      try {
        // schemaObject contains a circular reference; fall back to a circular-safe clone
        newObj = removeCircularRefs(schemaObject)
      } catch (err2) {
        newObj = { ...schemaObject }
        stackOverflowed = err2 instanceof RangeError
      }
    }
  }

  seen.set(schemaObject, newObj)

  if (stackOverflowed) {
    return newObj
  }

  if (schemaObject.properties) {
    try {
      newObj.properties = filterSchemaProperties(schemaObject.properties, filterMethod, seen)
    } catch (err) {
      // only stack depth is expected here; anything else is a real bug and should surface, not
      // vanish into an unfiltered field
      if (!(err instanceof RangeError)) throw err
      // leave whatever `properties` the initial clone produced
    }
  }
  if (isValidSchemaObject(schemaObject.items)) {
    try {
      // items itself is a valid schema object, so we need to filter its properties, oneOf and anyOf
      newObj.items = removeFieldsFromSchemaObject(schemaObject.items, filterMethod, seen)
    } catch (err) {
      if (!(err instanceof RangeError)) throw err
      // leave whatever `items` the initial clone produced
    }
  }
  if (schemaObject.oneOf?.length) {
    try {
      const newOneOfList: SchemaObject['oneOf'] = []
      schemaObject.oneOf.forEach((item) => {
        // if the item is not a valid schema object or it fails the condition in filterMethod, we skip it
        if (!isValidSchemaObject(item) || filterMethod(item)) return

        // recurse through the same cycle-safe walk used for properties/items, so an array-typed
        // (or otherwise nested) oneOf branch is filtered and cycle-guarded too, not just its
        // top-level properties
        newOneOfList.push(removeFieldsFromSchemaObject(item, filterMethod, seen))
      })
      newObj.oneOf = newOneOfList
    } catch (err) {
      if (!(err instanceof RangeError)) throw err
      // leave whatever `oneOf` the initial clone produced
    }
  }
  if (schemaObject.anyOf?.length) {
    try {
      const newAnyOfList: SchemaObject['anyOf'] = []
      schemaObject.anyOf.forEach((item) => {
        if (!isValidSchemaObject(item) || filterMethod(item)) return
        newAnyOfList.push(removeFieldsFromSchemaObject(item, filterMethod, seen))
      })
      newObj.anyOf = newAnyOfList
    } catch (err) {
      if (!(err instanceof RangeError)) throw err
      // leave whatever `anyOf` the initial clone produced
    }
  }

  return newObj
}

export function removeReadonlyFields(schemaObject: SchemaObject): boolean {
  return Boolean(schemaObject.readOnly)
}
