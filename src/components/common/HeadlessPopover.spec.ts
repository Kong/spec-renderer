import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import Popover from './HeadlessPopover.vue'
import { PopoverPlacementVariants } from '@/types'

describe('<HeadlessPopover />', () => {
  describe('placement', () => {
    PopoverPlacementVariants.forEach((placement) => {
      it(`displays popover with placement: ${placement}`, async () => {
        const wrapper = shallowMount(Popover, {
          props: {
            placement,
          },
          slots: {
            default: '<button data-testid="trigger">Trigger</button>',
          },
          attachTo: document.body, // required for any interaction with the DOM to work
        })

        await wrapper.findTestId('trigger').trigger('click')

        expect(wrapper.findTestId('popover-container').classes()).toContain(`popover-${placement}`)
      })
    })
  })

  describe('general', () => {
    it('displays popover trigger passed through slot', () => {
      const wrapper = shallowMount(Popover, {
        slots: {
          default: '<button data-testid="trigger">Trigger</button>',
        },
      })

      expect(wrapper.findTestId('popover').exists()).toBe(true)
      expect(wrapper.findTestId('popover').isVisible()).toBe(true)
      expect(wrapper.findTestId('trigger').exists()).toBe(true)
      expect(wrapper.findTestId('trigger').isVisible()).toBe(true)
    })

    it('opens popover when trigger is clicked', async () => {
      const wrapper = shallowMount(Popover, {
        slots: {
          default: '<button data-testid="trigger">Trigger</button>',
        },
        attachTo: document.body, // required for any interaction with the DOM to work
      })

      // popover content is not visible by default
      expect(wrapper.findTestId('popover-container').exists()).toBe(false)

      await wrapper.findTestId('trigger').trigger('click')

      expect(wrapper.emitted('open')?.length).toBe(1)
      expect(wrapper.findTestId('popover-container').isVisible()).toBe(true)
    })

    it('displays popover content passed through slot when open', async () => {
      const wrapper = shallowMount(Popover, {
        slots: {
          default: '<button data-testid="trigger">Trigger</button>',
          content: '<div data-testid="content">Content</div>',
        },
        attachTo: document.body, // required for any interaction with the DOM to work
      })

      // popover content is not visible by default
      expect(wrapper.findTestId('content').exists()).toBe(false)

      await wrapper.findTestId('trigger').trigger('click')

      // popover content is visible after click is triggered
      expect(wrapper.findTestId('content').exists()).toBe(true)
      expect(wrapper.findTestId('content').isVisible()).toBe(true)
    })

    it('opens popover when trigger is hovered and `openOnMouseover` prop is true', async () => {
      const wrapper = shallowMount(Popover, {
        props: {
          openOnMouseover: true,
        },
        slots: {
          default: '<button data-testid="trigger">Trigger</button>',
        },
        attachTo: document.body, // required for any interaction with the DOM to work
      })

      expect(wrapper.findTestId('popover-container').exists()).toBe(false)

      await wrapper.findTestId('trigger').trigger('mouseenter')

      expect(wrapper.emitted('open')?.length).toBe(1)
      expect(wrapper.findTestId('popover-container').isVisible()).toBe(true)
    })

    it('does not trigger open popover action when disabled', async () => {
      const wrapper = shallowMount(Popover, {
        props: {
          disabled: true,
        },
        slots: {
          default: '<button data-testid="trigger">Trigger</button>',
        },
        attachTo: document.body, // required for any interaction with the DOM to work
      })

      expect(wrapper.findTestId('popover-container').exists()).toBe(false)

      await wrapper.findTestId('trigger').trigger('click')

      expect(wrapper.emitted('open')).toBeUndefined()
      expect(wrapper.findTestId('popover-container').exists()).toBe(false)
    })

    it('binds classes to popover element correctly', async () => {
      const wrapper = shallowMount(Popover, {
        slots: {
          default: '<button data-testid="trigger">Trigger</button>',
        },
        props: {
          popoverClasses: 'custom-class',
        },
        attachTo: document.body, // required for any interaction with the DOM to work
      })

      await wrapper.findTestId('trigger').trigger('click')
      expect(wrapper.findTestId('popover-container').classes()).toContain('custom-class')
    })
  })
})
