// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SpecRenderer from './SpecRenderer.vue'

describe('<SpecRenderer />', () => {
  it('renders', () => {
    const wrapper = mount(SpecRenderer, {
    })

    expect(wrapper.exists()).toBe(true)
  })
})
