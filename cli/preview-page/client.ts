import {
  nodePathFromUrl,
  parseSavedScrollPosition,
  SCROLL_STORAGE_KEY,
  type SavedScrollPosition,
  type SavedSection,
} from './preview-state.js'

interface PreviewElement extends HTMLElement {
  spec: string
  [prop: string]: unknown
}

const SCROLL_POLL_INTERVAL_MS = 100
/**
 * The first restore can trigger more `scrollY` shifts: the renderer lazily
 * mounts sections around the viewport, and the browser's scroll anchoring
 * compensates. Stay hidden for at least this long after the first restore,
 * re-asserting the offset while the saved anchor still renders in.
 */
const SCROLL_REASSERT_DELAY_MS = 800
/**
 * Give up on restoring after this long. The spec can shrink below the
 * saved offset.
 */
const SCROLL_RESTORE_TIMEOUT_MS = 4000

/**
 * Set by the `path-not-found` handler. The saved position belongs to a
 * section the latest spec edit removed, so a running restore must stop.
 * A scroll-driven hash update must not set this flag. Only a removed
 * section does.
 */
let scrollRestoreCancelled = false

function readSavedScrollPosition(): SavedScrollPosition | undefined {
  try {
    return parseSavedScrollPosition(sessionStorage.getItem(SCROLL_STORAGE_KEY))
  } catch {
    return undefined
  }
}

/**
 * Finds the section the viewport is in, plus the offset within it. See
 * `SavedSection` for why the anchor is needed.
 */
function findActiveSection(): SavedSection | undefined {
  const root = document.getElementById('preview')?.shadowRoot

  if (!root) {
    return undefined
  }

  const y = window.scrollY
  let active: HTMLElement | undefined

  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[id$="-nodecontainer"]'))) {
    if (el.getBoundingClientRect().top + window.scrollY <= y + 1) {
      active = el
    }
  }

  if (!active) {
    return undefined
  }

  return {
    id: active.id,
    heading: active.querySelector('h2')?.textContent?.trim() ?? '',
    offsetIn: Math.max(0, Math.round(y - (active.getBoundingClientRect().top + window.scrollY))),
  }
}

function rememberScrollPosition(): void {
  try {
    sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify({
      href: location.href,
      y: window.scrollY,
      section: findActiveSection(),
    }))
  } catch {
    // Skip when sessionStorage is unavailable (Safari private mode).
  }
}

/**
 * Finds the saved section again: by id when the spec is unchanged, else by
 * heading text when a spec edit shifted the indices.
 */
function findSavedSection(savedSection: SavedSection): HTMLElement | null {
  const root = document.getElementById('preview')?.shadowRoot

  if (!root) {
    return null
  }

  const byId = root.querySelector<HTMLElement>(`#${CSS.escape(savedSection.id)}`)

  if (byId && (byId.querySelector('h2')?.textContent?.trim() ?? '') === savedSection.heading) {
    return byId
  }

  if (savedSection.heading) {
    for (const el of Array.from(root.querySelectorAll<HTMLElement>('[id$="-nodecontainer"]'))) {
      if ((el.querySelector('h2')?.textContent?.trim() ?? '') === savedSection.heading) {
        return el
      }
    }
  }

  return null
}

/**
 * Where to scroll to: the saved section's live position plus the offset
 * within it, measured at call time. The offset within a section always
 * points at the same content. Falls back to the raw `y` when the section
 * is gone.
 */
function scrollTarget(saved: SavedScrollPosition): number {
  if (saved.section === undefined) {
    return saved.y
  }

  const section = findSavedSection(saved.section)

  if (section === null) {
    return saved.y
  }

  return section.getBoundingClientRect().top + window.scrollY + saved.section.offsetIn
}

/**
 * Restores the scroll offset saved by `rememberScrollPosition`. The content
 * renders asynchronously, so the browser's own scroll restoration cannot
 * work. The settling moves the page several times, so the caller keeps the
 * renderer hidden until the offset is final.
 */
