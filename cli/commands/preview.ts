import { readFile } from 'node:fs/promises'
import pc from 'picocolors'
import { watch, type FSWatcher } from 'chokidar'
import open from 'open'
import { loadSpecSource } from '../spec-source.js'
import { resolveRenderOptions, type PreviewCliFlags } from '../resolve-render-options.js'
import { findOpenPort } from '../find-open-port.js'
import { startPreviewServer } from '../server.js'
import { info, printPreviewBanner } from '../ui.js'

const DEFAULT_PORT = 4757

export interface PreviewCommandFlags extends PreviewCliFlags {
  port?: number
  open?: boolean
}

/**
 * Runs the `preview` command: loads the spec, starts the local preview
 * server, watches the spec file for changes (when it's a local file), and
 * opens the browser.
 *
 * Resolves once the server is up; the process is kept alive by the running
 * server and, when applicable, the file watcher.
 */
export async function runPreviewCommand(specArg: string, flags: PreviewCommandFlags): Promise<void> {
  const source = await loadSpecSource(specArg)
  let specText = source.text

  const port = await findOpenPort(flags.port ?? DEFAULT_PORT)
  const previewServer = await startPreviewServer({
    port,
    getSpecText: () => specText,
    config: resolveRenderOptions(flags),
  })

  const url = `http://localhost:${port}`
  const isWatching = source.watch && !!source.watchPath

  printPreviewBanner([
    { label: 'Spec', value: specArg },
    { label: 'URL', value: pc.bold(pc.underline(url)) },
    { label: 'Reload', value: isWatching ? pc.green('watching for changes') : pc.yellow('not available (remote URL)') },
  ])
  console.log()
  info('Press Ctrl+C to stop')

  let watcher: FSWatcher | undefined

  if (source.watch && source.watchPath) {
    const watchPath = source.watchPath

    watcher = watch(watchPath)
    watcher.on('change', () => {
      readFile(watchPath, 'utf-8')
        .then((text) => {
          specText = text
          previewServer.broadcastReload()
          console.log(`${pc.magenta('↻')} Spec changed, reloading preview...`)
        })
        .catch((readError: unknown) => {
          console.error(`${pc.red('✖')} Failed to reload spec: ${readError instanceof Error ? readError.message : String(readError)}`)
        })
    })
  }

  if (flags.open !== false) {
    await open(url)
  }

  let isShuttingDown = false
  const shutdown = (): void => {
    if (isShuttingDown) {
      return
    }

    isShuttingDown = true

    void Promise.resolve(watcher?.close())
      .then(() => previewServer.close())
      .finally(() => process.exit(0))
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}
