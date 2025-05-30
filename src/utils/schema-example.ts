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
//  console.log('extractSampleForParam started', paramData)
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
  fullKey?: string
}

/**
 * now we do not have examples for entire body, let's try to build sample object here
 * to avoid circular references we will dig 10 levels deep , no more
 * @param {CrawlOptions} CrawlOptions
 * @returns {Record<string, any> | null}
 */


export const crawl = ({ objData, parentKey='', nestedLevel=0, filteringOptions, fullKey = ''}: CrawlOptions): Record<string, any> | null => {

  console.log('*** crawl starts', {parentKey, nestedLevel, objData})

  const seen = new WeakMap()
  let nCalls = 0
//  const MAX_CALLS_ALLOWED = 1700


/**
 * util to generate example for inherited fields like allOf, anyOf, oneOf
 *
 * @param {CrawlOptions} CrawlOptions
 * @returns {Record<string, any> | null}
 */
const crawlInheritedProperties = ({ objData, parentKey = '', nestedLevel = 0, fullKey, filteringOptions }: CrawlOptions): Record<string, any> | null => {
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
          fullKey,
          parentKey: `allOf-${i}`,
          nestedLevel,
          filteringOptions,
        }),
      }
    }
    return sampleObj
  }

  if (Array.isArray(objData.anyOf) && typeof(objData.anyOf[0]) === 'object') {
    return doCrawl({ objData: objData.anyOf[0] || {}, parentKey, nestedLevel: nestedLevel + 1, fullKey, filteringOptions })
  } else if (Array.isArray(objData.oneOf) && typeof(objData.oneOf[0]) === 'object') {
    return doCrawl({ objData: objData.oneOf[0] || {}, parentKey, nestedLevel: nestedLevel + 1, fullKey, filteringOptions })
  }

  return null
}
  /**
   * do actual crawl, called recursively
   * @param {CrawlOptions} CrawlOptions
   * @returns {Record<string, any> | null}
  */
  const doCrawl = ({ objData, parentKey = '', nestedLevel = 0, filteringOptions, fullKey = ''}: CrawlOptions): Record<string, any> | null => {
    console.log('--- doCrawl starts', {nCalls, parentKey, nestedLevel, fullKey, objData})
    console.log('seen:', seen)

    let sampleObj = <Record<string, any>>{}

    if (typeof objData === 'undefined') {
      console.log('return due to undefined')
      return sampleObj
    }

    if (objData.example) {
      console.log('got example - returning it:', objData.example)
      return objData.example
    }

    if (filteringOptions.excludeNotRequired && !objData.required ) {
      console.log(' skipping not required')
      return sampleObj
    }


    // if we already parsed the parent key , we do not want to do it again
    // if (parentKey && fullKey.split('/').includes(parentKey)) {
    //   sampleObj[parentKey] = extractSampleForParam(objData, parentKey)
    //   console.log('parent key already processed, returning: ', sampleObj)
    //   return sampleObj
    // }

    fullKey = parentKey ? (fullKey ? `${fullKey}/` : '') + parentKey : fullKey
    const fullKeyArray = fullKey.split('/')
    if (nestedLevel >= MAX_NESTED_LEVELS ) {
      console.log(' we reached MAX_NESTED_LEVELS, so we do not go more')
      sampleObj[parentKey] =  extractSampleForParam(objData, parentKey)
      return sampleObj
    }
    const seenRecord = seen.get(objData)
    if (seenRecord) {
      console.log('*** objData already processed', objData, seenRecord)
      return seenRecord.seenSample
    }


    // if (nCalls++ > MAX_CALLS_ALLOWED) {
    //   console.log('too many calls, returning', nCalls)
    //   return sampleObj
    // }

    sampleObj = crawlInheritedProperties({ objData, parentKey, nestedLevel: nestedLevel, fullKey, filteringOptions }) ?? {}

    for (const key of Object.keys(objData.properties || {})) {
//      console.log('  looking at properties key: ', {key, nestedLevel, parentFullKey: fullKey})

      if (filteringOptions.excludeNotRequired) {
        if (!Array.isArray(objData.required) || !objData.required.includes(key)) {
          continue
        }
      }
      const oData = resolveSchemaObjectFields(objData.properties[key])

      if (filteringOptions.excludeReadonly && oData.readOnly) {
        continue
      }

      // if (nestedLevel == MAX_NESTED_LEVELS - 1 ) {
      //   //console.log(' while in props we almost reached max nested level', nestedLevel)
      //   sampleObj[key] =  extractSampleForParam(oData, key)
      //   continue
      // }

      // if (nCalls > MAX_CALLS_ALLOWED) {
      //   //console.log('  in props, too many calls, returning', nCalls)
      //   //sampleObj[key] =  extractSampleForParam(oData, key)
      //   continue
      // }

      // if (fullKeyArray.includes(key)) {
      //   // console.log(`  properties key ${key} already processed`)
      //   //sampleObj[key] =  extractSampleForParam(oData, key)
      //   continue
      // }

      const oDataType = resolveSchemaType(oData.type)
      //console.log('  dataType: ', oDataType)

      if (oDataType === 'array' || oDataType === 'object' || oData.allOf) {
        if (oDataType === 'array') {
          // if it's an array of objects, we'll generate the sample array item by crawling again
          // else, if there's no inherited fields, we'll generate the sample array item using extractSampleForParam
          sampleObj[key] =
            oData.itemType === 'object'
              ? [doCrawl({
                objData: oData || {},
                parentKey: key,
                fullKey,
                nestedLevel: nestedLevel + 1,
                filteringOptions,
              })]
              : [crawlInheritedProperties({
                objData: oData,
                parentKey: key,
                fullKey,
                nestedLevel: nestedLevel + 1,
                filteringOptions,
              }) ?? extractSampleForParam(oData, key)]
        } else if (oDataType === 'object' || oData.allOf) {
          const res = doCrawl({ objData: oData || {}, parentKey: key, nestedLevel: nestedLevel + 1, fullKey, filteringOptions })
          if (res !== null) {
            sampleObj[key] = res
          }
      }
      } else {
        //console.log('   non object detected', oData)
        sampleObj[key] =
          crawlInheritedProperties({
            objData: oData,
            parentKey: key,
            fullKey,
            nestedLevel: nestedLevel + 1,
            filteringOptions,
          }) ?? extractSampleForParam(oData, key)
      }
    }
    console.log('  -- doCrawl returns: ', sampleObj)
    seen.set(objData, {sampleObj, fullKey, parentKey})
    return sampleObj
  }

  const finalRes =  doCrawl({ objData, parentKey, nestedLevel, filteringOptions})
  console.log("seen:", seen)
  console.log('*** crawl returns: ', finalRes)
  return finalRes
}

