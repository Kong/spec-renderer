import { ref } from 'vue'
import { transformOasToServiceNode } from '../stoplight/elements/utils/oas'
import type { ServiceNode } from '../stoplight/elements/utils/oas/types'
import { parse as parseYaml } from '@stoplight/yaml'
import { computeAPITree } from '../stoplight/elements/components/API/utils'
import type { TableOfContentsItem } from '../stoplight/elements-core/components/Docs/types'
import type { ParseOptions } from '../types'
import { validate } from '@scalar/openapi-parser'
import type { ValidateResult } from '@scalar/openapi-parser'
import $RefParser from '@stoplight/json-schema-ref-parser'
import { isLocalRef } from '@stoplight/json'

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

  const titleResolve = (json: Record<string, any>): Record<string, any> => {

    const refsSet = new Set()

    const deepGet = (obj:Record<string, any>, keys:Array<string>) => keys.reduce((xs, x) => xs?.[x] ?? null, obj)

    const doResolve = (fragment: Record<string, any>): Record<string, any> => {
      Object.keys(fragment).forEach(key => {
        if (typeof fragment[key] === 'object' && fragment[key] !== null) {
          fragment[key] = doResolve(fragment[key])
        } else if (fragment[key] && isLocalRef(fragment[key]) && !refsSet.has(fragment[key])) {
          console.log('processing:', fragment[key], fragment[key].replace('#/', '').split('/'))
          const resovedRef = deepGet(json, fragment[key].replace('#/', '').split('/'))
          if (resovedRef) {
            resovedRef.title = resovedRef.title || fragment[key].split('/').pop()
          }
          refsSet.add(fragment[key])
        }
      })
      return fragment
    }

    return doResolve(json)
  }

  const parse = async (spec: string, options: ParseOptions) => {

    if (options?.specUrl) {
      jsonDocument.value = await $RefParser.bundle(options?.specUrl, {
        continueOnError: true,
      })
    } else {
      jsonDocument.value = tryParseYamlOrObject(spec)
    }

    if (!jsonDocument.value) {
      console.error('empty jsonDocument initial processing')
      return
    }

    try {
      validationResults.value = await validate(spec || jsonDocument.value)
    } catch (err) {
      console.error('error in validate', err)
    }

    jsonDocument.value = titleResolve(jsonDocument.value)

    console.log('before dereferencing:', jsonDocument.value)
    try {

      const dereferenced = await $RefParser.dereference(jsonDocument.value, {
        continueOnError: true,
        dereference: {
          circular: true,
        },
      })
      jsonDocument.value = dereferenced
      console.log('!!!!!!json: ', jsonDocument.value)
    } catch (err) {
      console.error('error deferencing', err)
    }
    console.log('!!!!!!json: ', jsonDocument.value)

    try {
      parsedDocument.value = transformOasToServiceNode(jsonDocument.value)
    } catch (err) {
      console.error('error in transformOasToServiceNode', err)
    }

    try {
      if (parsedDocument.value) {
        tableOfContents.value = computeAPITree(parsedDocument.value, { hideSchemas: false, hideInternal: false })
      }
    } catch (err) {
      console.error('error in computeAPITree', err)
    }
  }

  return {
    parse,
    parsedDocument,
    jsonDocument,
    tableOfContents,
    validationResults,
  }
}
