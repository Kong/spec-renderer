import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { request as httpRequest } from 'node:http'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import WebSocket from 'ws'
import { afterEach, describe, expect, it } from 'vitest'
import { startPreviewServer, type PreviewServer } from './server.js'
import type { RenderOptions } from './resolve-render-options.js'

/**
 * Issues a raw HTTP GET with `path` sent verbatim as the request-line path.
 *
 * Unlike `fetch()`/`new URL()`, this does not normalize `../` segments
 * client-side before sending - needed to test the server's own traversal
 * guard, since `fetch()` would silently resolve `/assets/../../secret.txt`
 * down to `/secret.txt` before the request even leaves the client.
 */
function rawGet(port: number, path: string): Promise<{ status: number, body: string }> {
  return new Promise((resolve, reject) => {
    const req = httpRequest({ host: 'localhost', port, path }, (res) => {
      let body = ''

      res.on('data', (chunk: Buffer) => {
        body += chunk.toString('utf-8')
      })
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }))
    })

    req.on('error', reject)
    req.end()
  })
}

const CONFIG: RenderOptions = {
  hideInternal: false,
  hideDeprecated: false,
  hideSchemas: false,
  hideTryIt: false,
  hideInsomniaTryIt: false,
  traceParsing: false,
  withCredentials: false,
  allowContentScrolling: true,
  allowCustomServerUrl: true,
  hideNavigationButtons: true,
  hideDownloadButton: false,
  enableOperationLinks: false,
  showPoweredBy: true,
  navigationType: 'path',
  controlAddressBar: true,
}

async function makeFixtureDirs(): Promise<{ distDir: string, previewPageDir: string }> {
  const distDir = await mkdtemp(join(tmpdir(), 'spec-renderer-cli-dist-'))
  const previewPageDir = await mkdtemp(join(tmpdir(), 'spec-renderer-cli-preview-page-'))

  await writeFile(join(distDir, 'kong-spec-renderer.web-component.es.js'), 'export {}', 'utf-8')
  await writeFile(join(distDir, 'spec-renderer.css'), 'body { color: red; }', 'utf-8')
  await mkdir(join(distDir, 'nested'), { recursive: true })
  await writeFile(join(distDir, 'nested', 'chunk-abc123.js'), 'export const chunk = true', 'utf-8')
  await writeFile(join(previewPageDir, 'index.html'), '<html><body>fixture page</body></html>', 'utf-8')
  await writeFile(join(previewPageDir, 'client.js'), 'console.log("fixture client")', 'utf-8')

  return { distDir, previewPageDir }
}

