import { removeTrailingSlash } from '@/utils/strings'
import type { IServer } from '@/types'

/**
 * format url from the server variables
 * @param server The server object containing the URL and variables.
 * @returns The formatted server URL with variables applied and trailing slash removed.
 */
export function formatServerUrl(server: IServer | undefined): string {
  if (!server) {
    return ''
  }
  let url = server.origUrl || server.url
  if (server.variables) {
    for (const [key, value] of Object.entries(server.variables)) {
      url = url.replace(`{${key}}`, value.extensions?.value as string || value.default)
    }
  }
  return removeTrailingSlash(url)
}
