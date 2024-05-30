import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import MethodBadge from './MethodBadge.vue'
import { BadgeSizeVariants, MethodVariants } from '@/types'

describe('<MethodBadge />', () => {

  describe('renders correctly for method variant', () => {
    for (const method of MethodVariants) {
      it(method, () => {
        const wrapper = shallowMount(MethodBadge, {
          props: {
            method,
          },
        })

        expect(wrapper.findTestId('method-badge').classes().includes(method)).toBe(true)
        expect(wrapper.text()).toEqual(method)
      })
    }
  })

  describe('renders correctly for badge size variant', () => {
    for (const size of BadgeSizeVariants) {
      it(size, () => {
        const wrapper = shallowMount(MethodBadge, {
          props: {
            method: 'get',
            size,
          },
        })

        expect(wrapper.findTestId('method-badge').classes().includes(size)).toBe(true)
      })
    }
  })
})
