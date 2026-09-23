/* eslint-disable vue/one-component-per-file -- tiny stand-ins for TryItAuth and a flow panel */
import { defineComponent, h, nextTick, ref } from 'vue'
import type { PropType } from 'vue'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, enableAutoUnmount } from '@vue/test-utils'
import type { PreRequestAuthHandler, PreRequestAuthResult } from '@/types'
import usePreRequestAuth from './usePreRequestAuth'

enableAutoUnmount(afterEach)

type Registry = ReturnType<ReturnType<typeof usePreRequestAuth>['providePreRequestAuth']>

// stands in for a flow panel like TryItAuth2ClientCredentials
const Panel = defineComponent({
  props: {
    schemeKey: { type: String, required: true },
    handler: { type: Function as PropType<PreRequestAuthHandler>, required: true },
  },
  setup(props) {
    usePreRequestAuth().registerPreRequestAuth(props.schemeKey, props.handler)
    return () => null
  },
})

// stands in for TryItAuth: owns one endpoint's handler list and renders its flow panels
const mountEndpoint = (panels: Array<{ schemeKey: string, handler: PreRequestAuthHandler }> = []) => {
  let registry!: Registry
  const shown = ref(panels.map(() => true))
  const wrapper = mount(defineComponent({
    setup() {
      registry = usePreRequestAuth().providePreRequestAuth()
      return () => h('div', panels.map((panel, i) => shown.value[i] ? h(Panel, { key: i, ...panel }) : null))
    },
  }))
  return { registry, shown, wrapper }
}

describe('usePreRequestAuth', () => {
  describe('runHandlers', () => {
    it('calls a registered handler once when running its scheme key', async () => {
      const { registerHandler, runHandlers } = mountEndpoint().registry
      const handler = vi.fn().mockResolvedValue({ ok: true })
      registerHandler('scheme-a', handler)

      await runHandlers(['scheme-a'])

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('skips unknown scheme keys and still resolves ok', async () => {
      const { runHandlers } = mountEndpoint().registry

      const result = await runHandlers(['unknown-scheme'])

      expect(result).toEqual({ ok: true })
    })

    it('runs handlers in the order of the passed keys', async () => {
      const { registerHandler, runHandlers } = mountEndpoint().registry
      const order: string[] = []
      registerHandler('scheme-a', async () => {
        order.push('scheme-a')
        return { ok: true }
      })
      registerHandler('scheme-b', async () => {
        order.push('scheme-b')
        return { ok: true }
      })

      await runHandlers(['scheme-b', 'scheme-a'])

      expect(order).toEqual(['scheme-b', 'scheme-a'])
    })

    it('returns the first failed result as-is and does not run a later handler', async () => {
      const { registerHandler, runHandlers } = mountEndpoint().registry
      const later = vi.fn().mockResolvedValue({ ok: true })
      const failResult: PreRequestAuthResult = { ok: false, error: new Error('missing param') }
      registerHandler('scheme-a', async () => failResult)
      registerHandler('scheme-b', later)

      const result = await runHandlers(['scheme-a', 'scheme-b'])

      expect(result).toBe(failResult)
      expect(later).not.toHaveBeenCalled()
    })

    it('catches a thrown error and returns it as ok: false instead of rejecting', async () => {
      const { registerHandler, runHandlers } = mountEndpoint().registry
      const thrown = new Error('boom')
      registerHandler('scheme-a', async () => {
        throw thrown
      })

      await expect(runHandlers(['scheme-a'])).resolves.toEqual({ ok: false, error: thrown })
    })

    // a scheme that declares two flows renders one panel per flow, both under the same key
    it('runs every handler registered for the same scheme key, in order', async () => {
      const { registerHandler, runHandlers } = mountEndpoint().registry
      const order: string[] = []
      registerHandler('scheme-a', async () => {
        order.push('first')
        return { ok: true }
      })
      registerHandler('scheme-a', async () => {
        order.push('second')
        return { ok: true }
      })

      await runHandlers(['scheme-a'])

      expect(order).toEqual(['first', 'second'])
    })

    it('removes only the handler whose unregister function is called', async () => {
      const { registerHandler, runHandlers } = mountEndpoint().registry
      const first = vi.fn().mockResolvedValue({ ok: true })
      const second = vi.fn().mockResolvedValue({ ok: true })
      const unregisterFirst = registerHandler('scheme-a', first)
      registerHandler('scheme-a', second)

      unregisterFirst()
      await runHandlers(['scheme-a'])

      expect(first).not.toHaveBeenCalled()
      expect(second).toHaveBeenCalledTimes(1)
    })
  })

  describe('registerPreRequestAuth', () => {
    it('registers the handler while the panel is mounted and removes it on unmount', async () => {
      const handler = vi.fn().mockResolvedValue({ ok: true })
      const { registry, shown } = mountEndpoint([{ schemeKey: 'scheme-a', handler }])

      await registry.runHandlers(['scheme-a'])
      expect(handler).toHaveBeenCalledTimes(1)

      shown.value = [false]
      await nextTick()
      await registry.runHandlers(['scheme-a'])
      expect(handler).toHaveBeenCalledTimes(1)
    })

    // Regression: the list used to be shared by the whole page and keyed only by scheme key,
    // so one endpoint's panel unmounting removed the handler for every endpoint using that scheme.
    it('keeps each endpoint\'s handlers separate when another endpoint unmounts', async () => {
      const handlerA = vi.fn().mockResolvedValue({ ok: true })
      const handlerB = vi.fn().mockResolvedValue({ ok: true })
      const endpointA = mountEndpoint([{ schemeKey: 'OAuth2', handler: handlerA }])
      const endpointB = mountEndpoint([{ schemeKey: 'OAuth2', handler: handlerB }])

      endpointA.wrapper.unmount()
      await endpointB.registry.runHandlers(['OAuth2'])

      expect(handlerB).toHaveBeenCalledTimes(1)
      expect(handlerA).not.toHaveBeenCalled()
    })

    it('does nothing when there is no endpoint to register with', () => {
      const handler = vi.fn()

      expect(() => mount(Panel, { props: { schemeKey: 'scheme-a', handler } })).not.toThrow()
      expect(handler).not.toHaveBeenCalled()
    })
  })
})
