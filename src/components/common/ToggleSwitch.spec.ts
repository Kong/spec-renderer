import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ToggleSwitch from './ToggleSwitch.vue'

describe('<ToggleSwitch />', () => {
  it('renders a toggle switch with label', () => {
    const label = 'Toggle Switch'

    const wrapper = mount(ToggleSwitch, {
      props: {
        modelValue: false,
        label,
      },
      attachTo: document.body,
    })

    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('input').isVisible()).toBe(false)
    expect(wrapper.findTestId('switch-control').exists()).toBe(true)
    expect(wrapper.findTestId('switch-control').isVisible()).toBe(true)
    expect(wrapper.find('label').exists()).toBe(true)
    expect(wrapper.find('label').isVisible()).toBe(true)
    expect(wrapper.find('label').text()).toBe(label)
  })

  it('emits events when the switch is toggled', async () => {
    const label = 'Toggle Switch'

    const wrapper: any = mount(ToggleSwitch, {
      props: {
        modelValue: false,
        label,
      },
      attachTo: document.body,
    })

    await wrapper.find('input').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(wrapper.emitted('input')).toBeTruthy()
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  it('handles disabled state correctly', async () => {
    const label = 'Toggle Switch'

    const wrapper = mount(ToggleSwitch, {
      props: {
        modelValue: false,
        label,
        disabled: true,
      },
      attachTo: document.body,
    })

    await wrapper.find('input').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    expect(wrapper.emitted('input')).toBeFalsy()
    expect(wrapper.emitted('change')).toBeFalsy()
  })
})
