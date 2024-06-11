import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PageHeader from './PageHeader.vue'

describe('<PageHeader />', () => {
  it('renders with only required props', () => {
    const wrapper = shallowMount(PageHeader, {
      props: {
        title: 'sample title',
      },
    })

    // the component itself is rendered
    expect(wrapper.findTestId('spec-renderer-page-header').exists()).toBe(true)
    // the title is rendered
    expect(wrapper.findTestId('spec-renderer-page-header-title').exists()).toBe(true)

    // the content is not rendered with footer
    expect(wrapper.findTestId('spec-renderer-page-header-content').classes('page-header-with-footer')).toBe(false)
    expect(wrapper.findTestId('spec-renderer-page-header-footer').exists()).toBe(false)
  })

  it('renders with all props', () => {
    const wrapper = shallowMount(PageHeader, {
      props: {
        title: 'sample title',
        description: 'sample content',
        footerText: 'sample footer',
      },
    })

    // the component itself is rendered
    expect(wrapper.findTestId('spec-renderer-page-header').exists()).toBe(true)

    // the title and description are rendered
    expect(wrapper.findTestId('spec-renderer-page-header-title').exists()).toBe(true)
    expect(wrapper.findTestId('spec-renderer-page-header-description').exists()).toBe(true)

    // the footer is rendered
    expect(wrapper.findTestId('spec-renderer-page-header-content').classes('page-header-with-footer')).toBe(true)
    expect(wrapper.findTestId('spec-renderer-page-header-footer').exists()).toBe(true)
  })

  it('renders slots correctly', () => {
    const wrapper = shallowMount(PageHeader, {
      props: {
        title: 'sample title',
      },
      slots: {
        footer: '<div data-testid="footer-slot-content">Footer</div>',
      },
    })

    // the component itself is rendered
    expect(wrapper.findTestId('spec-renderer-page-header').exists()).toBe(true)

    // the title is rendered
    expect(wrapper.findTestId('spec-renderer-page-header-title').exists()).toBe(true)

    // the footer is rendered
    expect(wrapper.findTestId('spec-renderer-page-header-content').classes('page-header-with-footer')).toBe(true)
    expect(wrapper.findTestId('footer-slot-content').exists()).toBe(true)
  })
})
