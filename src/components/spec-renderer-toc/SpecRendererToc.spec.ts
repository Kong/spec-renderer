import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SpecRendererToc from './SpecRendererToc.vue'


describe('<SpecRendererToc />', () => {
  it('Should renderer', () => {
    const wrapper = mount(SpecRendererToc, {
      props: {
        tableOfContents: {},
        currentPath: '/some-bogus-path',
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

})
