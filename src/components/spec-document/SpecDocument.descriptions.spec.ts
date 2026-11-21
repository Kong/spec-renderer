import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SpecDocument from './SpecDocument.vue'
import { parseOpenApiSpecDocument } from '@/utils/schema-parser'
import type { ServiceNode } from '@/types'
import type { TableOfContentsItem } from '@/stoplight/elements-core'

describe('referenced property descriptions', () => {
  it.each(['3.0.3', '3.1.0'])('preserves use-site descriptions in OpenAPI %s without changing shared schemas', async (openapi) => {
    const stopRef = { $ref: '#/components/schemas/Stop' }
    const spec = {
      openapi,
      info: { title: 'Trips', version: '1.0' },
      paths: {
        '/trips': {
          post: {
            operationId: 'createTrip',
            requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Trip' } } } },
            responses: { 200: { description: 'OK' } },
          },
        },
      },
      components: { schemas: {
        Stop: { type: 'object', description: 'A single stop.', properties: { name: { type: 'string' } } },
        Trip: { type: 'object', properties: {
          // Prime the dereference cache before references with their own descriptions.
          defaultStop: stopRef,
          stops: { type: 'array', description: 'Ordered stops for this trip.', items: stopRef },
          start: { ...stopRef, description: 'The departure stop.' },
          end: { ...stopRef, description: 'The arrival stop.' },
          defaultStops: { type: 'array', items: stopRef },
          wrappedStop: { description: 'A wrapped stop.', allOf: [stopRef] },
          emptyStops: { type: 'array', description: '', items: stopRef },
        } },
      } },
    }
    const { parsedDocument, tableOfContents } = await parseOpenApiSpecDocument(JSON.stringify(spec))
    const document = parsedDocument as ServiceNode
    const stop = document.children.find(child => child.uri === '/schemas/Stop')
    expect(stop?.data.description).toBe('A single stop.')

    const wrapper = mount(SpecDocument, { props: {
      document,
      tableOfContents: tableOfContents as TableOfContentsItem[],
      currentPath: '/operations/createTrip',
      allowContentScrolling: false,
    } })
    const descriptions = {
      defaultStop: 'A single stop.',
      stops: 'Ordered stops for this trip.',
      start: 'The departure stop.',
      end: 'The arrival stop.',
      defaultStops: 'A single stop.',
      wrappedStop: 'A wrapped stop.',
    }
    for (const [name, description] of Object.entries(descriptions)) {
      const row = wrapper.get(`[data-testid="model-property-${name}"]`)
      expect(row.get('[data-testid="property-field-description"]').text()).toBe(description)
      expect(row.text()).toContain('Show Child Parameters')
      await row.get('summary').trigger('click')
      expect(row.find('[data-testid="model-property-name"]').exists()).toBe(true)
    }
    expect(wrapper.get('[data-testid="model-property-emptyStops"]').find('[data-testid="property-field-description"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
