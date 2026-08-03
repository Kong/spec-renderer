interface PreviewElement extends HTMLElement {
  spec: string
  [prop: string]: unknown
}

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
