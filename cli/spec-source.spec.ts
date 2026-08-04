import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadSpecSource } from './spec-source.js'

describe('loadSpecSource', () => {
  const cleanups: Array<() => Promise<void> | void> = []

  afterEach(async () => {
    while (cleanups.length) {
      await cleanups.pop()?.()
    }
  })

  it('reads a local file and marks it as watchable', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'spec-renderer-cli-'))
    const filePath = join(dir, 'openapi.yaml')
    await writeFile(filePath, 'openapi: 3.0.0', 'utf-8')

    const result = await loadSpecSource(filePath)

    expect(result).toEqual({ text: 'openapi: 3.0.0', watch: true, watchPath: filePath })
  })

  it('rejects when the local file does not exist', async () => {
    await expect(loadSpecSource('/definitely/does/not/exist/openapi.yaml')).rejects.toThrow()
  })

  it('fetches a remote URL and marks it as not watchable', async () => {
    const server = createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/plain', connection: 'close' })
      res.end('openapi: 3.0.0')
    })
    server.keepAliveTimeout = 0
    await new Promise<void>((resolve) => server.listen(0, resolve))
    cleanups.push(() => new Promise<void>((resolve) => server.close(() => resolve())))
    const { port } = server.address() as AddressInfo

    const result = await loadSpecSource(`http://127.0.0.1:${port}/openapi.yaml`)

    expect(result).toEqual({ text: 'openapi: 3.0.0', watch: false })
  })

  it('rejects when the remote URL responds with an error status', async () => {
    const server = createServer((_req, res) => {
      res.writeHead(404, { connection: 'close' })
      res.end('not found')
    })
    server.keepAliveTimeout = 0
    await new Promise<void>((resolve) => server.listen(0, resolve))
    cleanups.push(() => new Promise<void>((resolve) => server.close(() => resolve())))
    const { port } = server.address() as AddressInfo

    await expect(loadSpecSource(`http://127.0.0.1:${port}/openapi.yaml`)).rejects.toThrow()
  })
})
