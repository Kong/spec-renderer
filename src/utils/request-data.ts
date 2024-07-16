import type { IHttpOperation } from '@stoplight/types'
import { crawl, extractSampleForParam } from './schema-example'
import { CODE_INDENT_SPACES } from '@/constants'

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
      return JSON.stringify(data.request.body.contents[0].examples[sampleIdx].value as Record<string, any>, null, CODE_INDENT_SPACES)
    }
  }

  return JSON.stringify(
    crawl({
      objData: data.request.body.contents[0].schema as Record<string, any>,
      parentKey: '',
      nestedLevel: 0,
      filteringOptions,
    }),
    null,
    CODE_INDENT_SPACES,
  )
}