describe('startPreviewServer', () => {
  const servers: PreviewServer[] = []

  afterEach(async () => {
    while (servers.length) {
      await servers.pop()?.close()
    }
  })

  async function start(getSpecText: () => string = () => 'openapi: 3.0.0'): Promise<{ server: PreviewServer, baseUrl: string, distDir: string }> {
    const { distDir, previewPageDir } = await makeFixtureDirs()
    const server = await startPreviewServer({
      port: 0,
      getSpecText,
      config: CONFIG,
      distDir,
      previewPageDir,
    })

    servers.push(server)

    return { server, baseUrl: `http://localhost:${server.port}`, distDir }
  }

  it('binds to a real OS-assigned port when port 0 is requested, not the literal 0', async () => {
    const { server } = await start()

    expect(server.port).not.toBe(0)
    expect(server.port).toBeGreaterThan(0)
  })

  it('rejects cleanly rather than crashing when the requested port is already in use', async () => {
    const { server: firstServer } = await start()
    const { distDir, previewPageDir } = await makeFixtureDirs()

    // Regression: without an 'error' listener on the underlying http.Server,
    // this EADDRINUSE would throw as an unhandled 'error' event instead of
    // rejecting the returned promise.
    await expect(startPreviewServer({
      port: firstServer.port,
      getSpecText: () => 'openapi: 3.0.0',
      config: CONFIG,
      distDir,
      previewPageDir,
    })).rejects.toThrow()
  })

  it('serves the current spec text at /spec', async () => {
    let specText = 'openapi: 3.0.0'
    const { baseUrl } = await start(() => specText)

    const response = await fetch(`${baseUrl}/spec`)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/plain')
    expect(await response.text()).toBe('openapi: 3.0.0')

    // getSpecText is called fresh on every request - not cached from server start.
    specText = 'openapi: 3.1.0'
    const secondResponse = await fetch(`${baseUrl}/spec`)

    expect(await secondResponse.text()).toBe('openapi: 3.1.0')
  })

  it('serves the render config as JSON at /config', async () => {
    const { baseUrl } = await start()

    const response = await fetch(`${baseUrl}/config`)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toEqual(CONFIG)
  })

  it('serves the preview page at /', async () => {
    const { baseUrl } = await start()

    const response = await fetch(`${baseUrl}/`)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(await response.text()).toContain('fixture page')
  })

  it('serves the client script at /client.js', async () => {
    const { baseUrl } = await start()

    const response = await fetch(`${baseUrl}/client.js`)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/javascript')
    expect(await response.text()).toContain('fixture client')
  })

  it('serves a top-level dist asset with the correct content type', async () => {
    const { baseUrl } = await start()

    const cssResponse = await fetch(`${baseUrl}/assets/spec-renderer.css`)

    expect(cssResponse.status).toBe(200)
    expect(cssResponse.headers.get('content-type')).toContain('text/css')
    expect(await cssResponse.text()).toBe('body { color: red; }')
  })

  it('serves a nested dist asset - the bundle is code-split into subdirectory chunks', async () => {
    const { baseUrl } = await start()

    const response = await fetch(`${baseUrl}/assets/nested/chunk-abc123.js`)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/javascript')
    expect(await response.text()).toBe('export const chunk = true')
  })

  it('returns 404 for an asset that does not exist', async () => {
    const { baseUrl } = await start()

    const response = await fetch(`${baseUrl}/assets/does-not-exist.js`)

    expect(response.status).toBe(404)
  })

  it('returns 404 rather than escaping distDir for a path-traversal attempt', async () => {
    const { server, distDir } = await start()

    // distDir and secretDir are both direct mkdtemp children of tmpdir() with
    // unpredictable, securely-created names/permissions (unlike a fixed or
    // pid-derived path directly under the shared tmpdir), so a single `../`
    // plus secretDir's name reaches it from inside `/assets/`.
    expect(dirname(distDir)).toBe(tmpdir())

    const secretDir = await mkdtemp(join(tmpdir(), 'spec-renderer-cli-traversal-secret-'))
    const secretPath = join(secretDir, 'secret.txt')

    await writeFile(secretPath, 'top secret contents outside distDir', 'utf-8')

    try {
      // Sent as a raw request (not fetch()) so the literal `../` segment
      // reaches the server unnormalized - see rawGet's doc comment.
      const response = await rawGet(server.port, `/assets/../${basename(secretDir)}/${basename(secretPath)}`)

      expect(response.status).toBe(404)
      expect(response.body).not.toContain('top secret contents')
    } finally {
      await rm(secretDir, { recursive: true })
    }
  })

  it('returns 404 for an unknown route', async () => {
    const { baseUrl } = await start()

    const response = await fetch(`${baseUrl}/this-route-does-not-exist`)

    expect(response.status).toBe(404)
  })

  it('broadcasts a reload message to a connected websocket client', async () => {
    const { server, baseUrl } = await start()
    const wsUrl = baseUrl.replace('http://', 'ws://')
    const client = new WebSocket(wsUrl)

    await new Promise<void>((resolve, reject) => {
      client.once('open', () => resolve())
      client.once('error', reject)
    })

    const messageReceived = new Promise<string>((resolve) => {
      client.once('message', (data) => resolve(data.toString()))
    })

    server.broadcastReload()

    expect(JSON.parse(await messageReceived)).toEqual({ type: 'reload' })

    client.terminate()
  })

  it('closes promptly even with a client still connected (regression: close() must not hang)', async () => {
    const { server, baseUrl } = await start()
    const wsUrl = baseUrl.replace('http://', 'ws://')
    const client = new WebSocket(wsUrl)

    await new Promise<void>((resolve, reject) => {
      client.once('open', () => resolve())
      client.once('error', reject)
    })

    const closed = server.close()
    const timedOut = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 2000))

    const result = await Promise.race([closed.then(() => 'closed' as const), timedOut])

    expect(result).toBe('closed')

    // Remove this server from the cleanup list - it's already closed.
    servers.pop()
  })
})
