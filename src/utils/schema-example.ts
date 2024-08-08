import { MAX_NESTED_LEVELS } from '@/constants'
import { resolveSchemaObjectFields } from './schema-model'

/**
 * Returning sample value for single parameter
 *
 * @param paramData
 * @param key
 * @returns
 */
export const extractSampleForParam = (paramData: Record<string, any> | undefined, key: string): string | boolean | number => {
  if (!paramData) {
    return ''
  }

  let exampleValue = paramData.example
  if (exampleValue !== undefined) {
    return exampleValue
  }

  if (paramData.schema?.examples) {
    exampleValue = paramData.schema?.examples[0]
    if (exampleValue !== undefined) {
      return exampleValue
    }
  }

  if (paramData.examples) {
    exampleValue = paramData.examples[0]
    if (exampleValue !== undefined) {
      return exampleValue
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
      return 0
    case 'number':
      return 0
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

  if (objData.example) {
    return objData.example
  }

  sampleObj = crawlInheritedProperties({ objData, parentKey, nestedLevel: nestedLevel, filteringOptions }) ?? {}

  Object.keys(objData.properties || {}).forEach((key: string) => {
    if (filteringOptions.excludeNotRequired) {
      if (!objData.required || !Array.isArray(objData.required) || !objData.required.includes(key)) {
        return
      }
    }
    const oData = resolveSchemaObjectFields(objData.properties[key])
    if (filteringOptions.excludeReadonly && oData.readOnly) {
      return
    }

    if (oData.type === 'array') {
      // if it's an array of objects, we'll generate the sample array item by crawling again
      // else, if there's no inherited fields, we'll generate the sample array item using extractSampleForParam
      sampleObj[key] =
        oData.format === 'object'
          ? [crawl({
            objData: oData || {},
            parentKey: key,
            nestedLevel: nestedLevel + 1,
            filteringOptions,
          })]
          : [crawlInheritedProperties({
            objData: oData,
            parentKey: key,
            nestedLevel: nestedLevel + 1,
            filteringOptions,
          }) ?? extractSampleForParam(oData, key)]
    } else if (oData.type === 'object' || oData.allOf) {
      const res = crawl({ objData: oData || {}, parentKey: key, nestedLevel: nestedLevel + 1, filteringOptions })
      if (res !== null) {
        sampleObj[key] = res
      }
    } else {
      sampleObj[key] =
        crawlInheritedProperties({
          objData: oData,
          parentKey: key,
          nestedLevel: nestedLevel + 1,
          filteringOptions,
        }) ?? extractSampleForParam(oData, key)
    }
  })
  return sampleObj
}

/**
 * util to generate example for inherited fields like allOf, anyOf, oneOf
 *
 * @param {CrawlOptions} CrawlOptions
 * @returns {Record<string, any> | null}
 */
const crawlInheritedProperties = ({ objData, parentKey, nestedLevel, filteringOptions }: CrawlOptions): Record<string, any> | null => {
  if (typeof objData === 'undefined') {
    return null
  }

  let sampleObj = <Record<string, any>>{}

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

  if (Array.isArray(objData.anyOf) && typeof(objData.anyOf[0]) === 'object') {
    return crawl({ objData: objData.anyOf[0] || {}, parentKey, nestedLevel: nestedLevel + 1, filteringOptions })
  } else if (Array.isArray(objData.oneOf) && typeof(objData.oneOf[0]) === 'object') {
    return crawl({ objData: objData.oneOf[0] || {}, parentKey, nestedLevel: nestedLevel + 1, filteringOptions })
  }

  return null
}