function restoreScrollPosition(el: PreviewElement): void {
  const saved = readSavedScrollPosition()

  // The saved entry must belong to the current URL. A deep link must not
  // inherit an older scroll offset.
  if (!saved || saved.href !== location.href) {
    // The caller hides the element when the entry matches at hide time.
    // The URL can move on during the load, so reveal here. The page must
    // never stay hidden.
    el.style.visibility = ''

    return
  }

  let hasInteracted = false

  const reveal = (): void => {
    el.style.visibility = ''
  }

  // User input wins over the restore. Reveal the page and do not move it
  // while the user reads or scrolls.
  for (const type of ['pointerdown', 'wheel', 'keydown', 'touchstart'] as const) {
    window.addEventListener(type, () => {
      hasInteracted = true
      reveal()
    }, { once: true })
  }

  const restore = (): void => {
    const target = scrollTarget(saved)

    if (!scrollRestoreCancelled && !hasInteracted && Math.abs(window.scrollY - target) > 2) {
      window.scrollTo(0, target)
    }
  }

  const startedAt = performance.now()
  let hasRendered = false
  let firstRestoreAt: number | undefined

  /**
   * Whether the saved anchor has rendered. An unmounted section is an
   * empty placeholder: it has no `h2`, so `findSavedSection` cannot match
   * it by heading and `scrollTarget` falls back to the raw `y`. Revealing
   * there would show placeholder geometry with no later correction. A
   * headingless anchor still matches by id, so its placeholder decides.
   * The overall timeout bounds the wait.
   */
  const anchorSettled = (): boolean => {
    if (saved.section === undefined) {
      return true
    }

    const section = findSavedSection(saved.section)

    return section !== null && section.querySelector('.placeholder') === null
  }

  const settle = (): void => {
    // The URL-restored path is invalid. The fallback handler already reset
    // the URL and remounted the overview.
    if (scrollRestoreCancelled) {
      reveal()
      return
    }

    // Gate on the anchored target, or on the raw `y` when no anchor applies.
    // A spec edit can shrink the document above the section. Then the raw
    // `y` is unreachable, but the target is fine. The target is measured
    // live, so sections not yet rendered still fall back to the raw `y`.
    const isRendered = document.documentElement.scrollHeight > Math.min(scrollTarget(saved), saved.y)

    if (isRendered) {
      hasRendered = true
    }

    if (hasRendered) {
      firstRestoreAt ??= performance.now()

      // Restore on every pass. Each pass measures the target live, so
      // virtualization differences and scroll-anchoring shifts self-correct.
      restore()

      // Wait out the adjustments (see SCROLL_REASSERT_DELAY_MS), and keep
      // settling until the anchor renders. Then show the page.
      if (anchorSettled() && performance.now() - firstRestoreAt >= SCROLL_REASSERT_DELAY_MS) {
        reveal()
        return
      }
    }

    if (performance.now() - startedAt < SCROLL_RESTORE_TIMEOUT_MS) {
      setTimeout(settle, SCROLL_POLL_INTERVAL_MS)
    } else {
      // Best effort after `SCROLL_RESTORE_TIMEOUT_MS`. When the document
      // never rendered past the target, leave the viewport where the
      // renderer put it.
      if (isRendered) {
        restore()
      }
      reveal()
    }
  }

  settle()
}

/**
 * Fetches the spec/config and assigns them onto the `<kong-spec-renderer>`
 * element, then registers (and upgrades) the custom element - deliberately
 * in that order.
 *
 * Vue's `defineCustomElement` reads any already-present own properties on
 * the element as its *initial* prop values at construction/upgrade time; props
 * assigned afterwards (e.g. `currentPath`) reach the underlying component
 * reactively for props it actively watches, but some - like `currentPath` -
 * are only snapshotted into local refs once at setup and never re-synced.
 * Registering the element only after every property (spec, config, including
 * `currentPath`) is already set ensures the initial render picks up the
 * right values, rather than defaults, the first and only time it matters.
 */
