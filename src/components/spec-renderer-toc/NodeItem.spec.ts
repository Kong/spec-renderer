// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NodeItem from './NodeItem.vue'
import type { TableOfContentsNode } from '../../stoplight/elements-core/components/Docs/types'

describe('<NodeItem />', () => {

  it('KHCP-11715 renderers a tag with correct href', () => {
    const wrapper = mount(NodeItem, {
      props: {
        item: <TableOfContentsNode>{ id: '/operation-path/method', title: 'xxx' },
      },
      global: {
        provide: {
          'base-path': '/xxxx',
        },
      },
    })

    const aTag = wrapper.find('a')
    expect(aTag.exists()).toBe(true)
    expect(aTag.attributes().href).toEqual('/xxxx/operation-path/method')
  })

  it('renders active item correctly', () => {
    const currentPath = '/operation-path/method'

    const wrapper = mount(NodeItem, {
      props: {
        item: <TableOfContentsNode>{ id: currentPath, title: 'xxx' },
      },
      global: {
        provide: {
          'current-path': currentPath,
        },
      },
    })

    const aTag = wrapper.find('a')
    expect(aTag.classes()).toContain('active')
  })
})
