/** sessionStorage key for the preview page's saved scroll position. */
export const SCROLL_STORAGE_KEY = 'kong-spec-renderer:scroll-position'

/**
 * Where the viewport was, anchored to the section it was in. The document
 * is virtualized (only sections near the viewport stay in the DOM). A raw
 * `scrollY` from the previous page load can point at other content.
 */
export interface SavedSection {
  /** The `{idx}-nodecontainer` id. It stays the same when the spec is unchanged. */
  id: string
  /** The section's `h2` text, to re-find the section after a spec edit. */
  heading: string
  /** How far below the section top the viewport was. */
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
 * `undefined` when the entry is absent, malformed, or not restorable (`y`
 * must be past the top). A malformed `section` drops only the anchor. The
 * entry then still restores by its raw `y`.
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
 * Reads the node path back out of the URL, the inverse of the component's
 * address-bar updates. The URL holds the user's last location, because it
 * survives both live reload and a manual refresh.
 *
 * Returns `undefined` when the URL holds no node path.
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

  // The component writes node URIs with a leading `/`. Accept one without
  // (from a hand-edited URL) instead of failing to match.
  return path.startsWith('/') ? path : `/${path}`
}
