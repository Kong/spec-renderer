/**
 * Removes trailing slash from a string
 * @param {string} str
 * @returns string without trailing slash
 */
export function removeTrailingSlash(str: string) {
  return str.replace(/\/$/, '')
}
