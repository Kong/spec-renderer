import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SelectDropdown from './SelectDropdown.vue'

describe('<SelectDropdown />', () => {
  const items = [
    { label: 'Item 1', value: 'item-1' },
    { label: 'Item 2', value: 'item-2', key: 'item-2' },
    { label: 'Item 3', value: 'item-3' },
  ]

  describe('props', () => {
    it('renders dropdown items and trigger button correctly', async () => {
      const triggerButton = 'Spec Renderer Dropdown'

      const wrapper = mount(SelectDropdown, {
        props: {
          items,
          triggerButton,
        },
        attachTo: document.body, // required for any interaction with the DOM to work
      })

      expect(wrapper.findTestId('select-dropdown').exists()).toBe(true)

      // trigger button
      expect(wrapper.findTestId('trigger-button').exists()).toBe(true)
      expect(wrapper.findTestId('trigger-button').attributes('disabled')).toBeUndefined()
      expect(wrapper.findTestId('trigger-button').text()).toBe(triggerButton)

      await wrapper.findTestId('trigger-button').trigger('click')

      // dropdown items
      // renders 3 items
      expect(wrapper.findAll('li').length).toBe(3)
      // renders 2 items with generic selectors - when item.key is not provided
      expect(wrapper.findAll('li[data-testid="select-item"]').length).toBe(2)
      expect(wrapper.findAll('button[data-testid="select-item-trigger"]').length).toBe(2)
      // renders item 1 correctly - when item.key is not provided
      expect(wrapper.findAll('li[data-testid="select-item"]')[0].exists()).toBe(true)
      expect(wrapper.findAll('button[data-testid="select-item-trigger"]')[0].text()).toBe('Item 1')
      // renders item 2 correctly - when item.key is provided
      expect(wrapper.findTestId('item-2-item').exists()).toBe(true)
      expect(wrapper.findTestId('item-2-item-trigger').text()).toBe('Item 2')
      // renders item 3 correctly - when item.key is not provided
      expect(wrapper.findAll('li[data-testid="select-item"]')[1].exists()).toBe(true)
      expect(wrapper.findAll('button[data-testid="select-item-trigger"]')[1].text()).toBe('Item 3')
    })

    it('displays selected item label in trigger when provided through `modelValue`', () => {
      const wrapper = mount(SelectDropdown, {
        props: {
          items,
          modelValue: 'item-2',
        },
      })

      expect(wrapper.findTestId('trigger-button').text()).toBe('Item 2')
    })

    it('handles disabled state correctly', async () => {
      const wrapper = mount(SelectDropdown, {
        props: {
          items,
          disabled: true,
        },
        attachTo: document.body, // required for any interaction with the DOM to work
      })

      expect(wrapper.findTestId('select-dropdown').exists()).toBe(true)
      expect(wrapper.findTestId('trigger-button').attributes('disabled')).toBe('')

      expect(wrapper.findTestId('item-2-item').exists()).toBe(false)

      await wrapper.findTestId('trigger-button').trigger('click')

      expect(wrapper.findTestId('item-2-item').exists()).toBe(false)
    })
  })

  describe('slots', () => {
    it('behaves correctly when `trigger-content` slot is provided', async () => {
      const triggerContent = 'Spec Renderer Dropdown'

      const wrapper = mount(SelectDropdown, {
        props: {
          items,
        },
        slots: {
          'trigger-content': triggerContent,
        },
        attachTo: document.body, // required for any interaction with the DOM to work
      })

      expect(wrapper.findTestId('trigger-button').exists()).toBe(true)
      expect(wrapper.findTestId('trigger-button').text()).toBe(triggerContent)

      // select any item
      await wrapper.findTestId('trigger-button').trigger('click')
      await wrapper.findTestId('item-2-item-trigger').trigger('click')

      // trigger button should still display the slot content
      expect(wrapper.findTestId('trigger-button').text()).toBe(triggerContent)
    })

    it('behaves correctly when `*-item-content` slot is provided', async () => {
      const triggerButton = 'Spec Renderer Dropdown'
      const itemContent = 'Spec Renderer Item 2'

      const wrapper = mount(SelectDropdown, {
        props: {
          items,
          triggerButton,
        },
        slots: {
          'item-2-item-content': itemContent,
        },
        attachTo: document.body, // required for any interaction with the DOM to work
      })

      // trigger button displays the default content when no item is selected
      expect(wrapper.findTestId('trigger-button').text()).toBe(triggerButton)

      await wrapper.findTestId('trigger-button').trigger('click')

      // renders the slot content
      expect(wrapper.findTestId('item-2-item-trigger').exists()).toBe(true)
      expect(wrapper.findTestId('item-2-item-trigger').text()).toBe(itemContent)

      // select the item
      await wrapper.findTestId('item-2-item-trigger').trigger('click')

      // trigger button should display the selected item slot content
      expect(wrapper.findTestId('trigger-button').text()).toBe(itemContent)
    })

    it('behaves correctly when `*-item` slot is provided', async () => {
      const triggerButton = 'Spec Renderer Dropdown'
      const itemContent = 'Spec Renderer Item 2'
      const itemTestId = 'item-2-custom-item'

      const wrapper = mount(SelectDropdown, {
        props: {
          items,
          triggerButton,
        },
        slots: {
          'item-2-item': `<button data-testid="${itemTestId}">${itemContent}</button>`,
        },
        attachTo: document.body, // required for any interaction with the DOM to work
      })

      // trigger button displays the default content when no item is selected
      expect(wrapper.findTestId('trigger-button').text()).toBe(triggerButton)

      await wrapper.findTestId('trigger-button').trigger('click')

      // renders the slot content
      expect(wrapper.findTestId('item-2-item-trigger').exists()).toBe(false)
      expect(wrapper.findTestId(itemTestId).exists()).toBe(true)
      expect(wrapper.findTestId(itemTestId).text()).toBe(itemContent)

      // select the item
      await wrapper.findTestId(itemTestId).trigger('click')

      // trigger button displays the default content
      expect(wrapper.findTestId('trigger-button').text()).toBe(triggerButton)
    })
  })

  describe('events', () => {
    it('emits `update:modelValue` event when an item is selected', async () => {
      const wrapper = mount(SelectDropdown, {
        props: {
          items,
        },
        attachTo: document.body, // required for any interaction with the DOM to work
      })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()

      await wrapper.findTestId('trigger-button').trigger('click')
      await wrapper.findTestId('item-2-item-trigger').trigger('click')

      expect(wrapper.emitted('update:modelValue')?.length).toBe(1)
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['item-2'])
    })

    it('emits `change` event when an item is selected', async () => {
      const wrapper = mount(SelectDropdown, {
        props: {
          items,
        },
        attachTo: document.body, // required for any interaction with the DOM to work
      })

      expect(wrapper.emitted('change')).toBeUndefined()

      await wrapper.findTestId('trigger-button').trigger('click')
      await wrapper.findTestId('item-2-item-trigger').trigger('click')

      expect(wrapper.emitted('change')?.length).toBe(1)
      expect(wrapper.emitted('change')?.[0]).toEqual([{ label: 'Item 2', value: 'item-2', key: 'item-2' }])
    })
  })
})
