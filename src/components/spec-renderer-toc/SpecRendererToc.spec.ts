import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SpecRendererToc from './SpecRendererToc.vue'

const nestedTableOfContents = [
  {
    title: 'Endpoints',
    initiallyExpanded: true,
    items: [
      {
        title: 'Commerce APIs',
        initiallyExpanded: false,
        items: [
          {
            title: 'Orders',
            initiallyExpanded: false,
            items: [
              {
                id: '/orders/list-orders',
                slug: 'list-orders',
                title: 'List orders',
                type: 'http_operation',
                meta: 'get',
              },
            ],
          },
        ],
      },
    ],
  },
]


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

  it('renders nested x-tagGroups and tag groups using existing group styling', () => {
    const wrapper = mount(SpecRendererToc, {
      props: {
        tableOfContents: nestedTableOfContents,
        currentPath: '/orders/list-orders',
      },
    })

    const groups = wrapper.findAll('[data-testid="group-item"]')
    expect(groups).toHaveLength(3)
    expect(groups[0].classes()).toContain('root')
    expect(groups[1].classes()).not.toContain('root')
    expect(groups[2].classes()).not.toContain('root')
    expect(wrapper.text()).toContain('Commerce APIs')
    expect(wrapper.text()).toContain('Orders')
    expect(wrapper.text()).toContain('List orders')
  })

  it('expands nested active groups and emits when a nested operation is selected', async () => {
    const wrapper = mount(SpecRendererToc, {
      props: {
        tableOfContents: nestedTableOfContents,
        currentPath: '/orders/list-orders',
      },
    })

    const activeLink = wrapper.find('[data-testid="node-item-title-link"].active')
    expect(activeLink.exists()).toBe(true)
    expect(activeLink.text()).toContain('List orders')
    expect(wrapper.findAll('[data-testid="group-item-list"]')[1].isVisible()).toBe(true)
    expect(wrapper.findAll('[data-testid="group-item-list"]')[2].isVisible()).toBe(true)

    await activeLink.trigger('click')

    expect(wrapper.emitted('item-selected')).toEqual([['/orders/list-orders']])
  })

})
