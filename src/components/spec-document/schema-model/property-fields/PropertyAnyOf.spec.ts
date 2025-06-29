import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PropertyAnyOf from './PropertyAnyOf.vue'
import type { SchemaObject } from '@/types'

const anyOfList: SchemaObject[] = [
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
    it(`renders ${component} correctly`, () => {
      expect(wrapper.findTestId(component).exists()).toBe(true)
    })
  }

  it('renders correctly when anyOfList has nulls', () => {
    const anyOfListWithNulls = [
      {
        title: 'anyOf-first-item',
      },
      null,
      {
        title: 'anyOf-second-item',
      },
      null,
    ]

    // Even if the anyOfList prop has nulls, the component should render correctly
    const wrapper = mount(PropertyAnyOf, {
      props: {
        // types for anyOfList prop don't allow nulls, so we assert it to do a check
        anyOfList: anyOfListWithNulls as SchemaObject[],
      },
    })

    // Check if PropertyAnyOf component itself renders
    expect(wrapper.findTestId('property-field-any-of').exists()).toBe(true)
    // Check if ModelProperty component renders only for the 2 valid anyOf objects and skips nulls
    expect(wrapper.findAllComponents({ name: 'ModelProperty' }).length).toBe(2)
  })
})
