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

  const requestedPort = await findOpenPort(flags.port ?? DEFAULT_PORT)
  const previewServer = await startPreviewServer({
    port: requestedPort,
    getSpecText: () => specText,
    config: resolveRenderOptions(flags),
  })

  // Use the port the server actually bound to, not the requested one - they
  // differ when the requested port is `0` (OS picks any free port).
  const url = `http://localhost:${previewServer.port}`
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
    // Guards against a slower, now-stale read completing after a newer one -
    // e.g. two rapid saves in quick succession - and clobbering fresher content.
    let latestChangeToken = 0

    watcher = watch(watchPath, {
      // Some editors/tools write a file's contents in multiple chunks before
      // the save is complete; without this, a `change` event can fire mid-write
      // and be read as truncated/invalid content, surfacing a bogus parse error
      // for what was actually a valid save.
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 20,
      },
    })
    watcher.on('change', () => {
      const changeToken = ++latestChangeToken

      readFile(watchPath, 'utf-8')
        .then((text) => {
          if (changeToken !== latestChangeToken) {
            return
          }

          specText = text
          previewServer.broadcastReload()
          console.log(`${pc.magenta('↻')} Spec changed, reloading preview...`)
        })
        .catch((readError: unknown) => {
          console.error(`${pc.red('✖')} Failed to reload spec: ${readError instanceof Error ? readError.message : String(readError)}`)
        })
    })
    watcher.on('unlink', () => {
      console.error(`${pc.red('✖')} Spec file was deleted or moved - live reload has stopped. The preview will keep showing its last-known content.`)
    })
    watcher.on('error', (watchError: unknown) => {
      console.error(`${pc.red('✖')} File watcher error: ${watchError instanceof Error ? watchError.message : String(watchError)}`)
    })
  }

  let isShuttingDown = false
  const shutdown = (): void => {
    if (isShuttingDown) {
      return
    }

    isShuttingDown = true

    void Promise.resolve(watcher?.close())
      .then(() => previewServer.close())
      .catch((shutdownError: unknown) => {
        console.error(`${pc.red('✖')} Error during shutdown: ${shutdownError instanceof Error ? shutdownError.message : String(shutdownError)}`)
      })
      .finally(() => process.exit(0))
  }

  // Registered before opening the browser so the server/watcher always have a
  // clean shutdown path via Ctrl+C, even if the browser launch below fails.
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  if (flags.open !== false) {
    try {
      await open(url)
    } catch (openError) {
      // Opening the browser is a convenience, not essential to the preview
      // working - warn and keep the server/watcher running rather than
      // failing the whole command.
      console.error(`${pc.red('✖')} Failed to open the browser automatically: ${openError instanceof Error ? openError.message : String(openError)}`)
    }
  }
}
