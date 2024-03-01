import { ref } from 'vue'
import { transformOasToServiceNode } from '../stoplight/elements/utils/oas'
import type { ServiceNode } from '../stoplight/elements/utils/oas/types'
import { parse as parseYaml } from '@stoplight/yaml'
import { computeAPITree } from '../stoplight/elements/components/API/utils'
import type { TableOfContentsItem } from '../stoplight/elements-core/components/Docs/types'

import { validate } from '@scalar/openapi-parser'
import type { ValidateResult } from '@scalar/openapi-parser'

export default function useSchemaParser():any {

  const parsedDocument = ref<ServiceNode | null>(null)
  const jsonDocument = ref<Record<string, any>|null>(null)

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

  const parse = async (spec: string) => {
    jsonDocument.value = tryParseYamlOrObject(spec)
    if (!jsonDocument.value) {
      return
    }

    parsedDocument.value = transformOasToServiceNode(jsonDocument.value)

    validationResults.value = await validate(spec)

    try {
      if (parsedDocument.value) {
        tableOfContents.value = computeAPITree(parsedDocument.value, { hideSchemas: false, hideInternal: false })
      }
    } catch (e) {
      console.error(e)
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
