import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { resolveSpecSource } from './resolve-spec-source.js'

/** The spec text plus whether the CLI can watch it for changes. */
export interface LoadedSpecSource {
  text: string
  watch: boolean
  /** Absolute path to watch for changes; only set when `watch` is `true`. */
  watchPath?: string
}

/**
 * Reads a spec's text from either a local file or a remote URL.
 *
 * Local files are watchable for live-reload; remote URLs are fetched once
 * and are not watched (there is no local file to observe for changes).
 */
export async function loadSpecSource(arg: string): Promise<LoadedSpecSource> {
  const source = resolveSpecSource(arg)

  if (source.kind === 'file') {
    const watchPath = resolve(source.value)
    const text = await readFile(watchPath, 'utf-8')

    return { text, watch: true, watchPath }
  }

  const response = await fetch(source.value)

  if (!response.ok) {
    throw new Error(`Failed to fetch spec from ${source.value}: ${response.status} ${response.statusText}`)
  }

  return { text: await response.text(), watch: false }
}
