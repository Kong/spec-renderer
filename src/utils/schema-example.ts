import { MAX_NESTED_LEVELS } from '@/constants'
import { resolveSchemaObjectFields, resolveSchemaType } from './schema-model'

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

  switch (resolveSchemaType(paramData.type)) {
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
  parentKey?: string
  nestedLevel?: number
  filteringOptions: Record<string, boolean>
}

/**
 * now we do not have examples for entire body, let's try to build sample object here
 * to avoid circular references we will dig 10 levels deep , no more
 * @param {CrawlOptions} CrawlOptions
 * @returns {Record<string, any> | null}
 */


export const crawl = ({ objData, parentKey = '', nestedLevel = 0, filteringOptions }: CrawlOptions): Record<string, any> | null => {

  /*
    WeakMap we store child objData's sampleObjects in weakMap so that when
    we we see it's already stored, instead of extracting sampleObject again and again, we use what already extracted and stored in the WeakMap
  */
  const seen = new WeakMap()

  /**
 * util to generate example for inherited fields like allOf, anyOf, oneOf
 *
 * @param {CrawlOptions} CrawlOptions
 * @returns {Record<string, any> | null}
 */
  const crawlInheritedProperties = ({ objData, parentKey = '', nestedLevel = 0, filteringOptions }: CrawlOptions): Record<string, any> | null => {
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
          ...doCrawl({
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
      return doCrawl({ objData: objData.anyOf[0] || {}, parentKey, nestedLevel: nestedLevel + 1, filteringOptions })
    } else if (Array.isArray(objData.oneOf) && typeof(objData.oneOf[0]) === 'object') {
      return doCrawl({ objData: objData.oneOf[0] || {}, parentKey, nestedLevel: nestedLevel + 1, filteringOptions })
    }

    return null
  }
  /**
   * do actual crawl, called recursively
   * @param {CrawlOptions} CrawlOptions
   * @returns {Record<string, any> | null}
  */
  const doCrawl = ({ objData, parentKey = '', nestedLevel = 0, filteringOptions }: CrawlOptions): Record<string, any> | null => {

    let sampleObj = <Record<string, any>>{}

    if (typeof objData === 'undefined') {
      return sampleObj
    }

    if (objData.example) {
      return objData.example
    }

    if (filteringOptions.excludeNotRequired && !objData.required ) {
      return sampleObj
    }


    if (nestedLevel >= MAX_NESTED_LEVELS ) {
      sampleObj[parentKey] = extractSampleForParam(objData, parentKey)
      return sampleObj
    }

    /*
      here is where we do lookup into WeakMap, and we we already have record there, just return already parsed sample object
    */
    const seenRecord = seen.get(objData)
    if (seenRecord) {
      return seenRecord.seenSample
    }


    sampleObj = crawlInheritedProperties({ objData, parentKey, nestedLevel: nestedLevel, filteringOptions }) ?? {}

    for (const key of Object.keys(objData.properties || {})) {

      if (filteringOptions.excludeNotRequired) {
        if (!Array.isArray(objData.required) || !objData.required.includes(key)) {
          continue
        }
      }
      const oData = resolveSchemaObjectFields(objData.properties[key])

      if (filteringOptions.excludeReadonly && oData.readOnly) {
        continue
      }

      const oDataType = resolveSchemaType(oData.type)

      if (oDataType === 'array' || oDataType === 'object' || oData.allOf) {
        if (oDataType === 'array') {
          // if it's an array of objects, we'll generate the sample array item by crawling again
          // else, if there's no inherited fields, we'll generate the sample array item using extractSampleForParam
          sampleObj[key] =
            oData.itemType === 'object'
              ? [doCrawl({
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
        } else if (oDataType === 'object' || oData.allOf) {
          const res = doCrawl({ objData: oData || {}, parentKey: key, nestedLevel: nestedLevel + 1, filteringOptions })
          if (res !== null) {
            sampleObj[key] = res
          }
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
    }

    /*
      now, as we have sampleObj for objData extracted, we store it in the WeakMap for future child objects to use
    */
    seen.set(objData, { sampleObj, parentKey })
    return sampleObj
  }

  return doCrawl({ objData, parentKey, nestedLevel, filteringOptions })
}

