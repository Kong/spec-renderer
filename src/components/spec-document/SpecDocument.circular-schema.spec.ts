import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SpecDocument from './SpecDocument.vue'
import BodyContentList from './endpoint/BodyContentList.vue'
import { parseOpenApiSpecDocument, parsedDocument, tableOfContents } from '@/utils/schema-parser'
import type { ServiceNode } from '@/types'
import type { TableOfContentsItem } from '@/stoplight/elements-core'

window.scrollTo = () => {}
window.HTMLElement.prototype.scrollIntoView = () => {}

/**
 * A minimal OpenAPI document containing a self-referencing ("recursive") schema, e.g. a
 * tree-shaped model whose array property references itself via `$ref`. This is a generic
 * synthetic reproduction of a real-world recursive schema shape seen in production (a
 * tree/section-like model referencing itself through a nested array), not a copy of any
 * customer's actual specification. The parser's
 * `refParser.dereference(..., { dereference: { circular: true } })` call preserves this as a
 * live circular JS object reference rather than erroring out or truncating it.
 */
const recursiveSchemaSpec = {
  openapi: '3.0.0',
  info: { title: 'Recursive schema regression', version: '1.0.0' },
  paths: {
    '/nodes': {
      post: {
        operationId: 'submitNode',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TreeNode' },
            },
          },
        },
        // the response reuses the same circular schema so mounting this operation page also
        // exercises ResponseSample -> hasMasking -> _schemaHasSensitiveData, the function that
        // actually crashed in production (a fix to a different function, removeFieldsFromSchemaObject,
        // did not cover this path - only mounting the full page here proves it's fixed)
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TreeNode' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      TreeNode: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
          // readOnly so we can assert it's stripped from the rendered request body schema
          // (HttpOperation.vue passes hide-readonly for request bodies) - including after
          // recursing back around the cycle, not just on its first occurrence
          internalId: { type: 'string', readOnly: true },
          // a schema referencing itself through an array property is the shape that triggers
          // the regression: rendering the request body walks into this schema, back into
          // itself, forever, unless the walk is cycle-safe.
          children: {
            type: 'array',
            items: { $ref: '#/components/schemas/TreeNode' },
          },
          // a oneOf variant that cycles straight back to this same schema - the shape that
          // triggers the ModelNode/ModelProperty variant-rendering regression, which renders
          // eagerly (unlike children above, which needs a manual "Show Child Parameters" click)
          variant: {
            oneOf: [{ $ref: '#/components/schemas/TreeNode' }],
          },
        },
        additionalProperties: false,
      },
    },
  },
}

describe('<SpecDocument /> with a self-referencing (circular) schema', () => {
  it('parses and renders the operation without throwing (stack overflow / circular JSON regression)', async () => {
    await parseOpenApiSpecDocument(JSON.stringify(recursiveSchemaSpec), {
      currentPath: '/operations/submitNode',
      enforceResetBeforeParsing: true,
    })

    expect(parsedDocument.value).toBeTruthy()

    let wrapper: ReturnType<typeof mount> | undefined
    expect(() => {
      wrapper = mount(SpecDocument, {
        props: {
          document: parsedDocument.value as ServiceNode,
          tableOfContents: tableOfContents.value as TableOfContentsItem[],
          currentPath: '/operations/submitNode',
          allowContentScrolling: false,
        },
      })
    }).not.toThrow()

    expect(wrapper?.text()).toContain('children')

    // the readOnly `internalId` field must not appear in the rendered REQUEST body model - the
    // request body is the first BodyContentList on the page (hide-readonly is only passed for
    // request bodies, HttpOperation.vue) - including after recursing back around the cycle, not
    // just its first occurrence (a prior version of this fix only stripped readOnly fields on
    // the first pass through a cyclic schema, and leaked them back in on subsequent laps)
    const requestBody = wrapper?.findComponent(BodyContentList)
    expect(requestBody?.exists()).toBe(true)
    expect(requestBody?.text()).not.toContain('internalId')

    // the readOnly field IS expected to appear in the response body model, since responses are
    // not filtered - confirms the response model actually rendered too, not just skipped
    expect(wrapper?.text()).toContain('internalId')

    // the response sample section must have actually rendered (not been skipped or left blank)
    // proving hasMasking ran to completion on the circular schema instead of crashing before
    // this content could ever mount - graceful degradation means already-processed content
    // like this still displays normally even though a sibling section (the oneOf variant above)
    // hits a cycle guard
    expect(wrapper?.find('[data-testid="response-sample"]').exists()).toBe(true)
  })
})
