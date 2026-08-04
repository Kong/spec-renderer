import { createServer as createHttpServer, type Server as HttpServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AddressInfo } from 'node:net'
import { WebSocketServer } from 'ws'
import type { RenderOptions } from './resolve-render-options.js'

const currentDir = dirname(fileURLToPath(import.meta.url))
// The preview server ships inside the package's own dist/ output (dist/cli/server.js),
// so the already-built web-component bundle sits one directory up.
const DEFAULT_DIST_DIR = dirname(currentDir)
const DEFAULT_PREVIEW_PAGE_DIR = join(currentDir, 'preview-page')

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.map': 'application/json',
  '.wasm': 'application/wasm',
  '.json': 'application/json',
}

/**
 * Resolves an `/assets/*` request path against `distDir`, returning
 * `undefined` if the path would escape it.
 *
 * The web-component bundle is code-split (syntax-highlighting language
 * grammars/themes, etc.), so the browser fetches an open-ended set of
 * relatively-imported chunk files from `dist/` at runtime - not just the
 * entry bundle and its stylesheet.
 */
function resolveDistAsset(distDir: string, requestPath: string): string | undefined {
  const candidate = join(distDir, requestPath)

  if (relative(distDir, candidate).startsWith('..')) {
    return undefined
  }

  return candidate
}

export interface PreviewServer {
  server: HttpServer
  /**
   * The port the server actually bound to. May differ from the requested
   * port - e.g. requesting port `0` asks the OS to assign any free port.
   */
  port: number
  /** Broadcasts a reload signal to every connected preview page. */
  broadcastReload: () => void
  close: () => Promise<void>
}

export interface StartPreviewServerOptions {
  port: number
  /** Returns the current spec text; called fresh on every `/spec` request. */
  getSpecText: () => string
  config: RenderOptions
  /** Directory `/assets/*` is served from. Defaults to the package's built `dist/` directory. */
  distDir?: string
  /** Directory containing the preview page's `index.html`/`client.js`. Defaults to the CLI's own `preview-page/` directory. */
  previewPageDir?: string
}

/**
 * Starts the CLI's local preview server: a minimal static file server for the
 * preview page and the package's own built web-component assets, plus a
 * WebSocket channel used to tell the page to reload when the watched spec
 * file changes.
 */
export async function startPreviewServer(options: StartPreviewServerOptions): Promise<PreviewServer> {
  const distDir = options.distDir ?? DEFAULT_DIST_DIR
  const previewPageDir = options.previewPageDir ?? DEFAULT_PREVIEW_PAGE_DIR

  const server = createHttpServer((req, res) => {
    void handleRequest(req.url, options, distDir, previewPageDir).then(({ status, body, contentType }) => {
      res.writeHead(status, contentType ? { 'content-type': contentType } : undefined)
      res.end(body)
    }).catch((error: unknown) => {
      res.writeHead(500, { 'content-type': 'text/plain' })
      res.end(`Internal server error: ${error instanceof Error ? error.message : String(error)}`)
    })
  })

  const wss = new WebSocketServer({ server })

  // Without an 'error' listener, a failed listen() (e.g. EADDRINUSE from a
  // TOCTOU race against find-open-port.ts's earlier probe) throws and crashes
  // the process instead of rejecting cleanly through the CLI's own error path.
  // `ws`'s WebSocketServer re-emits the underlying http.Server's 'error' event
  // on itself, so the listener has to guard `wss`, not just `server` - an
  // unhandled 'error' on the WebSocketServer instance crashes just the same.
  await new Promise<void>((resolve, reject) => {
    const onListenError = (error: unknown): void => reject(error)

    server.once('error', onListenError)
    wss.once('error', onListenError)
    server.listen(options.port, () => {
      server.off('error', onListenError)
      wss.off('error', onListenError)
      resolve()
    })
  })

  // A runtime error after startup (e.g. a transient socket error) should be
  // logged, not left to crash the process as an unhandled 'error' event.
  server.on('error', (error) => {
    console.error(`Preview server error: ${error instanceof Error ? error.message : String(error)}`)
  })
  wss.on('error', (error) => {
    console.error(`Preview server error: ${error instanceof Error ? error.message : String(error)}`)
  })

  const address = server.address()
  // `address()` returns a string for a Unix socket/pipe, never the case here
  // since we always listen on a numeric port - but guard rather than assume.
  const port = typeof address === 'object' && address !== null ? (address as AddressInfo).port : options.port

  return {
    server,
    port,
    broadcastReload: () => {
      const message = JSON.stringify({ type: 'reload' })

      for (const client of wss.clients) {
        if (client.readyState === client.OPEN) {
          client.send(message)
        }
      }
    },
    close: () => new Promise((resolve, reject) => {
      // wss.close()/server.close() only invoke their callback once every
      // connection has ended on its own - with a preview tab left open,
      // that never happens. Force-terminate everything so shutdown is prompt
      // regardless of what's still connected.
      for (const client of wss.clients) {
        client.terminate()
      }
      server.closeAllConnections()

      wss.close(() => {
        server.close((error) => error ? reject(error) : resolve())
      })
    }),
  }
}

async function handleRequest(
  url: string | undefined,
  options: StartPreviewServerOptions,
  distDir: string,
  previewPageDir: string,
): Promise<{ status: number, body?: string | Buffer, contentType?: string }> {
  if (url === '/spec') {
    return { status: 200, body: options.getSpecText(), contentType: 'text/plain; charset=utf-8' }
  }

  if (url === '/config') {
    return { status: 200, body: JSON.stringify(options.config), contentType: 'application/json' }
  }

  if (url === '/' || url === '/index.html') {
    const body = await readFile(join(previewPageDir, 'index.html'), 'utf-8')

    return { status: 200, body, contentType: 'text/html; charset=utf-8' }
  }

  if (url === '/client.js') {
    const body = await readFile(join(previewPageDir, 'client.js'))

    return { status: 200, body, contentType: 'text/javascript' }
  }

  if (url?.startsWith('/assets/')) {
    const assetPath = resolveDistAsset(distDir, url.slice('/assets/'.length))

    if (assetPath) {
      try {
        const body = await readFile(assetPath)

        return { status: 200, body, contentType: CONTENT_TYPES[extname(assetPath)] ?? 'application/octet-stream' }
      } catch {
        // Fall through to 404 below - e.g. the file doesn't exist.
      }
    }
  }

  return { status: 404, body: 'Not found', contentType: 'text/plain' }
}
