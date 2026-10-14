import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import SlideOut from './SlideOut.vue'

describe('<SlideOut />', () => {
  beforeAll(() => {
    // jsdom doesn't implement document.scrollingElement; browsers resolve it to
    // document.documentElement for standards-mode documents.
    Object.defineProperty(document, 'scrollingElement', {
      configurable: true,
      value: document.documentElement,
    })
  })

  afterEach(() => {
    document.scrollingElement?.classList.remove('spec-renderer-no-scroll')
    document.querySelectorAll('.spec-renderer-no-scroll').forEach(el => el.classList.remove('spec-renderer-no-scroll'))
  })

  it('locks the document scrolling element by default when opened, and unlocks on close', async () => {
    const wrapper = mount(SlideOut, {
      props: { visible: false },
    })

    expect(document.scrollingElement?.classList.contains('spec-renderer-no-scroll')).toBe(false)

    await wrapper.setProps({ visible: true })
    expect(document.scrollingElement?.classList.contains('spec-renderer-no-scroll')).toBe(true)

    await wrapper.setProps({ visible: false })
    expect(document.scrollingElement?.classList.contains('spec-renderer-no-scroll')).toBe(false)
  })

  it('locks a host-provided scroll container instead of the document when documentScrollingContainer is set', async () => {
    const customScrollContainer = document.createElement('div')
    customScrollContainer.className = 'custom-scroll-container'
    document.body.appendChild(customScrollContainer)

    const wrapper = mount(SlideOut, {
      props: {
        visible: false,
        documentScrollingContainer: '.custom-scroll-container',
      },
    })

    await wrapper.setProps({ visible: true })

    expect(customScrollContainer.classList.contains('spec-renderer-no-scroll')).toBe(true)
    expect(document.scrollingElement?.classList.contains('spec-renderer-no-scroll')).toBe(false)

    await wrapper.setProps({ visible: false })
    expect(customScrollContainer.classList.contains('spec-renderer-no-scroll')).toBe(false)

    document.body.removeChild(customScrollContainer)
  })

  it('falls back to the document scrolling element when documentScrollingContainer matches nothing', async () => {
    const wrapper = mount(SlideOut, {
      props: {
        visible: false,
        documentScrollingContainer: '.does-not-exist',
      },
    })

    await wrapper.setProps({ visible: true })

    expect(document.scrollingElement?.classList.contains('spec-renderer-no-scroll')).toBe(true)
  })
})
