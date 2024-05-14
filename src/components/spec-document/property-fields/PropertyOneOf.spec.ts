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
  const componentList = [
    // Check if PropertyOneOf component itself renders
    'property-field-one-of',
    // Check if ModelProperty component renders for both oneOf objects
    'model-property-oneof-first-item',
    'model-property-oneof-second-item',
    // Check if PropertyTitle component renders for both oneOf objects
    'property-field-title',
  ]

  const wrapper = mount(PropertyOneOf, {
    props: {
      oneOfList,
    },
  })

  for (const component of componentList) {
    it(`renders ${component} correctly`, () => {
      expect(wrapper.findTestId(component).exists()).toBe(true)
    })
  }

  it('renders correctly when oneOfList has nulls', () => {
    const oneOfListWithNulls = [
      {
        title: 'oneof-first-item',
      },
      null,
      {
        title: 'oneof-second-item',
      },
      null,
    ]

    // Even if the oneOfList prop has nulls, the component should render correctly
    const wrapper = mount(PropertyOneOf, {
      props: {
        // types for oneOfList prop don't allow nulls, so we assert it to do a check
        oneOfList: oneOfListWithNulls as Array<SchemaObject>,
      },
    })

    // Check if PropertyOneOf component itself renders
    expect(wrapper.findTestId('property-field-one-of').exists()).toBe(true)
    // Check if ModelProperty component renders only for the 2 valid oneOf objects and skips nulls
    expect(wrapper.findAllComponents({ name: 'ModelProperty' }).length).toBe(2)
  })
})
