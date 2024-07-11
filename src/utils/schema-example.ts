import { MAX_NESTED_LEVELS } from '@/constants'

/**
 * Returning sample value for single parameter
 *
 * @param paramData
 * @param key
 * @returns
 */
export const extractSampleForParam = (paramData: Record<string, any> | undefined, key: string): string | boolean => {
  if (!paramData) {
    return ''
  }

  let exampleValue = paramData.example
  if (exampleValue !== null && exampleValue !== undefined) {
    return exampleValue.value ?? exampleValue
  }

  if (paramData.schema?.examples) {
    exampleValue = paramData.schema?.examples[0]
    if (exampleValue !== null && exampleValue !== undefined) {
      return exampleValue.value ?? exampleValue
    }
  }

  if (paramData.examples) {
    exampleValue = paramData.examples[0]
    if (exampleValue !== null && exampleValue !== undefined) {
      return exampleValue.value ?? exampleValue
    }
  }

  if (paramData.enum) {
    return paramData.enum[0]
  }

  if (paramData.default !== null && paramData.default !== undefined) {
    return typeof paramData.default === 'object' ? JSON.stringify(paramData.default) : paramData.default
  }

  switch (paramData.type) {
    case 'boolean':
      return false
    case 'integer':
      return '0'
    case 'number':
      return '0'
    case 'string':
      return key
    case 'object':
      return '{}'
    case 'array':
      return '[]'
    default:
      break
  }

  return ''
}

interface CrawlOptions {
  objData: Record<string, any>
  parentKey: string
  nestedLevel: number
  filteringOptions: Record<string, boolean>
}

/**
 * now we do not have examples for entire body, let's try to build sample object here
 * to avoid circular references we will dig 10 levels deep , no more
 * @param {CrawlOptions} CrawlOptions
 * @returns {Record<string, any> | null}
 */
export const crawl = ({ objData, parentKey, nestedLevel, filteringOptions }: CrawlOptions): Record<string, any> | null => {

  let sampleObj = <Record<string, any>>{}
  if (typeof objData === 'undefined') {
    return sampleObj
  }
  if (nestedLevel > MAX_NESTED_LEVELS) {
    sampleObj[parentKey] = extractSampleForParam(objData, parentKey)
    return sampleObj
  }
  if (objData.allOf && Array.isArray(objData.allOf)) {
    if (filteringOptions.excludeReadonly) {
      for (let i = 0; i < objData.allOf.length; i++) {
        if (objData.allOf[i].readOnly === true) {
          return null
        }
      }
    }
    for (let i = 0; i < objData.allOf.length; i++) {
      sampleObj = {
        ...sampleObj,
        ...crawl({
          objData: objData.allOf[i],
          parentKey: `allOf-${i}`,
          nestedLevel,
          filteringOptions,
        }),
      }
    }
    return sampleObj
  }
  Object.keys(objData.properties || {}).forEach((key: string) => {
    if (filteringOptions.excludeNotRequired) {
      if (!objData.required || !Array.isArray(objData.required) || !objData.required.includes(key)) {
        return
      }
    }
    const oData = objData.properties[key]
    if (filteringOptions.excludeReadonly && oData.readOnly) {
      return
    }
    if (oData.anyOf && Array.isArray(oData.anyOf) && oData.anyOf.length) {
      sampleObj[key] = crawl({ objData: oData.anyOf[0] || {}, parentKey: key, nestedLevel, filteringOptions })
    } else if (oData.type === 'object' || oData.allOf) {
      const res = crawl({ objData: oData || {}, parentKey: key, nestedLevel: nestedLevel++, filteringOptions })
      if (res !== null) {
        sampleObj[key] = res
      }
    } else if (oData.type === 'array') {
      sampleObj[key] = [extractSampleForParam(oData, key)]
    } else {
      sampleObj[key] = extractSampleForParam(oData , key)
    }
  })
  return sampleObj
}
