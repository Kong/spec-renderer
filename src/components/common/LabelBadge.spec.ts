import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import LabelBadge from './LabelBadge.vue'
import { LabelBadgeTypeVariants } from '@/types'

describe('<LabelBadge />', () => {

  describe('renders correctly for label variant', () => {
    for (const labelType of LabelBadgeTypeVariants) {
      it(labelType, () => {
        const label = '1.0.0'

        const wrapper = shallowMount(LabelBadge, {
          props: {
            type: labelType,
            label,
          },
        })

        expect(wrapper.findTestId('label-badge').classes().includes(labelType)).toBe(true)
        expect(wrapper.text()).toEqual(label)
      })
    }
  })
})
