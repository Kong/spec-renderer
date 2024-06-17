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
 * Extract sample value from provided params definition (works for params, query and body)
 * @param paramData operation parameter data
 * @returns objct key - field name| value - field sample value
 */
export const extractSample = (paramData: Record<string, any> | undefined): Record<string, any> => {
  const samples = <Record<string, any>>{}
  if (!paramData) {
    return {}
  }

  Object.keys(paramData).forEach((key) => {
    const d = paramData[key]
    let exampleValue = d.example
    if (exampleValue !== undefined) {
      samples[key] = exampleValue
      return
    }

    if (d.schema?.examples) {
      exampleValue = d.schema?.examples[0]
      if (exampleValue !== undefined) {
        samples[key] = exampleValue
        return
      }
    }

    if (d.examples) {
      exampleValue = d.examples[0]
      if (exampleValue !== undefined) {
        samples[key] = exampleValue
        return
      }
    }
    if (d.default !== undefined) {
      samples[key] = typeof d.default === 'object' ? JSON.stringify(d.default) : d.default
      return
    }

    if (paramData[key].type === 'string') {
      samples[key] = key
    }
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
 * @param fieldValues user inputs
 * @returns query string
 */
export const getSampleBody = (data: IHttpOperation, fieldValues?: Record<string, string> | undefined): Record<string, any> => {

  const myFieldValues = fieldValues || extractSample(data.request?.query) || {}
  const urlParams = new URLSearchParams()

  Object.keys(myFieldValues).forEach(key => {
    urlParams.append(key, myFieldValues[key])
  })

  return {}
}
