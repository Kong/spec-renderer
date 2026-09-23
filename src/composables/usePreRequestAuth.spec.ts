import { describe, it, expect, vi, afterEach } from 'vitest'
import type { PreRequestAuthResult } from '@/types'
import usePreRequestAuth from './usePreRequestAuth'

describe('usePreRequestAuth', () => {
  const { registerPreRequestAuth, unregisterPreRequestAuth, runPreRequestAuth } = usePreRequestAuth()

  afterEach(() => {
    unregisterPreRequestAuth('scheme-a')
    unregisterPreRequestAuth('scheme-b')
    unregisterPreRequestAuth('scheme-c')
  })

  it('calls a registered handler once when running its scheme key', async () => {
    const handler = vi.fn().mockResolvedValue(undefined)
    registerPreRequestAuth('scheme-a', handler)

    await runPreRequestAuth(['scheme-a'])

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('skips unknown scheme keys and still resolves ok', async () => {
    const result = await runPreRequestAuth(['unknown-scheme'])

    expect(result).toEqual({ ok: true })
  })

  it('runs handlers in the order of the passed keys', async () => {
    const order: string[] = []
    registerPreRequestAuth('scheme-a', () => {
      order.push('scheme-a')
      return undefined
    })
    registerPreRequestAuth('scheme-b', () => {
      order.push('scheme-b')
      return undefined
    })

    await runPreRequestAuth(['scheme-b', 'scheme-a'])

    expect(order).toEqual(['scheme-b', 'scheme-a'])
  })

  it('treats an undefined return as nothing to do', async () => {
    registerPreRequestAuth('scheme-a', () => undefined)

    const result = await runPreRequestAuth(['scheme-a'])

    expect(result).toEqual({ ok: true })
  })

  it('continues past an ok Response and still runs a later handler', async () => {
    const later = vi.fn().mockResolvedValue(undefined)
    const okResponse = new Response(null, { status: 200 })
    registerPreRequestAuth('scheme-a', () => okResponse)
    registerPreRequestAuth('scheme-b', later)

    const result = await runPreRequestAuth(['scheme-a', 'scheme-b'])

    expect(result.ok).toBe(true)
    // the successful response is carried through for callers that need the raw token response
    expect(result.response).toBe(okResponse)
    expect(later).toHaveBeenCalledTimes(1)
  })

  it('short-circuits on a non-ok Response and does not run a later handler', async () => {
    const later = vi.fn().mockResolvedValue(undefined)
    const badResponse = new Response(null, { status: 400 })
    registerPreRequestAuth('scheme-a', () => badResponse)
    registerPreRequestAuth('scheme-b', later)

    const result = await runPreRequestAuth(['scheme-a', 'scheme-b'])

    expect(result).toEqual({ ok: false, response: badResponse })
    expect(later).not.toHaveBeenCalled()
  })

  it('returns an PreRequestAuthResult with ok: false as-is, short-circuiting', async () => {
    const later = vi.fn().mockResolvedValue(undefined)
    const failResult: PreRequestAuthResult = { ok: false, error: new Error('missing param') }
    registerPreRequestAuth('scheme-a', () => failResult)
    registerPreRequestAuth('scheme-b', later)

    const result = await runPreRequestAuth(['scheme-a', 'scheme-b'])

    expect(result).toBe(failResult)
    expect(later).not.toHaveBeenCalled()
  })

  it('catches a thrown error and returns it as ok: false instead of rejecting', async () => {
    const thrown = new Error('boom')
    registerPreRequestAuth('scheme-a', () => {
      throw thrown
    })

    await expect(runPreRequestAuth(['scheme-a'])).resolves.toEqual({ ok: false, error: thrown })
  })

  it('removes a handler via unregisterPreRequestAuth', async () => {
    const handler = vi.fn().mockResolvedValue(undefined)
    registerPreRequestAuth('scheme-a', handler)
    unregisterPreRequestAuth('scheme-a')

    const result = await runPreRequestAuth(['scheme-a'])

    expect(handler).not.toHaveBeenCalled()
    expect(result).toEqual({ ok: true })
  })

  // Regression guard: the try-it specs build hand-rolled Response doubles (see
  // TryItResponse.spec.ts) because jsdom's Headers/Response are awkward. Those are not
  // `instanceof Response`, so a plain instanceof check would misroute them into the
  // PreRequestAuthResult branch and drop the response from the failure result.
  it('treats a hand-rolled Response double as a Response, not a result', async () => {
    const fake = { ok: false, status: 400, statusText: 'Bad Request' } as unknown as Response
    const later = vi.fn().mockResolvedValue(undefined)
    registerPreRequestAuth('scheme-a', vi.fn().mockResolvedValue(fake))
    registerPreRequestAuth('scheme-b', later)

    const result = await runPreRequestAuth(['scheme-a', 'scheme-b'])

    expect(result).toEqual({ ok: false, response: fake })
    expect(result.response).toBe(fake)
    expect(later).not.toHaveBeenCalled()
  })

  it('continues past an ok hand-rolled Response double', async () => {
    const fake = { ok: true, status: 200 } as unknown as Response
    const later = vi.fn().mockResolvedValue(undefined)
    registerPreRequestAuth('scheme-a', vi.fn().mockResolvedValue(fake))
    registerPreRequestAuth('scheme-b', later)

    const result = await runPreRequestAuth(['scheme-a', 'scheme-b'])

    expect(result.ok).toBe(true)
    expect(result.response).toBe(fake)
    expect(later).toHaveBeenCalledTimes(1)
  })

  it('replaces the previous handler when re-registering the same key', async () => {
    const first = vi.fn().mockResolvedValue(undefined)
    const second = vi.fn().mockResolvedValue(undefined)
    registerPreRequestAuth('scheme-a', first)
    registerPreRequestAuth('scheme-a', second)

    await runPreRequestAuth(['scheme-a'])

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
