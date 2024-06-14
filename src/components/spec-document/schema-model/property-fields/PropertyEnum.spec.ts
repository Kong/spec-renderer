import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PropertyEnum from './PropertyEnum.vue'

const enumValueList = ['dropdown', 'numeric', 'text']

describe('<PropertyEnum />', () => {
  const wrapper = shallowMount(PropertyEnum, {
    props: {
      enumValueList,
    },
  })

  it('renders component', () => {
    expect(wrapper.findTestId('property-field-enum').exists()).toBe(true)
  })

  for (const enumValue of enumValueList) {
    it(`renders enum value ${enumValue} correctly`, () => {
      expect(wrapper.findTestId(`property-field-enum-value-${enumValue}`).exists()).toBe(true)
    })
  }
})
