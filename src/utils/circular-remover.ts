/**
 * Checks if object has circular references
 *
 * @param o object
 * @returns true when there are circular refs, false otherwise
 */
const hasCircular = (o: Record<string, any>): boolean => {
  try {
    JSON.stringify(o)
  } catch (err: any) {
    if (err.message.includes('circular')) {
      return true
    }
  }
  return false
}

/**
 * Removes circular references from the object
 *
 * @param obj object to massage
 * @returns object with circular references removed
 */
export const removeCircularReferences = (obj: any): any => {

  // if there are no circular references detected, we just return orig object
  if (!hasCircular(obj)) {
    return obj
  }

  const seen = new WeakMap() // object to path mappings

  const doRemove = (value: Record<string, any>, path: string): Record<string, any> | null => {
    if (
      typeof value === 'object' &&
      value !== null &&
      !(value instanceof Boolean) &&
      !(value instanceof Date) &&
      !(value instanceof Number) &&
      !(value instanceof RegExp) &&
      !(value instanceof String)
    ) {
      const wasSeenPath = seen.get(value)
      if (wasSeenPath) {
        if (wasSeenPath && path.startsWith(wasSeenPath)) {
          return null
        }

      } else {
        seen.set(value, path)
      }

      if (Array.isArray(value)) {
        const nu: Array<any> = []
        value.forEach((element, i) => {
          const currentPath = `${path}[${i}]`
          const res = doRemove(value[i], currentPath)
          if (res !== null) {
            nu.push(res)
          }

        })
        return nu
      } else {
        const nu: Record<string, any> = {}
        Object.keys(value).forEach((key: string) => {
          const currentPath = `${path}${key}/`
          const res = doRemove(value[key], currentPath)
          if (res !== null) {
            nu[key] = res
          }
        })
        return nu
      }
    } else {
      // use value as is
      return value
    }
  }
  obj = < Record<string, any>>doRemove(obj, '/')
  return obj
}
