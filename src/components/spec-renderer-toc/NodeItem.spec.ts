// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NodeItem from './NodeItem.vue'
import type { TableOfContentsNode } from '../../stoplight/elements-core/components/Docs/types'
import { ref } from 'vue'

describe('<NodeItem />', () => {

  it('renderers a tag with correct href', () => {
    const wrapper = mount(NodeItem, {
      props: {
        item: <TableOfContentsNode>{ id: '/operation-path/method', title: 'xxx' },
      },
      global: {
        provide: {
          'base-path': ref('/xxxx'),
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
        activePath: currentPath,
      },
    })

    const aTag = wrapper.find('li[data-spec-renderer-toc-active="true"] a')
    expect(aTag.classes()).toContain('active')
  })
})
