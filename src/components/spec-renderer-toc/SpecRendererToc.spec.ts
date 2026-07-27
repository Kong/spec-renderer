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
        groupLabel: true,
        initiallyExpanded: true,
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

  it('renders x-tagGroups as non-collapsible labels beside tag groups', () => {
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
    expect(wrapper.find('[data-testid="group-label"]').text()).toBe('Commerce APIs')
    expect(wrapper.find('[data-testid="group-label"] + button').exists()).toBe(false)
    expect(wrapper.find('.group-label-list').exists()).toBe(true)
    expect(wrapper.text()).toContain('Commerce APIs')
    expect(wrapper.text()).toContain('Orders')
    expect(wrapper.text()).toContain('List orders')
  })

  it('expands the active tag group and emits when an operation is selected', async () => {
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

    await activeLink.trigger('click')

    expect(wrapper.emitted('item-selected')).toEqual([['/orders/list-orders']])
  })

})
