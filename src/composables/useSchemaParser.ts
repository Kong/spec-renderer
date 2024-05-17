import { ref } from 'vue'
import { transformOasToServiceNode } from '../stoplight/elements/utils/oas'
import type { ServiceNode } from '../stoplight/elements/utils/oas/types'
import { parse as parseYaml } from '@stoplight/yaml'
import { computeAPITree } from '../stoplight/elements/components/API/utils'
import type { TableOfContentsItem } from '../stoplight/elements-core/components/Docs/types'
import type { ParseOptions } from '../types'
import { validate } from '@scalar/openapi-parser'
import type { ValidateResult } from '@scalar/openapi-parser'
import refParser from '@stoplight/json-schema-ref-parser'
import { isLocalRef } from '@stoplight/json'

const trace = (doTrace: boolean, ...args: any) => {
  if (doTrace) {
    console.log(...args)
  }
}

export default function useSchemaParser():any {

  const parsedDocument = ref<ServiceNode | null>()
  const jsonDocument = ref<Record<string, any>|undefined>()

  const tableOfContents = ref<TableOfContentsItem[]>()
  const validationResults = ref < ValidateResult | undefined>()

  function tryParseYamlOrObject(yamlOrObject: unknown): Record<string, unknown> | undefined {
    if (typeof yamlOrObject === 'object' && yamlOrObject !== null) return <Record < string, unknown >>yamlOrObject
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

    const deepGet = (obj:Record<string, any>, keys:Array<string>) => keys.reduce((xs, x) => xs?.[x] ?? null, obj)

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

  /**
    Parsing spec (sepcText) or by URL prodiced in  ParseOptions
  */
  const parseSpecDocument = async (spec: string, options: ParseOptions) => {

    // we want to leave console.logs for parsing
    if (options?.specUrl) {
      // fetches spec by URL provided and resolves all external references
      jsonDocument.value = await refParser.bundle(options.specUrl, {
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
      validationResults.value = await validate(spec || jsonDocument.value)
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
      })
      jsonDocument.value = dereferenced
    } catch (err) {
      console.error('error dereferencing:', err)
    }
    trace(options.traceParsing, 'dereferenced')

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
        tableOfContents.value = computeAPITree(parsedDocument.value, { hideSchemas: options?.hideSchemas, hideInternal: options?.hideInternal })
      }
    } catch (err) {
      console.error('error in computeAPITree:', err)
    }
    trace(options.traceParsing, 'APITree computed')
  }

  return {
    parseSpecDocument,
    parsedDocument,
    jsonDocument,
    tableOfContents,
    validationResults,
  }
}
