import { ref } from 'vue'
import type { Ref } from 'vue'
import { computeAPITree, transformOasToServiceNode } from '@/stoplight/elements'
import type { ServiceNode, ParseOptions } from '@/types'
import { parse as parseYaml, safeStringify } from '@stoplight/yaml'
import type { TableOfContentsItem } from '@/stoplight/elements-core'
import refParser from '@apidevtools/json-schema-ref-parser'
import { isLocalRef } from '@stoplight/json'
import { stringify } from 'flatted'
import { transform as transformAsync } from '@/utils/async-to-oas-transformer'
import { isSsr } from '@/utils/ssr'
import { kebabCase } from '@/utils/strings'
import type { IOauth2SecurityScheme, IOauthFlowObjects as OriginalIOauthFlowObjects, IOauth2ClientCredentialsFlow } from '@stoplight/types'

// Extend IOauthFlowObjects to allow string indexing
type IOauthFlowObjects = OriginalIOauthFlowObjects & {
  [key: string]: OriginalIOauthFlowObjects[keyof OriginalIOauthFlowObjects]
}

/**
 * The request-local result of a parse call.
 *
 * The parse functions also assign the composable's `parsedDocument` / `tableOfContents`
 * refs for backward compatibility, but under concurrent SSR those shared refs can be
 * overwritten by an interleaved parse. Prefer reading these returned values, which are
 * guaranteed to belong to this specific call.
 */
export interface ParseResult {
  /** The parsed service node for this call (or its web-component-safe stringified form), or `undefined` when parsing failed. */
  parsedDocument: ServiceNode | string | undefined
  /** The table of contents computed for this call (or its stringified form), or `undefined` when parsing failed. */
  tableOfContents: TableOfContentsItem[] | string | undefined
}

const trace = (doTrace: boolean | undefined, ...args: any) => {
  if (doTrace) {
    console.log(...args)
  }
}

let asyncParser:any = null

/**
 * Raw text content from the spec file provided to the spec-renderer.
 * Don't need it to be reactive
 */
let specText = ''
let specTitle = ''

