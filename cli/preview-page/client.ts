interface PreviewElement extends HTMLElement {
  spec: string
  [prop: string]: unknown
}

/**
 * Fetches the spec/config and assigns them onto the `<kong-spec-renderer>`
 * element, then registers (and upgrades) the custom element - deliberately
 * in that order.
 *
 * Vue's `defineCustomElement` reads any already-present own properties on the
 * element as its *initial* prop values at construction/upgrade time; props
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

  const requestedPath = typeof config.currentPath === 'string' ? config.currentPath : undefined
  // Matches how the component's own click-driven navigation builds the URL
  // for each `navigationType` (there's no `basePath` here - the CLI's preview
  // page is always served from `/`).
  const toAddressBarUrl = (path: string): string => config.navigationType === 'hash' ? `#${path}` : path

  if (requestedPath && requestedPath !== '/') {
    // The component only pushes address-bar updates from its own click-driven
    // navigation, not for an initial `currentPath` prop supplied externally -
    // reflect the requested deep link ourselves so the URL matches what's
    // actually rendered. Optimistic: rolled back below if the path turns out
    // to be invalid.
    history.replaceState({}, '', toAddressBarUrl(requestedPath))

    // `--path` has to match this library's internal node URI scheme
    // (`/operations/{operationId}`, `/schemas/{SchemaName}`), not the raw OAS
    // path - there's no other feedback if it doesn't match anything, so warn
    // loudly rather than silently rendering a blank document pane.
    el.addEventListener('path-not-found', ((event: CustomEvent<[string]>) => {
      console.warn(
        `[kong-spec-renderer] --path "${String(event.detail?.[0] ?? requestedPath)}" doesn't match any operation or schema in this spec. ` +
        'Expected format: "/operations/{operationId}" or "/schemas/{SchemaName}" - check the spec\'s operationId/schema names, not its raw OAS paths. ' +
        'Falling back to the overview.',
      )

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

  // A variable (rather than a string literal) module specifier so TypeScript
  // treats this as an untyped dynamic import instead of trying to resolve
  // `/assets/...` at typecheck time - it only exists once the CLI serves it.
  const bundlePath = '/assets/kong-spec-renderer.web-component.es.js'
  const { registerKongSpecRenderer } = await import(bundlePath) as { registerKongSpecRenderer: () => void }

  registerKongSpecRenderer()
}

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
