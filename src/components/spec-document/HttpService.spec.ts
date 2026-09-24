import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HttpService from './HttpService.vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'

const serviceData = {
  name: 'Coffee API',
  version: '1.0.0',
  description: 'API for managing coffee orders',
  servers: [],
}

const mountOptions = (props: Record<string, unknown> = {}) => ({
  props: {
    data: serviceData,
    specVersion: 'OAS 3.1',
    ...props,
  },
  global: {
    stubs: {
      // avoids its internal parse-result/store dependencies, irrelevant here
      DownloadSpecDropdown: true,
    },
  },
})

describe('<HttpService />', () => {
  it('renders the title and description by default', () => {
    const wrapper = mount(HttpService, mountOptions())

    expect(wrapper.findTestId('spec-renderer-page-header-title').text()).toBe('Coffee API')
    expect(wrapper.findComponent(MarkdownRenderer).exists()).toBe(true)
    expect(wrapper.text()).toContain('API for managing coffee orders')
  })

  it('hides the title when hideOverviewTitle is set', () => {
    const wrapper = mount(HttpService, mountOptions({ hideOverviewTitle: true }))

    expect(wrapper.findTestId('spec-renderer-page-header-title').exists()).toBe(false)
    // version badges and the description remain visible
    expect(wrapper.findComponent({ name: 'LabelBadge' }).exists()).toBe(true)
    expect(wrapper.findComponent(MarkdownRenderer).exists()).toBe(true)
    expect(wrapper.text()).toContain('API for managing coffee orders')
  })
})
