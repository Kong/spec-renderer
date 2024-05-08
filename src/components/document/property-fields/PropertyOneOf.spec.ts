import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PropertyOneOf from './PropertyOneOf.vue'
import type { ReferenceObject, SchemaObject } from '@/types'

const oneOfList: Array<SchemaObject | ReferenceObject> = [
  {
    title: 'oneof-first-item',
    properties: {
      name: {
        description: 'The name of the API product version.',
      },
    },
  },
  {
    title: 'oneof-second-item',
    properties: {
      sample: {
        description: 'A sample description',
      },
    },
  },
]

describe('<PropertyOneOf />', () => {
  it('renders properties of all oneOf objects correctly', () => {
    const wrapper = mount(PropertyOneOf, {
      props: {
        oneOfList,
      },
    })

    const componentList = [
      // Check if PropertyOneOf component itself renders
      'property-field-one-of',
      // Check if ModelProperty component renders for both oneOf objects
      'model-property-oneof-first-item',
      'model-property-oneof-second-item',
      // Check if PropertyTitle component renders for both oneOf objects
      'property-field-title',
    ]

    for (const component of componentList) {
      expect(wrapper.findTestId(component).exists()).toBe(true)
    }
  })
})
