import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import VersionBadge from './VersionBadge.vue'
import { VersionBadgeTypeVariants } from '@/types'

describe('<VersionBadge />', () => {

  describe('renders correctly for version variant', () => {
    for (const versionType of VersionBadgeTypeVariants) {
      it(versionType, () => {
        const version = '1.0.0'

        const wrapper = shallowMount(VersionBadge, {
          props: {
            type: versionType,
            version,
          },
        })

        expect(wrapper.findTestId('version-badge').classes().includes(versionType)).toBe(true)
        expect(wrapper.text()).toEqual(version)
      })
    }
  })
})
