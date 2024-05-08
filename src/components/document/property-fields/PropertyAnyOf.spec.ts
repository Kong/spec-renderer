import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PropertyAnyOf from './PropertyAnyOf.vue'
import type { ReferenceObject, SchemaObject } from '@/types'

const anyOfList: Array<SchemaObject | ReferenceObject> = [
  {
    title: 'anyof-first-item',
    properties: {
      name: {
        description: 'The name of the API product version.',
      },
    },
  },
  {
    title: 'anyof-second-item',
    properties: {
      sample: {
        description: 'A sample description',
      },
    },
  },
]

describe('<PropertyAnyOf />', () => {
  it('renders properties of all anyOf objects correctly', () => {
    const wrapper = mount(PropertyAnyOf, {
      props: {
        anyOfList,
      },
    })

    const componentList = [
      // Check if PropertyAnyOf component itself renders
      'property-field-any-of',
      // Check if ModelProperty component renders for both anyOf objects
      'model-property-anyof-first-item',
      'model-property-anyof-second-item',
      // Check if PropertyTitle component renders for both anyOf objects
      'property-field-title',
    ]

    for (const component of componentList) {
      expect(wrapper.findTestId(component).exists()).toBe(true)
    }
  })
})
