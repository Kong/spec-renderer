import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RequestParamList from './RequestParamList.vue'
import { HttpParamStyles } from '@stoplight/types'
import type { SchemaObject } from '@/types'

describe('<RequestParamList />', () => {
  const wrapper = mount(RequestParamList, {
    props: {
      paramList: [
        {
          name: 'param1',
          id: 'param1',
          style: HttpParamStyles.Form,
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
            },
          },
        },
        {
          name: 'param2',
          id: 'param2',
          style: HttpParamStyles.SpaceDelimited,
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
            },
          },
        },
      ],
      title: 'sample-title',
    },
    attrs: {
      'data-testid': 'endpoint-request-param-list',
    },
  })

  const componentList = [
    // the component itself is rendered
    'endpoint-request-param-list',
    // the model property component renders for both request params
    'model-property-param1',
    'model-property-param2',
  ] as const

  for (const component of componentList) {
    it(`renders ${component} correctly`, () => {
      expect(wrapper.findTestId(component).exists()).toBe(true)
    })
  }

  it('renders the param description even when the schema carries a stale x-stoplight explicit-fields allow-list', () => {
    // some stoplight http-spec transforms (e.g. numeric `format`s like int32) add `x-stoplight.explicitProperties`
    // onto the schema before the param's own `description` gets merged in. that stale allow-list must not filter the description back out.
    const limitSchema: SchemaObject = {
      type: 'integer',
      format: 'int32',
      minimum: 1,
      maximum: 100,
      default: 20,
      'x-stoplight': {
        explicitProperties: ['type', 'format', 'minimum', 'maximum', 'default'],
      },
    }
    const paramWithStaleAllowList = mount(RequestParamList, {
      props: {
        paramList: [
          {
            name: 'limit',
            id: 'limit',
            style: HttpParamStyles.Form,
            description: 'The maximum number of results per page.',
            schema: limitSchema,
          },
        ],
        title: 'sample-title',
      },
    })

    expect(paramWithStaleAllowList.findTestId('property-field-description').text()).toBe('The maximum number of results per page.')
  })

  it('renders each param\'s own description when multiple params share the same schema object reference', () => {
    // e.g. two params referencing the same components.parameters/components.schemas entry - the
    // dereferenced schema object can be the exact same reference for both params
    const sharedSchema: SchemaObject = { type: 'integer' }
    const sharedSchemaParams = mount(RequestParamList, {
      props: {
        paramList: [
          { name: 'paramA', id: 'paramA', style: HttpParamStyles.Form, description: 'Description A', schema: sharedSchema },
          { name: 'paramB', id: 'paramB', style: HttpParamStyles.Form, description: 'Description B', schema: sharedSchema },
        ],
        title: 'sample-title',
      },
    })

    expect(sharedSchemaParams.findTestId('model-property-param-a').find('[data-testid="property-field-description"]').text()).toBe('Description A')
    expect(sharedSchemaParams.findTestId('model-property-param-b').find('[data-testid="property-field-description"]').text()).toBe('Description B')
    // the shared schema object itself must not be mutated by rendering either param
    expect(sharedSchema.description).toBeUndefined()
  })
})
