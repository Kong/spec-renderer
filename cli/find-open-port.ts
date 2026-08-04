import { createServer } from 'node:net'

/**
 * Checks whether a port is free to bind on the local host by briefly binding
 * to it and releasing it.
 */
export function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()

    server.once('error', () => resolve(false))
    server.once('listening', () => server.close(() => resolve(true)))
    server.listen(port)
  })
}

/**
 * Finds the first free port starting at `startPort`, checking up to
 * `maxAttempts` consecutive ports.
 */
export async function findOpenPort(
  startPort: number,
  checkIsPortFree: (port: number) => Promise<boolean> = isPortFree,
  maxAttempts = 10,
): Promise<number> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = startPort + attempt

    if (await checkIsPortFree(candidate)) {
      return candidate
    }
  }

  throw new Error(`Could not find an open port after checking ${maxAttempts} ports starting at ${startPort}`)
}
