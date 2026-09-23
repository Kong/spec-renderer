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

/**
 * We can identify a server by combining: URL template + variable defaults.
 * Two servers that share a url template but declare different variable defaults are distinct servers.
 *
 * @param server The server object.
 * @returns A string that is equal for identical server declarations and different otherwise.
 */
export function getServerIdentity(server: IServer): string {
  const url = server.origUrl || server.url
  const variables = Object.entries(server.variables ?? {})
    .map(([key, variable]) => `${key}=${variable.default}`)
    .sort()
  return variables.length ? `${url}|${variables.join(',')}` : url
}
