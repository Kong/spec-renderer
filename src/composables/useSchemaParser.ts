import { ref } from 'vue'
import type { Ref } from 'vue'
import { transformOasToServiceNode } from '../stoplight/elements/utils/oas'
import type { ServiceNode } from '@/types'
import { parse as parseYaml } from '@stoplight/yaml'
import { computeAPITree } from '../stoplight/elements/components/API/utils'
import type { TableOfContentsItem } from '../stoplight/elements-core/components/Docs/types'
import type { ParseOptions } from '../types'
import type { ValidateResult } from '@scalar/openapi-parser'
import refParser from '@apidevtools/json-schema-ref-parser'
import { isLocalRef } from '@stoplight/json'
import AsyncParser from '@asyncapi/parser/browser'
import { transform as transformAsync } from '@/utils/async-to-oas-transformer'

const trace = (doTrace: boolean | undefined, ...args: any) => {
  if (doTrace) {
    console.log(...args)
  }
}
const asyncParser = new AsyncParser()

export default (): {
  parseSpecDocument: (spec: string, options?: ParseOptions) => Promise<void>
  parsedDocument: Ref<ServiceNode | undefined>
  tableOfContents: Ref<TableOfContentsItem[] | undefined>
  validationResults: Ref<ValidateResult | undefined>
} => {

  const parsedDocument = ref<ServiceNode | undefined>()
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
          console.error('in parseJSSON:', e)
        }
      } else {
        try {
          return parseYaml(yamlOrObject)
        } catch (e) {
          console.error('in parseYaml:', e)
        }
      }
    }

    return undefined
  }

  /*
    This is for the case when we point to the referecnce, and reference block
    doesn't have title. In this case we want to use 'key' (last element of the path) as a tilte,
    so our UI representation of the referenced object is more meaningful
  / */
  const titleResolve = (json: Record<string, any>): Record<string, any> => {

    const refsSet = new Set()

    const deepGet = (obj: Record<string, any>, keys: Array<string>) => keys.reduce((xs, x) => xs?.[x] ?? null, obj)

    const doResolve = (fragment: Record<string, any>): Record<string, any> => {
      Object.keys(fragment).forEach(key => {
        if (typeof fragment[key] === 'object' && fragment[key] !== null) {
          fragment[key] = doResolve(fragment[key])
        } else if (fragment[key] && isLocalRef(fragment[key]) && !refsSet.has(fragment[key])) {
          const resolvedRef = deepGet(json, fragment[key].replace('#/', '').split('/'))
          if (resolvedRef) {
            resolvedRef.title = resolvedRef.title || fragment[key].split('/').pop()
          }
          refsSet.add(fragment[key])
        }
      })

      return fragment
    }

    return doResolve(json)
  }


  const parseAsyncDocument = async (spec: string, options: ParseOptions = <ParseOptions>{}): Promise<boolean> => {

    let specToParse = spec
    if (options.specUrl && !spec) {
      try {
        specToParse = await (await fetch(options.specUrl)).text()
      } catch (e) {
        console.error(`Error fetching async document from ${options.specUrl}`, e)
        return false
      }
      trace(options.traceParsing, 'async document fetched')
    }

    let parsed = null
    try {
      const { document/*, diagnostics*/ } = await asyncParser.parse(specToParse)
      if (!document) {
        return false
      }
      parsed = document
    } catch (e) {
      console.error('Error parsing async document', e)
      return false
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
      return true
    } catch (e) {
      console.error('Error transforming async document', e)
      return false
    }
  }
  /**
    Parsing spec (sepcText) or by URL produced in  ParseOptions
  */
  const parseSpecDocument = async (spec: string, options: ParseOptions = <ParseOptions>{}):Promise<void> => {

    const isAsync = await parseAsyncDocument(spec, options)
    if (isAsync) {
      return
    }

    // let's
    // we want to leave console.logs for parsing
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
      trace(options.traceParsing, 'external referenced bundled')
    } else {
      // parse document. also do yaml to json
      jsonDocument.value = tryParseYamlOrObject(spec)
      trace(options.traceParsing, 'parsed')
    }

    if (!jsonDocument.value) {
      // was it even a spec or even something that could be converted to json?
      console.error('empty jsonDocument initial processing')
      return
    }

    trace(options.traceParsing, 'json document available')
    try {
      // let's see if we can detect some validation errors here
      // validationResults.value = await validate(spec || jsonDocument.value)
    } catch (err) {
      console.error('error in validate:', err)
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
      console.error('error dereferencing:', err)
    }

    trace(options.traceParsing, 'dereferenced')


    // it was not async, let's try openAPI
    try {
      // convert to AST for ui layer to use
      parsedDocument.value = transformOasToServiceNode(jsonDocument.value)
    } catch (err) {
      console.error('error in transformOasToServiceNode:', err)
    }

    trace(options.traceParsing, 'transformed')

    try {
      if (parsedDocument.value) {
        // generate table of contents
        tableOfContents.value = computeAPITree(parsedDocument.value, {
          hideSchemas: options?.hideSchemas,
          hideInternal: options?.hideInternal,
          hideDeprecated: options?.hideDeprecated,
          currentPath: options?.currentPath,
        })
      }
    } catch (err) {
      console.error('error in computeAPITree:', err)
    }

    trace(options.traceParsing, 'APITree computed')
  }

  return {
    parseSpecDocument,
    parsedDocument,
    tableOfContents,
    validationResults,
  }
}