async function loadAndApply(): Promise<void> {
  const el = document.getElementById('preview') as PreviewElement | null

  if (!el) {
    return
  }

  const [specResponse, configResponse] = await Promise.all([fetch('/spec'), fetch('/config')])
  const spec = await specResponse.text()
  const config = await configResponse.json() as Record<string, unknown>

  el.spec = spec

  for (const [key, value] of Object.entries(config)) {
    el[key] = value
  }

  // Narrow the parsed JSON instead of trusting its shape.
  const navigationType: 'path' | 'hash' = config.navigationType === 'path' ? 'path' : 'hash'
  // Builds the URL for a node path, the same way the component does (no
  // `basePath`, because the preview page is always served from `/`)...
  const toAddressBarUrl = (path: string): string => navigationType === 'hash' ? `#${path}` : path
  // ...and `nodePathFromUrl` is the inverse: it reads the user's last
  // location back out of the URL after a reload.

  // The URL holds the user's latest location. The `--path` flag only sets
  // the first load's starting point.
  const urlPath = nodePathFromUrl(navigationType, location)
  const flagPath = typeof config.currentPath === 'string' ? config.currentPath : undefined
  const requestedPath = urlPath ?? flagPath
  const pathSource: 'url' | 'flag' = urlPath === undefined ? 'flag' : 'url'

  // `config` carries `currentPath` only when `--path` was passed. A URL
  // path must be set on the element itself before registration. This
  // includes the overview: the config loop above already set the flag
  // value, so a skipped assignment lets a stale `--path` outlive a click
  // on "Overview".
  if (urlPath !== undefined) {
    el.currentPath = urlPath
  }

  if (requestedPath && requestedPath !== '/') {
    // The component reflects only its own navigation into the address bar,
    // not an initial `currentPath` prop. Reflect a flag path here. A URL
    // path is already in the address bar.
    if (pathSource === 'flag') {
      history.replaceState({}, '', toAddressBarUrl(requestedPath))
    }

    // The path must match the library's node URI scheme
    // (`/operations/{operationId}`, `/schemas/{SchemaName}`), not the raw
    // OAS path. Warn loudly. A wrong path otherwise renders a blank pane.
    el.addEventListener('path-not-found', ((event: CustomEvent<[string]>) => {
      const requested = String(event.detail?.[0] ?? requestedPath)
      const source = pathSource === 'url'
        ? `The path "${requested}" (restored from the URL) doesn't match any operation or schema in this spec - it may have been renamed or removed since. `
        : `--path "${requested}" doesn't match any operation or schema in this spec. `

      console.warn(
        `[kong-spec-renderer] ${source}` +
        'Expected format: "/operations/{operationId}" or "/schemas/{SchemaName}" - check the spec\'s operationId/schema names, not its raw OAS paths. ' +
        'Falling back to the overview.',
      )

      // The saved offset belongs to the invalid section. Cancel its
      // restore, so it cannot move the page during the fallback.
      scrollRestoreCancelled = true

      history.replaceState({}, '', '/')

      // The component reads `currentPath` only once, at setup. An invalid
      // path cannot be fixed in place, so replace the element with a fresh
      // one.
      const fallback = document.createElement(el.tagName) as PreviewElement

      fallback.id = el.id
      fallback.spec = spec

      for (const [key, value] of Object.entries(config)) {
        fallback[key] = key === 'currentPath' ? '/' : value
      }

      el.replaceWith(fallback)
    }) as EventListener)
  }

  // A matching saved offset means this load settles mid-document. Hide the
  // renderer before its content renders. Reveal it once the offset is final
  // (see `restoreScrollPosition`).
  if (readSavedScrollPosition()?.href === location.href) {
    el.style.visibility = 'hidden'
  }

  // A variable (rather than a string literal) module specifier so TypeScript
  // treats this as an untyped dynamic import instead of trying to resolve
  // `/assets/...` at typecheck time - it only exists once the CLI serves it.
  const bundlePath = '/assets/kong-spec-renderer.web-component.es.js'

  try {
    const { registerKongSpecRenderer } = await import(bundlePath) as { registerKongSpecRenderer: () => void }

    registerKongSpecRenderer()
  } catch (error) {
    // A failed bundle load must not leave the hidden page blank forever.
    el.style.visibility = ''
    console.error(`[kong-spec-renderer] Failed to load the renderer bundle: ${error instanceof Error ? error.message : String(error)}`)

    return
  }

  restoreScrollPosition(el)
}

// The renderer renders asynchronously, so the browser's own scroll
// restoration cannot work across reloads. Take it over manually.
history.scrollRestoration = 'manual'
window.addEventListener('pagehide', rememberScrollPosition)

void loadAndApply()

const RECONNECT_DELAY_MS = 1000

/**
 * Connects the reload-signal WebSocket, reconnecting after a delay if the
 * connection drops (e.g. the CLI process restarted, or the machine slept)
 * so live-reload keeps working without requiring a manual page refresh.
 */
function connect(): void {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  const socket = new WebSocket(`${protocol}://${location.host}`)

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data as string) as { type: string }

    if (message.type === 'reload') {
      location.reload()
    }
  })

  socket.addEventListener('close', () => {
    setTimeout(connect, RECONNECT_DELAY_MS)
  })
}

connect()
