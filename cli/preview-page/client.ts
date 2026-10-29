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
 * The first restore can itself trigger further `scrollY` adjustments (the
 * renderer lazily (un)mounts sections around the viewport, and scroll
 * anchoring compensates), and the renderer's own initial section scroll can
 * also land after the first restore. Re-assert the saved offset once more
 * after this delay, then reveal the page - everything is hidden until then,
 * so none of these movements are visible.
 */
const SCROLL_REASSERT_DELAY_MS = 800
/**
 * Give up on restoring after this long - e.g. the spec shrank and the saved
 * offset is past the end of the document.
 */
const SCROLL_RESTORE_TIMEOUT_MS = 4000

/**
 * Set by the `path-not-found` handler when it falls back to the overview -
 * cancels a running scroll restore, since the position it targets is under
 * the removed/renamed section. (A scroll-driven hash update during the
 * restore must NOT cancel it - see `restoreScrollPosition`.)
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
 * The document is virtualized: sections lazily (un)mount, so the same window
 * `scrollY` can point at different content on the next page load (the
 * mounted set depends on how the page was scrolled). Anchoring to the
 * section the viewport was in, at an offset within it, survives that.
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
    // sessionStorage is unavailable (e.g. Safari private mode) - skip.
  }
}

/**
 * Finds the saved section in the freshly rendered document: by id when the
 * spec is unchanged (indices are stable), else by heading text when a spec
 * edit added/removed sections and shifted indices.
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
 * within it, measured at call time - virtualization of the sections above
 * shifts a section's absolute position between page loads, but the offset
 * within the section always points at the same content. Falls back to the
 * raw saved `y` when the section can't be found again (e.g. the spec edit
 * removed it - though that case usually goes through `path-not-found`).
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
 * Restores the scroll offset saved by `rememberScrollPosition`.
 *
 * The spec renders asynchronously and the renderer then scrolls the restored
 * section into view, so the browser's own scroll restoration can't work.
 * Several scrolls happen in sequence while settling into the saved offset:
 * the renderer's own initial section scroll, our restore, and layout
 * adjustments triggered by the renderer lazily (un)mounting sections around
 * the viewport (which the browser's scroll anchoring compensates for).
 * Rather than show that as visible jumping, the caller hides the renderer
 * before its content renders and it is only revealed once the offset is
 * final.
 */
