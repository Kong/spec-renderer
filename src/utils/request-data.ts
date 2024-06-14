import type { IHttpOperation, IHttpPathParam, IHttpQueryParam } from '@stoplight/types'

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
 * Extract sample valute from provided params definition (works for params, query and body)
 * @param paramData
 * @returns objct key - field name| value - field sample value
 */
export const extractSample = (paramData: IHttpPathParam[] | IHttpQueryParam[] | undefined): Record<string, any> => {
  const samples = <Record<string, any>>{}

  paramData?.forEach(d => {
    //@ts-ignore there might be undocumented untyped property that holds the example for the specific field
    let exampleValue = d.example
    if (exampleValue) {
      samples[d.name] = exampleValue
      return
    }
    if (d.schema?.examples) {
      //@ts-ignore  we are not sure what type this sucker is
      exampleValue = d.schema?.examples[0]
      if (exampleValue) {
        samples[d.name] = exampleValue
        return
      }
    }
    samples[d.name] = d.name
  })
  return samples
}

/**
 * Generates sample path based on schema parameters
 * @param data
 * @returns
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
 * @param data Generates query from query data and user inputs
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