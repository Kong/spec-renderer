// Vitest unit test spec file

import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SpecRenderer from './SpecRenderer.vue'

const minimalOpenApiSpec = JSON.stringify({
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        summary: 'List pets',
        responses: { 200: { description: 'ok' } },
      },
    },
  },
})

describe('<SpecRenderer />', () => {
  it('renders', () => {
    const wrapper = mount(SpecRenderer, {
      props: {
        spec: '[]',
      },
      global: {
        stubs: {
          SpecDocument: true,
          SpecRendererToc: true,
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('opens the slideout toc and renders its content when the trigger button is clicked', async () => {
    const wrapper = mount(SpecRenderer, {
      attachTo: document.body,
      props: {
        spec: minimalOpenApiSpec,
      },
      global: {
        stubs: {
          SpecDocument: true,
          SpecRendererToc: true,
        },
      },
    })

    await flushPromises()

    const slideoutContainer = wrapper.find('[data-testid="slideout-container"]')
    expect(slideoutContainer.exists()).toBe(true)
    expect(slideoutContainer.isVisible()).toBe(false)

    await wrapper.find('[data-testid="slideout-toc-trigger-button"]').trigger('click')
    await flushPromises()

    expect(slideoutContainer.isVisible()).toBe(true)
    expect(slideoutContainer.findComponent({ name: 'SpecRendererToc' }).exists()).toBe(true)

    wrapper.unmount()
  })
})