export default (): {
  parseSpecDocument: (spec: string, options?: ParseOptions) => Promise<ParseResult>
  parseOpenApiSpecDocument: (spec: string, options?: ParseOptions) => Promise<ParseResult>
  parseAsyncApiSpecDocument: (spec: string, options?: ParseOptions) => Promise<ParseResult>
  downloadSpecFile: (format?: 'json' | 'yaml', content?: string) => Promise<void>
  parsedDocument: Ref<ServiceNode | string | undefined>
  tableOfContents: Ref<TableOfContentsItem[] | string | undefined>
} => {

  const parsedDocument = ref<ServiceNode | string | undefined>()

  const tableOfContents = ref<TableOfContentsItem[] | undefined>()

  function tryParseYamlOrObject(yamlOrObject: unknown): Record<string, unknown> | undefined {
    if (typeof yamlOrObject === 'object' && yamlOrObject !== null) return <Record<string, unknown>>yamlOrObject
    if (typeof yamlOrObject === 'string') {
      if (yamlOrObject.startsWith('{')) {
        try {
          return JSON.parse(yamlOrObject)
        } catch (e) {
          console.error('@kong/spec-renderer: in parseJSSON:', e)
        }
      } else {
        try {
          return parseYaml(yamlOrObject)
        } catch (e) {
          console.error('@kong/spec-renderer: in parseYaml:', e)
        }
      }
    }

    return undefined
  }

  /*
    This is for the case when we point to the reference, and reference block
    doesn't have title. In this case we want to use 'key' (last element of the path) as a title,
    so our UI representation of the referenced object is more meaningful
  / */
  const titleResolve = (json: Record<string, any>): Record<string, any> => {

    const refsSet = new Set()
    const fragmentsSet = new Set()

    const deepGet = (obj: Record<string, any>, keys: string[]) => keys.reduce((xs, x) => xs?.[x] ?? null, obj)
    const doResolve = (fragment: Record<string, any>, parentKey: string = ''): Record<string, any> => {
      Object.keys(fragment).forEach(key => {
        try {
          if (!refsSet.has(fragment[key]) && !fragmentsSet.has(fragment[key])) {
            if (typeof fragment[key] === 'object' && fragment[key] !== null) {
              fragmentsSet.add(fragment[key])
              fragment[key] = doResolve(fragment[key], parentKey + '/' + key)
            } else if (fragment[key] && isLocalRef(fragment[key])) {
              const resolvedRef = deepGet(json, fragment[key].replace('#/', '').split('/'))
              if (resolvedRef && typeof(resolvedRef) === 'object') {
                resolvedRef.title = resolvedRef.title || fragment[key].split('/').pop()
              }
              refsSet.add(fragment[key])
            }
          }
        } catch (err) {
          console.warn('@kong/spec-renderer: Issue in titleResolve:', err)
        }
      })
      return fragment
    }
    const ret = doResolve(json)
    return ret
  }


  const parseAsyncApiSpecDocument = async (spec: string, options: ParseOptions = <ParseOptions>{}): Promise<ParseResult> => {

    if (!asyncParser) {
      const AsyncParser:any = await import('@asyncapi/parser/browser')
      const OpenAPISchemaParser:any = await import('@asyncapi/openapi-schema-parser')
      const AvroSchemaParser: any = await import('@asyncapi/avro-schema-parser')

      asyncParser = new AsyncParser.default()
      asyncParser.registerSchemaParser(OpenAPISchemaParser.default())
      asyncParser.registerSchemaParser(AvroSchemaParser.default())
    }

    let specToParse = spec
    if (options.specUrl && !spec) {
      try {
        specToParse = await (await fetch(options.specUrl)).text()
      } catch (e) {
        console.error(`@kong/spec-renderer: error fetching async document from ${options.specUrl}`, e)
        return { parsedDocument: undefined, tableOfContents: undefined }
      }
      trace(options.traceParsing, 'async document fetched')
    }

    if (!specText) {
      saveSpecText(specToParse)
    }

    let parsed = null
    try {
      const { document/*, diagnostics*/ } = await asyncParser.parse(specToParse)
      if (!document) {
        trace(options.traceParsing, 'async document undefined after parsing')
        return { parsedDocument: undefined, tableOfContents: undefined }
      }
      parsed = document
    } catch (e) {
      console.error('@kong/spec-renderer: error parsing async document', e)
      return { parsedDocument: undefined, tableOfContents: undefined }
    }
    trace(options.traceParsing, 'async document parsed')

    // now as we have document we could create TOC and document
    try {
      const { toc, document: transformed } = transformAsync(parsed, {
        hideSchemas: options?.hideSchemas,
        hideInternal: options?.hideInternal,
        hideDeprecated: options?.hideDeprecated,
        currentPath: options?.currentPath,
      })

      trace(options.traceParsing, 'async document transformed')
      // `toc` / `transformed` are request-local; assign the shared refs for backward
      // compatibility, then return the locals so concurrent callers each get their own result.
      tableOfContents.value = toc
      parsedDocument.value = transformed
      return { parsedDocument: transformed, tableOfContents: toc }
    } catch (e) {
      console.error('@kong/spec-renderer: error transforming async document', e)
      return { parsedDocument: undefined, tableOfContents: undefined }
    }
  }

  /**
    Parsing spec (sepcText) or by URL produced in  ParseOptions
  */

  const fetchAndBundle = async (spec: string, options: ParseOptions = <ParseOptions>{}): Promise<Record<string, any> | undefined> => {
    let json: Record<string, any> | undefined
    // if we have URL passed, but no spec, we call bundle to fetch and resolve external refs
    if (options.specUrl && !spec) {
      // fetches spec by URL provided and resolves all external references
      json = await refParser.bundle(options.specUrl, {
        resolve: {
          file: false,
          external: true,
          http: {
            timeout: 2000,
            withCredentials: options.withCredentials,
          },
        },
        dereference: {
          circular: true,
        },
        continueOnError: true,
      }) as Record<string, any> | undefined
      trace(options.traceParsing, 'fetched and external referenced bundled')
    } else {
      // if we have string holding spec content, we try to convert it to json obect (from json string or yaml)
      json = tryParseYamlOrObject(spec)
      trace(options.traceParsing, 'parsed from string')
    }

    // save the spec title to be used as file name for the downloaded spec file
    specTitle = json?.info?.title
    // Return the parsed document rather than writing the shared `jsonDocument` ref, so
    // callers can thread it through request-local state (see parseOpenApiSpecDocument).
    return json
  }
  /**
   * @param preBundledJson Internal use only: a document already fetched/bundled by
   *   `parseSpecDocument`, passed through to avoid a second bundle. External callers never pass it.
   */
  const parseOpenApiSpecDocument = async (spec: string, options: ParseOptions = <ParseOptions>{}, preBundledJson?: Record<string, any>): Promise<ParseResult> => {

    await saveSpecText(spec, options.specUrl)

    // Request-local working document. We ALWAYS (re)bundle the provided spec — unless our own
    // `parseSpecDocument` already did and handed us the result via `preBundledJson` — and never
    // read the shared module `jsonDocument` ref as a cache. That makes the parse fail-safe: an
    // omitted `enforceResetBeforeParsing` can never cause a prior request's document to be
    // returned for this spec. (The flag is retained for backward compatibility and is now a no-op;
    // every parse resets.)
    let localJson: Record<string, any> | undefined = preBundledJson ?? await fetchAndBundle(spec, options)
    if (!localJson) {
      // was it even a spec or even something that could be converted to json?
      console.error('@kong/spec-renderer: empty jsonDocument initial processing')
      return { parsedDocument: undefined, tableOfContents: undefined }
    }

    trace(options.traceParsing, 'json document available')

    // TODO: let's see if we can detect some validation errors here

    // resolve the titles for internal refs
    localJson = titleResolve(localJson)

    trace(options.traceParsing, 'title resolved')

    try {
      // resolve the internal refs
      localJson = await refParser.dereference(localJson, {
        continueOnError: true,
        dereference: {
          circular: true,
        },
        external: false,
        resolve: {
          file: false,
          // http references resolved during bundle call above
          http: false,
        },
      }) as Record<string, any>
    } catch (err) {
      console.error('@kong/spec-renderer: error dereferencing:', err)
    }

    trace(options.traceParsing, 'dereferenced')


    // it was not async, let's try openAPI
    let localParsed: ServiceNode | string | undefined
    try {
      // convert to AST for ui layer to use
      localParsed = transformOasToServiceNode(localJson)
    } catch (err) {
      console.error('@kong/spec-renderer: error in transformOasToServiceNode:', err)
    }

    const fixSecurityScopes = () => {
      if (localJson?.components?.securitySchemes) {
        for (const [key, scheme] of Object.entries(localJson.components.securitySchemes)) {
          for (const [keyFlow, flow] of Object.entries((scheme as IOauth2SecurityScheme).flows || {})) {
            if (flow.scopes) {
              const destSchema: IOauth2SecurityScheme | undefined = (localParsed as ServiceNode)?.data?.securitySchemes?.find(s => s.key === key) as IOauth2SecurityScheme
              if ((destSchema?.flows as IOauthFlowObjects)?.[keyFlow]?.scopes) {
                ((destSchema.flows as IOauthFlowObjects)[keyFlow] as IOauth2ClientCredentialsFlow).scopes = flow.scopes
              }
              // loop trough all security schemes and upate flows with scopes
              for (const destSecurity of (localParsed as ServiceNode)?.data?.security || []) {
                const dS = destSecurity.find(s => s.key === key) as IOauth2SecurityScheme
                if ((dS?.flows as IOauthFlowObjects)?.[keyFlow]?.scopes) {
                  ((dS.flows as IOauthFlowObjects)[keyFlow] as IOauth2ClientCredentialsFlow).scopes = flow.scopes
                }
              }
              // loop trough all operations and update security there with scopes
              for (const operation of ((localParsed as ServiceNode)?.children || []).filter((op) => op.type === 'http_operation')) {
                if (operation.data.security) {
                  for (const security of operation.data.security) {
                    const dS = security.find(s => s.key === key) as IOauth2SecurityScheme
                    if ((dS?.flows as IOauthFlowObjects)?.[keyFlow]?.scopes) {
                      ((dS.flows as IOauthFlowObjects)[keyFlow] as IOauth2ClientCredentialsFlow).scopes = flow.scopes
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    // turns out transformOasToServiceNode is not reading scopes of security schemes, so we need to do it manually
    try {
      fixSecurityScopes()
    } catch (err) {
      console.error('@kong/spec-renderer: error in fixSecurityScopes:', err)

    }

    trace(options.traceParsing, 'transformed')

    let localToc: TableOfContentsItem[] | string | undefined
    try {
      if (localParsed) {
        // generate table of contents
        localToc = computeAPITree(<ServiceNode>localParsed, {
          hideSchemas: options?.hideSchemas,
          hideInternal: options?.hideInternal,
          hideDeprecated: options?.hideDeprecated,
          currentPath: options?.currentPath,
        })
      }
    } catch (err) {
      console.error('@kong/spec-renderer: error in computeAPITree:', err)
    }

    if (options.webComponentSafe) {
      try {
        localParsed = stringify(localParsed)
        localToc = stringify(localToc)
      } catch (err) {
        console.error('@kong/spec-renderer: error in stringifying for web-component:', err)
      }
    }

    // Backward compatibility: keep populating the shared refs so existing consumers that read
    // `parsedDocument` / `tableOfContents` keep working for the single-request/client case.
    // The returned values are the concurrency-safe source of truth for SSR consumers.
    parsedDocument.value = localParsed
    // @ts-ignore - localToc may be a `flatted`-stringified TOC in the web-component-safe path
    tableOfContents.value = localToc

    trace(options.traceParsing, 'APITree computed')
    return { parsedDocument: localParsed, tableOfContents: localToc }
  }

  const parseSpecDocument = async (spec: string, options: ParseOptions = <ParseOptions>{}): Promise<ParseResult> => {
    const localJson = await fetchAndBundle(spec, options)

    if (!localJson) {
      // was it even a spec or even something that could be converted to json?
      console.error('@kong/spec-renderer: empty jsonDocument initial processing')
      return { parsedDocument: undefined, tableOfContents: undefined }
    }

    trace(options.traceParsing, 'json document available')

    // at this point we have json schema, so we can look when spec is it and if it is asyc, we call async if not in ssr mode
    // Branch on the request-local document, not the shared ref, to avoid the same cross-request race.
    if (localJson.asyncapi) {
      trace(options.traceParsing, 'asyncapi spec detected')
      return await parseAsyncApiSpecDocument(spec, options)
    } else {
      trace(options.traceParsing, 'openapi spec detected')
      // Hand the already-bundled document to the delegate so it is not fetched/bundled twice.
      return await parseOpenApiSpecDocument(spec, options, localJson)
    }
  }

  /**
   * Persists the spec text so it's available when user wants to download spec file
   *
   * @param spec the raw spec file text
   * @param specUrl URL from where we can fetch the spec in case the spec text is unavailable
   */
  const saveSpecText = async (spec: string, specUrl?: string) => {
    specText = spec ?? ''

    if (!spec && specUrl) {
      try {
        const response = await fetch(specUrl)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        specText = await response.text()
      } catch (e) {
        console.error('@kong/spec-renderer: error in fetching spec file:', e)
      }
    }
  }

  const downloadSpecFile = async (format?: 'json' | 'yaml', content?: string) => {
    const rawSpec = content || specText
    if (isSsr() || !rawSpec) return

    try {
      let downloadContent: string
      const originalFormat = jsonOrYaml(rawSpec)
      const targetFormat = format || originalFormat
      if (targetFormat === originalFormat) {
        downloadContent = rawSpec
      } else {
        const parsedSpec = originalFormat === 'json'
          ? JSON.parse(rawSpec)
          : parseYaml(rawSpec)
        downloadContent = targetFormat === 'json'
          ? JSON.stringify(parsedSpec, null, 2)
          : safeStringify(parsedSpec, { indent: 2 })
      }

      const pathBasedName = window.location.pathname.replace(/[^a-zA-Z0-9]/g, '') // remove all non alphanumeric charaters from the path
      const baseFileName = specTitle || pathBasedName || 'spec-file' // ensure a non-empty base name, so provided a default fallback
      const downloadFileName = `${kebabCase(baseFileName)}.${targetFormat}`

      const blob = new Blob([downloadContent], { type: targetFormat === 'json' ? 'application/json' : 'text/yaml' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.setAttribute('download', downloadFileName)
      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error('@kong/spec-renderer: error in downloading spec file:', e)
    }
  }

  const jsonOrYaml = (text: string) => text.startsWith('{') || text.startsWith('[') ? 'json' : 'yaml'

  return {
    parseSpecDocument,
    parseOpenApiSpecDocument,
    parseAsyncApiSpecDocument,
    downloadSpecFile,
    parsedDocument,
    tableOfContents,
  }
}
