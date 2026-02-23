import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import type { ChannelInterface } from '@asyncapi/parser'
import AsyncChannelBindings from './AsyncChannelBindings.vue'

const makeMockChannel = (bindings: Array<{ protocol: string, value: Record<string, any> }>): ChannelInterface => ({
  bindings: () => ({
    all: () => bindings.map(b => ({
      protocol: () => b.protocol,
      value: <T>() => b.value as T,
    })),
  }),
}) as unknown as ChannelInterface

const singleKafkaChannel = makeMockChannel([{
  protocol: 'kafka',
  value: { topic: 'orders', partitions: 3, bindingVersion: '0.4.0' },
}])

const multiProtocolChannel = makeMockChannel([
  { protocol: 'kafka', value: { topic: 'orders', partitions: 3 } },
  { protocol: 'amqp', value: { exchange: { name: 'events', type: 'topic' } } },
])

const emptyChannel = makeMockChannel([])

describe('<AsyncChannelBindings />', () => {
  describe('with no bindings', () => {
    it('does not render the section', () => {
      const wrapper = mount(AsyncChannelBindings, {
        props: { channel: emptyChannel },
      })

      expect(wrapper.find('.async-channel-bindings').exists()).toBe(false)
    })
  })

  describe('with a single binding', () => {
    it('renders the section', () => {
      const wrapper = mount(AsyncChannelBindings, {
        props: { channel: singleKafkaChannel },
      })

      expect(wrapper.find('.async-channel-bindings').exists()).toBe(true)
    })

    it('shows a badge for the protocol, not a dropdown', () => {
      const wrapper = mount(AsyncChannelBindings, {
        props: { channel: singleKafkaChannel },
      })

      expect(wrapper.findTestId('channel-bindings-protocol-selector').exists()).toBe(false)
      expect(wrapper.text()).toContain('KAFKA')
    })

    it('omits the bindingVersion key from rendered rows', () => {
      const wrapper = mount(AsyncChannelBindings, {
        props: { channel: singleKafkaChannel },
      })

      expect(wrapper.text()).not.toContain('bindingVersion')
    })

    it('renders a flat row for each primitive binding entry', () => {
      const wrapper = mount(AsyncChannelBindings, {
        props: { channel: singleKafkaChannel },
      })

      expect(wrapper.findTestId('binding-row-topic').exists()).toBe(true)
      expect(wrapper.findTestId('binding-row-partitions').exists()).toBe(true)
    })
  })

  describe('with multiple protocols', () => {
    it('shows the SelectDropdown protocol selector', () => {
      const wrapper = mount(AsyncChannelBindings, {
        props: { channel: multiProtocolChannel },
        attachTo: document.body,
      })

      expect(wrapper.findTestId('channel-bindings-protocol-selector').exists()).toBe(true)
    })

    it('renders the first protocol entries by default', () => {
      const wrapper = mount(AsyncChannelBindings, {
        props: { channel: multiProtocolChannel },
        attachTo: document.body,
      })

      expect(wrapper.findTestId('binding-row-topic').exists()).toBe(true)
      expect(wrapper.findTestId('binding-row-partitions').exists()).toBe(true)
    })

    it('renders an expandable row for object binding entries', () => {
      const amqpOnlyChannel = makeMockChannel([
        { protocol: 'amqp', value: { exchange: { name: 'events', type: 'topic' } } },
      ])
      const wrapper = mount(AsyncChannelBindings, {
        props: { channel: amqpOnlyChannel },
      })

      expect(wrapper.findTestId('binding-expandable-exchange').exists()).toBe(true)
    })

    it('switches to the selected protocol entries after protocol change', async () => {
      const wrapper = mount(AsyncChannelBindings, {
        props: { channel: multiProtocolChannel },
        attachTo: document.body,
      })

      await wrapper.findTestId('trigger-button').trigger('click')
      await wrapper.findTestId('amqp-item-trigger').trigger('click')

      expect(wrapper.findTestId('binding-row-topic').exists()).toBe(false)
      expect(wrapper.findTestId('binding-expandable-exchange').exists()).toBe(true)
    })
  })
})
