import { describe, it, expect, vi, afterEach } from 'vitest'
import type { AuthPreflightResult } from '@/types'
import useAuthPreflight from './useAuthPreflight'

describe('useAuthPreflight', () => {
  const { registerPreflight, unregisterPreflight, runPreflight } = useAuthPreflight()

  afterEach(() => {
    unregisterPreflight('scheme-a')
    unregisterPreflight('scheme-b')
    unregisterPreflight('scheme-c')
  })

  it('calls a registered handler once when running its scheme key', async () => {
    const handler = vi.fn().mockResolvedValue(undefined)
    registerPreflight('scheme-a', handler)

    await runPreflight(['scheme-a'])

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('skips unknown scheme keys and still resolves ok', async () => {
    const result = await runPreflight(['unknown-scheme'])

    expect(result).toEqual({ ok: true })
  })

  it('runs handlers in the order of the passed keys', async () => {
    const order: string[] = []
    registerPreflight('scheme-a', () => {
      order.push('scheme-a')
      return undefined
    })
    registerPreflight('scheme-b', () => {
      order.push('scheme-b')
      return undefined
    })

    await runPreflight(['scheme-b', 'scheme-a'])

    expect(order).toEqual(['scheme-b', 'scheme-a'])
  })

  it('treats an undefined return as nothing to do', async () => {
    registerPreflight('scheme-a', () => undefined)

    const result = await runPreflight(['scheme-a'])

    expect(result).toEqual({ ok: true })
  })

  it('continues past an ok Response and still runs a later handler', async () => {
    const later = vi.fn().mockResolvedValue(undefined)
    const okResponse = new Response(null, { status: 200 })
    registerPreflight('scheme-a', () => okResponse)
    registerPreflight('scheme-b', later)

    const result = await runPreflight(['scheme-a', 'scheme-b'])

    expect(result.ok).toBe(true)
    // the successful response is carried through for callers that need the raw token response
    expect(result.response).toBe(okResponse)
    expect(later).toHaveBeenCalledTimes(1)
  })

  it('short-circuits on a non-ok Response and does not run a later handler', async () => {
    const later = vi.fn().mockResolvedValue(undefined)
    const badResponse = new Response(null, { status: 400 })
    registerPreflight('scheme-a', () => badResponse)
    registerPreflight('scheme-b', later)

    const result = await runPreflight(['scheme-a', 'scheme-b'])

    expect(result).toEqual({ ok: false, response: badResponse })
    expect(later).not.toHaveBeenCalled()
  })

  it('returns an AuthPreflightResult with ok: false as-is, short-circuiting', async () => {
    const later = vi.fn().mockResolvedValue(undefined)
    const failResult: AuthPreflightResult = { ok: false, error: new Error('missing param') }
    registerPreflight('scheme-a', () => failResult)
    registerPreflight('scheme-b', later)

    const result = await runPreflight(['scheme-a', 'scheme-b'])

    expect(result).toBe(failResult)
    expect(later).not.toHaveBeenCalled()
  })

  it('catches a thrown error and returns it as ok: false instead of rejecting', async () => {
    const thrown = new Error('boom')
    registerPreflight('scheme-a', () => {
      throw thrown
    })

    await expect(runPreflight(['scheme-a'])).resolves.toEqual({ ok: false, error: thrown })
  })

  it('removes a handler via unregisterPreflight', async () => {
    const handler = vi.fn().mockResolvedValue(undefined)
    registerPreflight('scheme-a', handler)
    unregisterPreflight('scheme-a')

    const result = await runPreflight(['scheme-a'])

    expect(handler).not.toHaveBeenCalled()
    expect(result).toEqual({ ok: true })
  })

  // Regression guard: the try-it specs build hand-rolled Response doubles (see
  // TryItResponse.spec.ts) because jsdom's Headers/Response are awkward. Those are not
  // `instanceof Response`, so a plain instanceof check would misroute them into the
  // AuthPreflightResult branch and drop the response from the failure result.
  it('treats a hand-rolled Response double as a Response, not a result', async () => {
    const fake = { ok: false, status: 400, statusText: 'Bad Request' } as unknown as Response
    const later = vi.fn().mockResolvedValue(undefined)
    registerPreflight('scheme-a', vi.fn().mockResolvedValue(fake))
    registerPreflight('scheme-b', later)

    const result = await runPreflight(['scheme-a', 'scheme-b'])

    expect(result).toEqual({ ok: false, response: fake })
    expect(result.response).toBe(fake)
    expect(later).not.toHaveBeenCalled()
  })

  it('continues past an ok hand-rolled Response double', async () => {
    const fake = { ok: true, status: 200 } as unknown as Response
    const later = vi.fn().mockResolvedValue(undefined)
    registerPreflight('scheme-a', vi.fn().mockResolvedValue(fake))
    registerPreflight('scheme-b', later)

    const result = await runPreflight(['scheme-a', 'scheme-b'])

    expect(result.ok).toBe(true)
    expect(result.response).toBe(fake)
    expect(later).toHaveBeenCalledTimes(1)
  })

  it('replaces the previous handler when re-registering the same key', async () => {
    const first = vi.fn().mockResolvedValue(undefined)
    const second = vi.fn().mockResolvedValue(undefined)
    registerPreflight('scheme-a', first)
    registerPreflight('scheme-a', second)

    await runPreflight(['scheme-a'])

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
