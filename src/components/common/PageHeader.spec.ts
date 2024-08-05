import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from './PageHeader.vue'

describe('<PageHeader />', () => {
  it('renders with only required props', () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: 'sample title',
      },
    })

    // the component itself is rendered
    expect(wrapper.findTestId('spec-renderer-page-header').exists()).toBe(true)
    // the title is rendered
    expect(wrapper.findTestId('spec-renderer-page-header-title').exists()).toBe(true)
    // the description is not rendered
    expect(wrapper.findTestId('spec-renderer-page-header-description').exists()).toBe(false)
    // the data type and deprecated labels are not rendered
    expect(wrapper.findTestId('data-type-badge').exists()).toBe(false)
    expect(wrapper.findTestId('deprecated-badge').exists()).toBe(false)
  })

  it('renders with all props', () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: 'sample title',
        description: 'sample content',
        dataType: 'object',
        deprecated: true,
      },
    })

    // the title and description, both are rendered
    expect(wrapper.findTestId('spec-renderer-page-header-title').exists()).toBe(true)
    expect(wrapper.findTestId('spec-renderer-page-header-description').exists()).toBe(true)
    // the data type and deprecated labels are rendered
    expect(wrapper.findTestId('data-type-badge').exists()).toBe(true)
    expect(wrapper.findTestId('deprecated-badge').exists()).toBe(true)
  })

  it('renders slots correctly', () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: 'sample title',
      },
      slots: {
        default: '<div data-testid="footer-slot-content">Footer</div>',
      },
    })

    // the component itself is rendered
    expect(wrapper.findTestId('spec-renderer-page-header').exists()).toBe(true)

    // the title is rendered
    expect(wrapper.findTestId('spec-renderer-page-header-title').exists()).toBe(true)

    // the footer is rendered
    expect(wrapper.findTestId('footer-slot-content').exists()).toBe(true)
  })
})
