import { MAX_NESTED_LEVELS } from '@/constants'
import { resolveSchemaObjectFields, resolveSchemaType } from './schema-model'
import { applyMask } from './sensitive-data-masking'
import { OAS_EXT_SENSITIVE_DATA } from '@/oas-extensions'
import type { XSensitiveData } from '@/types'

/**
 * util to extract example value from a given example, as example can be a primitive value or an object with value field
 *
 * @param example The example to extract value from
 * @returns The extracted example value
 */
const extractExampleValue = (example: any): any => {
  if (example !== null && typeof example === 'object' && Object.hasOwn(example, 'value')) {
    return example.value
  }
  return example
}

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
    exampleValue = extractExampleValue(exampleValue)
    return exampleValue
  }

  if (paramData.schema?.examples) {
    exampleValue = paramData.schema?.examples[0]
    exampleValue = extractExampleValue(exampleValue)
    if (exampleValue !== undefined && exampleValue !== null) {
      return exampleValue
    }
  }

  if (paramData.schema?.example) {
    exampleValue = paramData.schema?.example
    exampleValue = extractExampleValue(exampleValue)
    if (exampleValue !== undefined && exampleValue !== null) {
      return exampleValue
    }
  }

  if (paramData.examples) {
    exampleValue = paramData.examples[0]
    exampleValue = extractExampleValue(exampleValue)
    if (exampleValue !== undefined && exampleValue !== null) {
      return exampleValue
    }
  }

  if (paramData.enum) {
    return paramData.enum[0]
  }

  if (paramData.default !== null && paramData.default !== undefined) {
    return typeof paramData.default === 'object' ? JSON.stringify(paramData.default) : paramData.default
  }

  if (paramData.schema?.default !== null && paramData.schema?.default !== undefined) {
    return typeof paramData.schema.default === 'object' ? JSON.stringify(paramData.schema.default) : paramData.schema.default
  }

  switch (resolveSchemaType(paramData.type ?? paramData.schema?.type)) {
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
  /**
   * Identity to memoize this call's result under, if different from objData. Use the raw,
   * pre-resolve property: resolveSchemaObjectFields copies array/allOf schemas on every call,
   * so memoizing under its output would never hit on a repeat visit. Omit when objData is
   * already raw (e.g. the top-level call, or an allOf member).
   */
  memoKey?: Record<string, any>
}

/**
 * now we do not have examples for entire body, let's try to build sample object here
 * to avoid circular references we will dig 10 levels deep , no more
 * @param {CrawlOptions} CrawlOptions
 * @returns {Record<string, any> | null}
 */


export const crawl = ({ objData, parentKey = '', nestedLevel = 0, filteringOptions }: CrawlOptions): Record<string, any> | null => {

  /*
    Memoizes sampleObj by object identity so a schema reused by reference isn't re-extracted.
    Keyed on nestedLevel too: MAX_NESTED_LEVELS truncation is depth-dependent, so a memo from
    one depth must never be reused at a different depth for the same schema.
  */
  const seen = new WeakMap<Record<string, any>, Map<number, Record<string, any>>>()

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
  const doCrawl = ({ objData, parentKey = '', nestedLevel = 0, filteringOptions, memoKey }: CrawlOptions): Record<string, any> | null => {

    let sampleObj = <Record<string, any>>{}

    if (typeof objData === 'undefined') {
      return sampleObj
    }

    if (objData.example) {
      return objData.example
    }
    if (Array.isArray(objData.examples) && objData.examples.length > 0 && objData.examples[0]) {
      return objData.examples[0]
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
    const seenSample = seen.get(memoKey ?? objData)?.get(nestedLevel)
    if (seenSample) {
      return seenSample
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
          // if the array property itself has a default value, use it as-is rather than
          // synthesizing an item example, since the default already represents the whole array
          if (Array.isArray(oData.default)) {
            sampleObj[key] = oData.default
          } else {
            // if it's an array of objects, we'll generate the sample array item by crawling again
            // else, if there's no inherited fields, we'll generate the sample array item using extractSampleForParam
            const exampleArrayItem = oData.itemType === 'object'
              ? doCrawl({
                objData: oData || {},
                parentKey: key,
                nestedLevel: nestedLevel + 1,
                filteringOptions,
                memoKey: objData.properties[key],
              })
              : crawlInheritedProperties({
                objData: oData,
                parentKey: key,
                nestedLevel: nestedLevel + 1,
                filteringOptions,
              }) ?? extractSampleForParam(oData, key)
            // if the exampleArrayItem is itself an array then we don't need to wrap it in an array.
            // extractSampleForParam falls back to the literal '[]' when the item has no example/default/enum
            // of its own (oData.type here is always 'array', the property's own type) - in that case there's
            // no real item to show, so render an empty array rather than wrapping the fallback string.
            sampleObj[key] = Array.isArray(exampleArrayItem)
              ? exampleArrayItem
              : exampleArrayItem === '[]' ? [] : [exampleArrayItem]
          }
        } else if (oDataType === 'object' || oData.allOf) {
          const res = doCrawl({ objData: oData || {}, parentKey: key, nestedLevel: nestedLevel + 1, filteringOptions, memoKey: objData.properties[key] })
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

      if (!filteringOptions.skipMasking) {
        const sensitiveConfig = oData[OAS_EXT_SENSITIVE_DATA] as XSensitiveData | undefined
        if (sensitiveConfig) {
          if (sensitiveConfig.mask === 'remove') {
            delete sampleObj[key]
          } else if (Object.prototype.hasOwnProperty.call(sampleObj, key)) {
            sampleObj[key] = applyMask(sampleObj[key], sensitiveConfig)
          }
        }
      }
    }

    /*
      now, as we have sampleObj for objData extracted, we store it in the WeakMap for future child objects to use
    */
    const identity = memoKey ?? objData
    if (!seen.has(identity)) {
      seen.set(identity, new Map())
    }
    seen.get(identity)!.set(nestedLevel, sampleObj)
    return sampleObj
  }

  return doCrawl({ objData, parentKey, nestedLevel, filteringOptions })
}

