import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AsyncBindingPropertyRow from './AsyncBindingPropertyRow.vue'

describe('<AsyncBindingPropertyRow />', () => {
  describe('primitive value', () => {
    it('renders a flat row for a string value', () => {
      const wrapper = mount(AsyncBindingPropertyRow, {
        props: { propKey: 'topic', value: 'events' },
      })

      expect(wrapper.findTestId('binding-row-topic').exists()).toBe(true)
      expect(wrapper.findTestId('binding-row-topic').text()).toContain('topic')
      expect(wrapper.findTestId('binding-row-topic').text()).toContain('events')
    })

    it('renders a flat row for a number value', () => {
      const wrapper = mount(AsyncBindingPropertyRow, {
        props: { propKey: 'partitions', value: 3 },
      })

      expect(wrapper.findTestId('binding-row-partitions').exists()).toBe(true)
      expect(wrapper.findTestId('binding-row-partitions').text()).toContain('3')
    })
  })

  describe('array value', () => {
    it('renders a flat row with values joined by ", "', () => {
      const wrapper = mount(AsyncBindingPropertyRow, {
        props: { propKey: 'tags', value: ['a', 'b', 'c'] },
      })

      expect(wrapper.findTestId('binding-row-tags').exists()).toBe(true)
      expect(wrapper.find('.binding-value').text()).toBe('a, b, c')
    })
  })

  describe('empty object value', () => {
    it('renders a flat row, not an expandable', () => {
      const wrapper = mount(AsyncBindingPropertyRow, {
        props: { propKey: 'config', value: {} },
      })

      expect(wrapper.findTestId('binding-row-config').exists()).toBe(true)
      expect(wrapper.findTestId('binding-expandable-config').exists()).toBe(false)
    })
  })

  describe('object value', () => {
    it('renders an expandable row', () => {
      const wrapper = mount(AsyncBindingPropertyRow, {
        props: { propKey: 'config', value: { retries: 2 } },
      })

      expect(wrapper.findTestId('binding-expandable-config').exists()).toBe(true)
    })

    it('does not render a flat row', () => {
      const wrapper = mount(AsyncBindingPropertyRow, {
        props: { propKey: 'config', value: { retries: 2 } },
      })

      expect(wrapper.findTestId('binding-row-config').exists()).toBe(false)
    })

    it('shows the parent key in the summary', () => {
      const wrapper = mount(AsyncBindingPropertyRow, {
        props: { propKey: 'config', value: { retries: 2 } },
      })

      expect(wrapper.find('.binding-key--parent').text()).toBe('config')
    })

    it('recursively renders child flat rows for object properties', () => {
      const wrapper = mount(AsyncBindingPropertyRow, {
        props: { propKey: 'config', value: { retries: 2 } },
      })

      expect(wrapper.findTestId('binding-row-retries').exists()).toBe(true)
    })

    it('recursively renders nested expandable rows for deeply nested objects', () => {
      const wrapper = mount(AsyncBindingPropertyRow, {
        props: {
          propKey: 'config',
          value: { deadLetter: { exchange: 'dlx', routingKey: 'dead' } },
        },
      })

      expect(wrapper.findTestId('binding-expandable-deadLetter').exists()).toBe(true)
      expect(wrapper.findTestId('binding-row-exchange').exists()).toBe(true)
      expect(wrapper.findTestId('binding-row-routingKey').exists()).toBe(true)
    })
  })
})
