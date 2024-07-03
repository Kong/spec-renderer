import type { IHttpOperation } from '@stoplight/types'
import { MAX_NESTED_LEVELS } from '@/constants'

const getAcceptHeader = (data: IHttpOperation): string => {
  const headers = new Set()
  data.responses?.forEach(response => {
    (response.contents || []).forEach(content => {
      headers.add(content.mediaType)
    })
  })
  return [...headers].join(', ')
}

export const getRequestHeaders = (data: IHttpOperation):Array<Record<string, string>> => {
  const headers = []
  const acceptHeader = getAcceptHeader(data)
  if (acceptHeader) {
    headers.push({
      name: 'Accept',
      value: acceptHeader,
    })
  }
  headers.push({
    name: 'Content-Type',
    value: data.responses?.[0]?.contents?.[0]?.mediaType ?? 'application/json',
  })
  return headers
}

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
  if (paramData.type === 'boolean') {
    return false
  }

  if (paramData.default !== undefined) {
    return typeof paramData.default === 'object' ? JSON.stringify(paramData.default) : paramData.default
  }

  if (paramData.type === 'string') {
    return key
  }
  return ''
}


/**
 * Extract sample value from provided params definition (works for params, query)
 * @param paramData operation parameter data
 * @returns object key - field name| value - field sample value
 */
export const extractSample = (paramData: Record<string, any> | undefined): Record<string, any> => {
  const samples = <Record<string, any>>{}
  if (!paramData) {
    return {}
  }

  Object.keys(paramData).forEach((key) => {
    samples[paramData[key]?.name || key] = extractSampleForParam(paramData[key], key)
  })
  return samples
}

/**
 * Generates sample path based on schema parameters
 *
 * @param data  operation data
 * @param fieldValues user inputs
 * @returns path string
 */
export const getSamplePath = (data: IHttpOperation, fieldValues?: Record<string, string> | undefined) : string => {
  if (!data.path) {
    return ''
  }

  if (!data.request?.path) {
    return data.path.replaceAll('{', '').replaceAll('}', '')
  }
  const myFieldValues = fieldValues || extractSample(data.request?.path) || {}
  let newPath = data.path

  Object.keys(myFieldValues).forEach(key => {
    const fieldValue = myFieldValues[key]
    newPath = newPath.replaceAll(`{${key}}`, fieldValue)
  })
  return newPath.replaceAll('{', '').replaceAll('}', '')
}

/**
 * Generates query from query data and user inputs
 *
 * @param data  operation data
 * @param fieldValues user inputs
 * @returns query string
 */
export const getSampleQuery = (data: IHttpOperation, fieldValues?: Record<string, string> | undefined): string => {

  const myFieldValues = fieldValues || extractSample(data.request?.query) || {}
  const urlParams = new URLSearchParams()

  Object.keys(myFieldValues).forEach(key => {
    urlParams.append(key, myFieldValues[key])
  })

  return urlParams.toString()
}

/**
 * Generates body from data and user inputs
 *
 * @param data  operation data
 * @param sampleBody body example extracted from data
 * @param filteringOptions indicates what to exclude
 * @param sampleIdx index of example to be used
 * @returns query string
 */
export const getSampleBody = (data: IHttpOperation, filteringOptions: Record<string, boolean> = { excludeReadonly: true, excludeNotRequired: false }, sampleIdx: number = 0): string => {
  if (!data.request?.body?.contents?.length || !data.request.body.contents[0]) {
    return ''
  }
  if (sampleIdx !== undefined) {
    if (Array.isArray(data.request.body.contents[0].examples) &&
      // @ts-ignore value is valid property of example
      data.request.body.contents[0].examples[sampleIdx]?.value
    ) {
      // @ts-ignore value is valid property of example
      return JSON.stringify(data.request.body.contents[0].examples[sampleIdx].value as Record<string, any>, null, 2)
    }
  }

  // now we do not have examples for entire body, let's try to build sample object here
  // to avoid circular references we will dig 10 levels deep , no more
  const crawl = (objData: Record<string, any>, parentKey: string, nestedLevel: number): Record<string, any> | null => {

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
          ...sampleObj, ...crawl(objData.allOf[i], `allOf-${i}`, nestedLevel) }
      }
      return sampleObj
    }
    Object.keys(objData.properties || {}).forEach((key: string) => {
      const oData = objData.properties[key]
      if (filteringOptions.excludeReadonly && oData.readOnly) {
        return
      }
      if (oData.anyOf && Array.isArray(oData.anyOf) && oData.anyOf.length) {
        sampleObj[key] = crawl(oData.anyOf[0] || {}, key, nestedLevel)
      } else if (oData.type === 'object' || oData.allOf) {
        const res = crawl(oData || {}, key, nestedLevel++)
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

  return JSON.stringify(crawl((data.request.body.contents[0].schema) as Record<string, any>, '', 0), null, 2)
}

/**
 * Returns true if body of operation has at least one required field
 * @param data operation
 */