function restoreScrollPosition(el: PreviewElement): void {
  const saved = readSavedScrollPosition()

  // The saved entry must belong to the page as it booted - e.g. a `--path`
  // deep link that changed the URL before this ran must not inherit some
  // earlier session's scroll offset.
  if (!saved || saved.href !== location.href) {
    return
  }

  let hasInteracted = false

  const reveal = (): void => {
    el.style.visibility = ''
  }

  // Any real user input wins over the restore from here on - reveal whatever
  // is on screen and don't yank the page out from under someone who is
  // already reading/scrolling.
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

  const poll = (): void => {
    // The path the URL restored turned out invalid - the fallback handler
    // has already reset the URL and remounted at the overview.
    if (scrollRestoreCancelled) {
      reveal()
      return
    }

    // Gate on whichever position applies: the anchored target, or the raw
    // `y` when the anchor is unusable. A spec edit can shrink the document
    // above the section, making the raw `y` unreachable while the anchored
    // target is fine - gating on the raw `y` alone would skip a perfectly
    // good restore. The target is re-measured live, so sections that
    // haven't rendered yet keep falling back to the raw `y`.
    const isRendered = document.documentElement.scrollHeight > Math.min(scrollTarget(saved), saved.y)

    if (isRendered) {
      hasRendered = true
    }

    if (hasRendered) {
      // Restore as soon as the document is tall enough, then re-assert once
      // the adjustment dust has settled (see SCROLL_REASSERT_DELAY_MS) - the
      // target is re-measured live each time, so virtualization differences
      // self-correct - and only then show the page.
      restore()
      setTimeout(() => {
        restore()
        reveal()
      }, SCROLL_REASSERT_DELAY_MS)
    } else if (performance.now() - startedAt < SCROLL_RESTORE_TIMEOUT_MS) {
      setTimeout(poll, SCROLL_POLL_INTERVAL_MS)
    } else {
      // Best effort - e.g. the spec shrank and the offset is near the end.
      // If the document never rendered past the restore target, leave the
      // viewport where the renderer's own section scroll put it.
      if (isRendered) {
        restore()
      }
      reveal()
    }
  }

  poll()
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

  // The config is parsed JSON - narrow rather than trust its shape.
  const navigationType: 'path' | 'hash' = config.navigationType === 'path' ? 'path' : 'hash'
  // Matches how the component's own click-driven navigation builds the URL
  // for each `navigationType` (there's no `basePath` here - the CLI's preview
  // page is always served from `/`)...
  const toAddressBarUrl = (path: string): string => navigationType === 'hash' ? `#${path}` : path
  // ...and `nodePathFromUrl` is its inverse, reading the user's last location
  // back out of the URL after a reload. The component reflects every
  // navigation into the address bar, and the URL survives both live-reload
  // and a manual refresh.

  // The URL wins over the `--path` flag: it is the user's latest location,
  // and the flag is only the first load's starting point.
  const urlPath = nodePathFromUrl(navigationType, location)
  const flagPath = typeof config.currentPath === 'string' ? config.currentPath : undefined
  const requestedPath = urlPath ?? flagPath
  const pathSource: 'url' | 'flag' = urlPath === undefined ? 'flag' : 'url'

  // `config` only carries `currentPath` when `--path` was passed - a
  // URL-supplied path has to be set on the element itself, alongside the
  // other props above and before registration, or the component boots at
  // its own default instead of the user's location.
  if (urlPath !== undefined && urlPath !== '/') {
    el.currentPath = urlPath
  }

  if (requestedPath && requestedPath !== '/') {
    // The component only pushes address-bar updates from its own click-driven
    // navigation, not for an initial `currentPath` prop supplied externally -
    // reflect a flag-supplied path ourselves so the URL matches what's
    // actually rendered. A URL-supplied path is already in the address bar.
    if (pathSource === 'flag') {
      history.replaceState({}, '', toAddressBarUrl(requestedPath))
    }

    // The path has to match this library's internal node URI scheme
    // (`/operations/{operationId}`, `/schemas/{SchemaName}`), not the raw OAS
    // path - there's no other feedback if it doesn't match anything, so warn
    // loudly rather than silently rendering a blank document pane.
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

      // The saved scroll offset belongs to the (now invalid) section - cancel
      // its restore so it can't yank the page mid-fallback.
      scrollRestoreCancelled = true

      history.replaceState({}, '', '/')

      // `currentPath` is only read once, at the component's initial setup -
      // an invalid path can't be corrected by reassigning the property on
      // the existing element, so replace it with a fresh one instead.
      const fallback = document.createElement(el.tagName) as PreviewElement

      fallback.id = el.id
      fallback.spec = spec

      for (const [key, value] of Object.entries(config)) {
        fallback[key] = key === 'currentPath' ? '/' : value
      }

      el.replaceWith(fallback)
    }) as EventListener)
  }

  // A matching saved scroll offset means this load will end up mid-document
  // (the section restore plus the offset restore, and the renderer's own
  // initial scroll in between) - hide the renderer before its content
  // renders so the settling isn't visible, and reveal it only once the
  // offset is final (see restoreScrollPosition).
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
    // The element may be hidden for the scroll restore above - a failed
    // bundle load must not leave a permanently blank page.
    el.style.visibility = ''
    console.error(`[kong-spec-renderer] Failed to load the renderer bundle: ${error instanceof Error ? error.message : String(error)}`)

    return
  }

  restoreScrollPosition(el)
}

// The renderer renders asynchronously, so the browser's own scroll restoration
// can't work across reloads - take it over manually.
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
