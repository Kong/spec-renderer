import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PropertyEnum from './PropertyEnum.vue'

const enumValueList = ['dropdown', 'numeric', 'text']

describe('<PropertyEnum />', () => {
  it('renders enum as valid values correctly', () => {
    const wrapper = shallowMount(PropertyEnum, {
      props: {
        enumValueList,
      },
    })

    expect(wrapper.findTestId('property-field-enum').exists()).toBe(true)
  })
})
