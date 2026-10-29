/** sessionStorage key for the preview page's saved scroll position. */
export const SCROLL_STORAGE_KEY = 'kong-spec-renderer:scroll-position'

/**
 * Where the viewport was, anchored to the section it was in: the document is
 * virtualized (sections lazily (un)mount, so the mounted set - and therefore
 * absolute positions - differs between page loads), and the same raw
 * `scrollY` can point hundreds of px away from the same content.
 */
export interface SavedSection {
  /** The section's `{idx}-nodecontainer` id - stable across reloads of an unchanged spec. */
  id: string
  /** The section's `h2` text, to re-find the section when a spec edit shifted indices. */
  heading: string
  /** How far below the section's top the viewport was. */
  offsetIn: number
}

export interface SavedScrollPosition {
  href: string
  y: number
  section?: SavedSection
}

function isSavedSection(value: unknown): value is SavedSection {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const { id, heading, offsetIn } = value as Record<string, unknown>

  return typeof id === 'string'
    && typeof heading === 'string'
    && typeof offsetIn === 'number'
    && Number.isFinite(offsetIn)
    && offsetIn >= 0
}

/**
 * Parses the saved scroll position from its sessionStorage form. Returns
 * `undefined` when the entry is absent, malformed, or doesn't represent a
 * restorable position (`y` must be past the top). A malformed `section`
 * drops only the anchor - the entry still restores by its raw `y` - rather
 * than invalidating the whole entry.
 */
export function parseSavedScrollPosition(raw: string | null): SavedScrollPosition | undefined {
  let saved: unknown

  try {
    saved = JSON.parse(raw ?? '{}')
  } catch {
    return undefined
  }

  if (typeof saved !== 'object' || saved === null) {
    return undefined
  }

  const { href, y, section } = saved as Record<string, unknown>

  if (typeof href !== 'string' || typeof y !== 'number' || !Number.isFinite(y) || y <= 0) {
    return undefined
  }

  return isSavedSection(section)
    ? { href, y, section }
    : { href, y }
}

/** Decodes a URL part, tolerating malformed input by returning it as-is. */
export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * Reads the node path back out of the URL, mirroring how the component's own
 * click-driven navigation builds it for each `navigationType` - the component
 * reflects every navigation into the address bar, and the URL survives both
 * live-reload and a manual refresh, so it holds the user's last location.
 *
 * Returns `undefined` when the URL holds no node path (a fresh load in hash
 * mode, or the overview in path mode).
 */
export function nodePathFromUrl(
  navigationType: 'path' | 'hash',
  url: { pathname: string, hash: string },
): string | undefined {
  let raw: string | undefined

  if (navigationType === 'path') {
    raw = url.pathname === '/' ? undefined : url.pathname
  } else {
    raw = url.hash ? url.hash.slice(1) : undefined
  }

  if (raw === undefined) {
    return undefined
  }

  const path = safeDecode(raw)

  // The component only ever writes node URIs with a leading `/` - accept one
  // without (e.g. from a hand-edited URL) rather than failing to match.
  return path.startsWith('/') ? path : `/${path}`
}
