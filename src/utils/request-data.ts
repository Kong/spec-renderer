import type { IHttpOperation } from '@stoplight/types'

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
    samples[key] = extractSampleForParam(paramData[key], key)
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
 * @returns query string
 */
export const getSampleBody = (data: IHttpOperation, sampleIdx?: number): string => {

  if (!data.request?.body?.contents?.length || !data.request.body.contents[0]) {
    return ''
  }
  if (sampleIdx !== undefined) {
    if (Array.isArray(data.request.body.contents[0].examples) &&
      sampleIdx < data.request.body.contents[0].examples.length) {
      // @ts-ignore value is valid property of example
      return JSON.stringify(data.request.body.contents[0].examples[sampleIdx].value as Record<string, any>, null, 2)
    }
  }

  // now we do not have examples for entire body, let's try to build sample object here
  // to avoid circular references we will dig 10 levels deep , no more
  const crawl = (objData: Record<string, any>, parentKey: string, nestedLevel: number): Record<string, any> => {

    const sampleObj = <Record<string, any>>{}

    if (nestedLevel > 10) {
      sampleObj[parentKey] = extractSampleForParam(objData, parentKey)
      return sampleObj
    }
    Object.keys(objData).forEach((key: string) => {
      if (objData[key].anyOf && Array.isArray(objData[key].anyOf) && objData[key].anyOf.length) {
        sampleObj[key] = crawl(objData[key].anyOf[0].properties || {}, key, nestedLevel)
      } else if (objData[key].type === 'object') {
        const props = objData[key].properties || objData[key].additionalProperties
        if (props) {
          sampleObj[key] = crawl(objData[key].properties || {}, key, nestedLevel++)
        }
      } else if (objData[key].type === 'array') {
        sampleObj[key] = [extractSampleForParam(objData[key], key)]
      } else {
        sampleObj[key] = extractSampleForParam(objData[key] , key)
      }
    })

    return sampleObj
  }

  return JSON.stringify(crawl(data.request.body.contents[0].schema?.properties as Record<string, any>, '', 0), null, 2)

}
