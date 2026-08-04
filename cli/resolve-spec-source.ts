/** Where a spec's raw text should be read from. */
export interface SpecSource {
  kind: 'file' | 'url'
  value: string
}

/**
 * Classifies a CLI spec argument as a local file path or a remote URL.
 *
 * Only `http:`/`https:` URLs are treated as remote sources; anything else
 * (including a value that isn't a valid URL at all) is treated as a local
 * file path.
 */
export function resolveSpecSource(arg: string): SpecSource {
  try {
    const url = new URL(arg)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return { kind: 'url', value: arg }
    }
  } catch {
    // Not a parseable URL - fall through to treating it as a file path.
  }

  return { kind: 'file', value: arg }
}
