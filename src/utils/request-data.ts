import type { IHttpOperation, IMediaTypeContent } from '@stoplight/types'
import { crawl, extractSampleForParam } from './schema-example'
import { resolveSchemaObjectFields, resolveSchemaType } from './schema-model'
import { maskBodyExample } from './sensitive-data-masking'
import { CODE_INDENT_SPACES } from '@/constants'
import { safeJSONParse } from './strings'
import formurlencoded from 'form-urlencoded'
import type { RequestBody, RequestFormField } from '@/types'

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
    value: data.request?.body?.contents?.[0]?.mediaType ??
      data.responses?.[0]?.contents?.[0]?.mediaType ?? 'application/json',
  })
  return headers
}

/**
 * Returns true if the param has an example or default value provided in the spec.
 * Used to decide whether to pre-populate the Try-It form for optional params.
 *
 * @param param the parameter object to check for examples/defaults
 * @returns true if the parameter has an example or default value explicitly defined, false otherwise
 */
const hasExplicitExample = (param: unknown): boolean => {
  if (typeof param !== 'object' || param === null) return false
  const p = param as Record<string, any>
  return p.example !== undefined ||
    (Array.isArray(p.examples) && p.examples.length > 0) ||
    p.schema?.example !== undefined ||
    (Array.isArray(p.schema?.examples) && p.schema.examples.length > 0) ||
    p.default !== undefined ||
    p.schema?.default !== undefined
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

  for (const [key, param] of Object.entries(paramData)) {
    // only generate an example value if the param is either required, or has an explicit example/default value set
    // so that we avoid generating examples for optional params without examples
    if (param?.required || hasExplicitExample(param)) {
      const paramName = param?.name || key
      samples[paramName] = extractSampleForParam(param, paramName)
    }
  }
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
export const getSampleQuery = (data: IHttpOperation, fieldValues?: Record<string, string | null | undefined> | undefined): string => {

  const myFieldValues = fieldValues || extractSample(data.request?.query) || {}
  const urlParams = new URLSearchParams()

  Object.keys(myFieldValues).forEach(key => {
    const isRequired = data.request?.query?.find(r => r.name === key)?.required
    const value = myFieldValues[key]
    if (value !== null && value !== undefined && (isRequired || value !== '')) {
      urlParams.append(key, value)
    }
  })

  return urlParams.toString()
}

export const getSampleHeaders = ({ data, fieldValues, excludeHeaderList }: { data: IHttpOperation, fieldValues?: Record<string, string> | undefined, excludeHeaderList?: string[] }): Array<Record<string, string>> => {
  const myFieldValues = fieldValues || {}
  const headers: Array<Record<string, string>> = []

  data.request?.headers?.forEach(header => {
    if (excludeHeaderList?.includes(header.name)) {
      return
    }

    const headerName = header.name
    const headerValue = myFieldValues[headerName] ?? extractSampleForParam(header, headerName)
    if (headerValue) {
      headers.push({
        name: headerName,
        value: String(headerValue),
      })
    }
  })

  return headers
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
export const getSampleBody = (contents: IMediaTypeContent[], filteringOptions: Record<string, boolean> = { excludeReadonly: true, excludeNotRequired: false }, sampleIdx: number = 0, skipMasking: boolean = false): string => {
  if (!contents.length || !contents[0]) {
    return ''
  }
  if (sampleIdx !== undefined) {
    if (Array.isArray(contents[0].examples) &&
      // @ts-ignore value is valid property of example
      contents[0].examples[sampleIdx]?.value
    ) {
      // @ts-ignore value is valid property of example
      const exampleValue = safeJSONParse(contents[0].examples[sampleIdx].value)
      const maskedValue = skipMasking
        ? exampleValue
        : maskBodyExample(exampleValue, resolveSchemaObjectFields(contents[0].schema) as Record<string, any>)
      return JSON.stringify(maskedValue as Record<string, any>, null, CODE_INDENT_SPACES)
    }
  }

  const isArraySchema = resolveSchemaType(contents[0].schema?.type) === 'array'
  // Pass skipMasking into filteringOptions so doCrawl() can read it via filteringOptions.skipMasking
  const sample = crawl({
    objData: resolveSchemaObjectFields(contents[0].schema) as Record<string, any>,
    filteringOptions: { ...filteringOptions, skipMasking },
  })
  return JSON.stringify(isArraySchema && !Array.isArray(sample) ? [sample] : sample, null, CODE_INDENT_SPACES)
}

/**
 * Generates the per-field form-data model for a `multipart/form-data` media type, so a
 * multipart body can be edited as individual named fields (text/file/JSON) instead of a single
 * JSON blob.
 *
 * @param content the active `multipart/form-data` media type entry
 * @param filteringOptions indicates what to exclude (readonly fields, non-required fields)
 * @returns one RequestFormField per schema property
 *
 * @example
 * // schema: { type: 'object', required: ['avatar'], properties: { avatar: { type: 'string', format: 'binary' } } }
 * // => [{ name: 'avatar', kind: 'file', required: true }]
 */
export const getSampleFormFields = (
  content: IMediaTypeContent,
  filteringOptions: Record<string, boolean> = { excludeReadonly: true, excludeNotRequired: false },
): RequestFormField[] => {
  const schema = resolveSchemaObjectFields(content.schema)
  const requiredList = Array.isArray(schema.required) ? schema.required : []

  return Object.entries(schema.properties ?? {}).reduce<RequestFormField[]>((fields, [name, rawProp]) => {
    const prop = resolveSchemaObjectFields(rawProp)
    const required = requiredList.includes(name)

    if (filteringOptions.excludeNotRequired && !required) {
      return fields
    }
    if (filteringOptions.excludeReadonly && prop.readOnly) {
      return fields
    }

    const propType = resolveSchemaType(prop.type)
    const isBinary = prop.format === 'binary' || !!prop.contentMediaType
    const encoding = content.encodings?.find(e => e.property === name)

    const field: RequestFormField = { name, kind: 'text', required }

    if (isBinary) {
      field.kind = 'file'
      if (propType === 'array') {
        field.multiple = true
      }
    } else if (propType === 'object' || propType === 'array') {
      const sample = crawl({ objData: prop as Record<string, any>, filteringOptions })
      field.kind = 'json'
      field.value = JSON.stringify(propType === 'array' && !Array.isArray(sample) ? [sample] : sample, null, CODE_INDENT_SPACES)
    } else {
      field.value = String(extractSampleForParam(prop, name))
    }

    if (prop.description) {
      field.description = prop.description
    }
    if (encoding?.mediaType) {
      field.contentType = encoding.mediaType
    } else if (field.kind === 'json') {
      field.contentType = 'application/json'
    }

    fields.push(field)
    return fields
  }, [])
}

export interface MultipartFormPart {
  kind: 'text' | 'file' | 'json'
  name: string
  value?: string
  file?: File
  contentType?: string
}

/**
 * Flattens a multipart form-data field list into one entry per actual part - a `file` field with
 * multiple files becomes one entry per file, since neither FormData nor HAR params can represent
 * "one field, many files" as a single entry, applying the same kind-specific defaults (e.g. json
 * fields default to an empty value and `application/json`) needed to build both the live FormData
 * request in "Try It" and the code snippet params in request sample.
 *
 * @example
 * flattenMultipartFields([{ name: 'attachments', kind: 'file', files: [fileA, fileB] }])
 * // => [{ kind: 'file', name: 'attachments', file: fileA }, { kind: 'file', name: 'attachments', file: fileB }]
 */
export const flattenMultipartFields = (formFields: RequestFormField[] = []): MultipartFormPart[] => {
  const parts: MultipartFormPart[] = []
  formFields.forEach(field => {
    if (field.kind === 'file') {
      field.files?.forEach(file => parts.push({ kind: 'file', name: field.name, file, contentType: field.contentType }))
    } else if (field.kind === 'json') {
      parts.push({ kind: 'json', name: field.name, value: field.value ?? '', contentType: field.contentType ?? 'application/json' })
    } else if (field.value !== undefined) {
      parts.push({ kind: 'text', name: field.name, value: field.value })
    }
  })
  return parts
}

/**
 * reformat body based on content-type header, for non-binary body
 * @param headers
 * @param body
 * @returns
 */
export const getFormattedBody = (headers: Record<string, string>, body: RequestBody): { body: string | null | undefined, contentType: string | undefined } => {
  let contentType:string = ''
  for (const [key, value] of Object.entries(headers || {})) {
    if (key.toLowerCase() === 'content-type') {
      contentType = value
    }
  }

  if (!body || body.isBinary || body.isMultipart) {
    return { body: null, contentType }
  }

  if (body.content && contentType === 'application/x-www-form-urlencoded') {
    return { body: formurlencoded(safeJSONParse(body.content as string)), contentType }
  }

  return { body: body.content as string, contentType }
}

