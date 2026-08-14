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

  it('mounts the slideout inside the spec renderer wrapper', async () => {
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

    let slideout = wrapper.element.querySelector('.slideout-toc')
    expect(slideout).not.toBeNull()

    await wrapper.find('.slideout-toc-trigger-button').trigger('click')
    await flushPromises()

    const rendererWrapper = wrapper.element
    const slideoutTarget = rendererWrapper.querySelector('.spec-renderer-slideout-target-inner')
    slideout = rendererWrapper.querySelector('.slideout-toc')

    expect(slideout).not.toBeNull()
    expect(slideout?.parentElement).toBe(slideoutTarget)
    expect(slideoutTarget?.closest('.spec-renderer-wrapper')).toBe(rendererWrapper)
    expect(document.body.querySelector(':scope > .slideout-toc')).toBeNull()
    expect(document.body.children[document.body.children.length - 1]).not.toBe(slideout)

    wrapper.unmount()
  })
})
