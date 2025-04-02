import { ref } from 'vue'
import type { Ref } from 'vue'
import { computeAPITree, transformOasToServiceNode } from '@/stoplight/elements'
import type { ServiceNode, ParseOptions } from '@/types'
import { parse as parseYaml } from '@stoplight/yaml'
import type { TableOfContentsItem } from '@/stoplight/elements-core'
import type { ValidateResult } from '@scalar/openapi-parser'
import refParser from '@apidevtools/json-schema-ref-parser'
import { isLocalRef } from '@stoplight/json'
import { stringify } from 'flatted'
import { transform as transformAsync } from '@/utils/async-to-oas-transformer'
import { isSsr } from '@/utils/ssr'
import { kebabCase } from '@/utils/strings'

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

export default (): {
  parseSpecDocument: (spec: string, options?: ParseOptions) => Promise<void>
  parseOpenApiSpecDocument: (spec: string, options?: ParseOptions) => Promise<void>
  parseAsyncApiSpecDocument: (spec: string, options?: ParseOptions) => Promise<void>
  downloadSpecFile: () => Promise<void>
  parsedDocument: Ref<ServiceNode | string | undefined>
  tableOfContents: Ref<TableOfContentsItem[] | string | undefined>
  validationResults: Ref<ValidateResult | string | undefined>
} => {

  const parsedDocument = ref<ServiceNode | string | undefined>()
  const jsonDocument = ref<Record<string, any> | undefined>()

  const tableOfContents = ref<TableOfContentsItem[] | undefined>()
  const validationResults = ref<ValidateResult | undefined>()

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

    const deepGet = (obj: Record<string, any>, keys: Array<string>) => keys.reduce((xs, x) => xs?.[x] ?? null, obj)
    const doResolve = (fragment: Record<string, any>, parentKey: string = ''): Record<string, any> => {
      Object.keys(fragment).forEach(key => {
        if (!refsSet.has(fragment[key]) && !fragmentsSet.has(fragment[key])) {
          if (typeof fragment[key] === 'object' && fragment[key] !== null) {
            fragmentsSet.add(fragment[key])
            fragment[key] = doResolve(fragment[key], parentKey + '/' + key)
          } else if (fragment[key] && isLocalRef(fragment[key])) {
            const resolvedRef = deepGet(json, fragment[key].replace('#/', '').split('/'))
            if (resolvedRef) {
              resolvedRef.title = resolvedRef.title || fragment[key].split('/').pop()
            }
            refsSet.add(fragment[key])
          }
        }
      })
      return fragment
    }
    const ret = doResolve(json)
    return ret
  }


  const parseAsyncApiSpecDocument = async (spec: string, options: ParseOptions = <ParseOptions>{}): Promise<void> => {

    if (!asyncParser) {
      const AsyncParser:any = await import('@asyncapi/parser/browser')
      const OpenAPISchemaParser:any = await import('@asyncapi/openapi-schema-parser')
      asyncParser = new AsyncParser.default()
      asyncParser.registerSchemaParser(OpenAPISchemaParser.default())
    }

    let specToParse = spec
    if (options.specUrl && !spec) {
      try {
        specToParse = await (await fetch(options.specUrl)).text()
      } catch (e) {
        console.error(`@kong/spec-renderer: error fetching async document from ${options.specUrl}`, e)
        return
      }
      trace(options.traceParsing, 'async document fetched')
    }
    let parsed = null
    try {
      const { document/*, diagnostics*/ } = await asyncParser.parse(specToParse)
      if (!document) {
        trace(options.traceParsing, 'async document undefined after parsing')
        return
      }
      parsed = document
    } catch (e) {
      console.error('@kong/spec-renderer: error parsing async document', e)
      return
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
      tableOfContents.value = toc
      parsedDocument.value = transformed
      return
    } catch (e) {
      console.error('@kong/spec-renderer: error transforming async document', e)
      return
    }
  }

  /**
    Parsing spec (sepcText) or by URL produced in  ParseOptions
  */

  const fetchAndBundle = async (spec: string, options: ParseOptions = <ParseOptions>{}): Promise<void> => {
    // if we have URL passed, but no spec, we call bundle to fetch and resolve external refs
    if (options.specUrl && !spec) {
      // fetches spec by URL provided and resolves all external references
      jsonDocument.value = await refParser.bundle(options.specUrl, {
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
      })
      trace(options.traceParsing, 'fetched and external referenced bundled')
    } else {
      // if we have string holding spec content, we try to convert it to json obect (from json string or yaml)
      jsonDocument.value = tryParseYamlOrObject(spec)
      trace(options.traceParsing, 'parsed from string')
    }
  }
  const parseOpenApiSpecDocument = async (spec: string, options: ParseOptions = <ParseOptions>{}):Promise<void> => {

    if (!jsonDocument.value || options.enforceResetBeforeParsing) {
      await fetchAndBundle(spec, options)
    }
    if (!jsonDocument.value) {
      // was it even a spec or even something that could be converted to json?
      console.error('@kong/spec-renderer: empty jsonDocument initial processing')
      return
    }

    trace(options.traceParsing, 'json document available')

    try {
      // let's see if we can detect some validation errors here
      // validationResults.value = await validate(spec || jsonDocument.value)
    } catch (err) {
      console.error('@kong/spec-renderer: error in validate:', err)
    }

    trace(options.traceParsing, 'validated')

    // resolve the titles for internal refs
    jsonDocument.value = titleResolve(jsonDocument.value)

    trace(options.traceParsing, 'title resolved')

    try {
      // resolve the internal refs
      const dereferenced = await refParser.dereference(jsonDocument.value, {
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
      })
      jsonDocument.value = dereferenced
    } catch (err) {
      console.error('@kong/spec-renderer: error dereferencing:', err)
    }

    trace(options.traceParsing, 'dereferenced')


    // it was not async, let's try openAPI
    try {
      // convert to AST for ui layer to use
      parsedDocument.value = transformOasToServiceNode(jsonDocument.value)
    } catch (err) {
      console.error('@kong/spec-renderer: error in transformOasToServiceNode:', err)
    }

    trace(options.traceParsing, 'transformed')

    try {
      if (parsedDocument.value) {
        // generate table of contents
        tableOfContents.value = computeAPITree(<ServiceNode>parsedDocument.value, {
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
        parsedDocument.value = stringify(parsedDocument.value)
        //@ts-ignore string is allowed
        tableOfContents.value = stringify(tableOfContents.value)
        //@ts-ignore string is allowed
        validationResults.value = stringify(validationResults.value)
      } catch (err) {
        console.error('@kong/spec-renderer: error in stringifying for web-component:', err)
      }
    }
    trace(options.traceParsing, 'APITree computed')
  }

  const parseSpecDocument = async (spec: string, options: ParseOptions = <ParseOptions>{}): Promise<void> => {

    await saveSpecText(spec, options.specUrl)

    await fetchAndBundle(spec, options)

    if (!jsonDocument.value) {
      // was it even a spec or even something that could be converted to json?
      console.error('@kong/spec-renderer: empty jsonDocument initial processing')
      return
    }

    trace(options.traceParsing, 'json document available')

    // at this point we have json schema, so we can look when spec is it and if it is asyc, we call async if not in ssr mode
    if (jsonDocument.value?.asyncapi) {
      trace(options.traceParsing, 'asyncapi spec detected')
      await parseAsyncApiSpecDocument(spec, options)
    } else {
      trace(options.traceParsing, 'openapi spec detected')
      await parseOpenApiSpecDocument(spec, options)
    }
  }

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

  const downloadSpecFile = async () => {
    if (isSsr() || !specText) return

    try {
      const fileExtension = jsonOrYaml(specText)
      const blob = new Blob([specText], { type: fileExtension })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.setAttribute('download', `${kebabCase(window.location.hostname)}.${fileExtension}`)
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
    validationResults,
  }
}
