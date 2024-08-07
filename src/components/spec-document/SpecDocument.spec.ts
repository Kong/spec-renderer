import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SpecDocument from './SpecDocument.vue'
import type { ServiceNode } from '../../stoplight/elements/utils/oas/types'


describe('<SpecDocument />', () => {
  it('Should fire path-not-found event', () => {
    const wrapper = mount(SpecDocument, {
      props: {
        document: {
          children: [],
          tags: [],
        } as unknown as ServiceNode,
        currentPath: '/some-bogus-path',
      },
    })

    expect(wrapper.emitted('path-not-found')?.toString()).toBe('/some-bogus-path')

  })

})
