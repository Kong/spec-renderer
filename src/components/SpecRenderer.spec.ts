// Vitest unit test spec file

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SpecRenderer from './SpecRenderer.vue'

vi.mock('../composables', async () => {
  const { ref } = await import('vue')

  return {
    default: {
      useSchemaParser: () => ({
        parseSpecDocument: vi.fn().mockResolvedValue({ parsedDocument: undefined, tableOfContents: undefined }),
        parsedDocument: ref({ name: 'Test API' }),
        tableOfContents: ref([{ id: '/', title: 'Overview' }]),
      }),
    },
  }
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
        spec: '[]',
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
