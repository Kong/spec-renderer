import { createServer } from 'node:net'
import { describe, expect, it } from 'vitest'
import { findOpenPort, isPortFree } from './find-open-port.js'

describe('findOpenPort', () => {
  it('returns the start port when it is free', async () => {
    const port = await findOpenPort(5000, async () => true)

    expect(port).toBe(5000)
  })

  it('increments past busy ports until a free one is found', async () => {
    const busy = new Set([5000, 5001])
    const port = await findOpenPort(5000, async (candidate: number) => !busy.has(candidate))

    expect(port).toBe(5002)
  })

  it('throws once maxAttempts candidate ports are all busy', async () => {
    await expect(findOpenPort(5000, async () => false, 3)).rejects.toThrow(/5000/)
  })
})

describe('isPortFree', () => {
  it('resolves true for a port nothing is listening on', async () => {
    await expect(isPortFree(47563)).resolves.toBe(true)
  })

  it('resolves false for a port a live server is already bound to', async () => {
    const server = createServer()
    await new Promise<void>((resolve) => server.listen(0, resolve))
    const { port } = server.address() as { port: number }

    try {
      await expect(isPortFree(port)).resolves.toBe(false)
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })
})
