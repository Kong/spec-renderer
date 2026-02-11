import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CodeBlock from './CodeBlock.vue'

describe('<CodeBlock /> isResizable', () => {
  it('does not apply is-resizable class by default', () => {
    const wrapper = mount(CodeBlock, {
      props: {
        code: 'const x = 1;',
        lang: 'javascript',
      },
    })

    expect(wrapper.classes()).not.toContain('is-resizable')
  })

  it('applies is-resizable class when isResizable is true', () => {
    const wrapper = mount(CodeBlock, {
      props: {
        code: 'const x = 1;',
        lang: 'javascript',
        isResizable: true,
      },
    })

    expect(wrapper.classes()).toContain('is-resizable')
  })

  it('does not apply is-resizable class when isResizable is false', () => {
    const wrapper = mount(CodeBlock, {
      props: {
        code: 'const x = 1;',
        lang: 'javascript',
        isResizable: false,
      },
    })

    expect(wrapper.classes()).not.toContain('is-resizable')
  })
})
