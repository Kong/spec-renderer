import sanitize from 'sanitize-html'

const codeBlockSanitizeOptions: sanitize.IOptions = {
  allowedTags: ['span', 'div', 'pre', 'code', 'br'],
  allowedAttributes: {
    span: ['class', 'style'],
    div: ['class', 'style'],
    pre: ['class', 'style'],
    code: ['class', 'style'],
  },
}

const markdownSanitizeOptions: sanitize.IOptions = {
  allowedTags: sanitize.defaults.allowedTags.concat(['img', 'details', 'summary']),
}

// Keep rendered spec links navigable while blocking executable or embeddable schemes.
const allowedHrefProtocols = new Set(['http:', 'https:'])

/**
 * Sanitizes syntax-highlighted code block HTML before rendering it via `innerHTML`.
 * This intentionally allows only the tags and attributes emitted by Shiki and local masking markup.
 */
export function sanitizeCodeBlockHtml(html: string): string {
  return html
    ? sanitize(html, codeBlockSanitizeOptions)
    : ''
}

/**
 * Sanitizes rendered markdown HTML before rendering it via `innerHTML`.
 * This uses a broader markdown policy than code blocks because markdown may render links, lists, images, and disclosure elements.
 */
export function sanitizeMarkdownHtml(html: string): string {
  return html
    ? sanitize(html, markdownSanitizeOptions)
    : ''
}

/**
 * Sanitizes user-provided spec URLs before binding them to an anchor `href`.
 * The URL constructor needs a base so relative URLs can be parsed and allowed.
 * Note: relative and protocol-relative values are intentionally allowed, so a
 * scheme-less host-like string (e.g. `"example.com"`) resolves as a relative path
 * against the current page rather than as an absolute external link.
 */
export function sanitizeHref(href?: string): string | undefined {
  const trimmedHref = href?.trim()

  if (!trimmedHref) {
    return undefined
  }

  try {
    // This base is only used for parsing relative URLs; the returned href remains unchanged.
    const url = new URL(trimmedHref, 'https://spec-renderer.local')

    return allowedHrefProtocols.has(url.protocol) ? trimmedHref : undefined
  } catch {
    return undefined
  }
}

/**
 * Builds a mailto href from a spec-provided contact value.
 *
 * Contact values may legitimately include mailto query params (e.g. `?subject=...`),
 * so those are preserved. This is not full RFC email validation: it enforces a basic
 * single-`@` address shape and blocks CR/LF characters — in both raw and
 * percent-encoded form — which are the mailto header-injection vector (e.g. an
 * injected `Bcc:` header). A `mailto:` link cannot execute script, so the scheme
 * itself is not a concern.
 */
export function sanitizeMailtoHref(email?: string): string | undefined {
  const trimmedEmail = email?.trim()

  if (!trimmedEmail) {
    return undefined
  }

  // Separate the address from optional mailto query params (e.g. `?subject=...`).
  const queryIndex = trimmedEmail.indexOf('?')
  const address = queryIndex === -1 ? trimmedEmail : trimmedEmail.slice(0, queryIndex)

  // The address must contain a single `@` with text on both sides.
  const atIndex = address.indexOf('@')
  if (!atIndex || atIndex === address.length - 1 || atIndex === 0) {
    return undefined
  }

  // Block CR/LF (raw or percent-encoded) anywhere in the value to prevent mailto
  // header injection. Malformed percent-encoding is rejected rather than guessed.
  let decodedEmail = trimmedEmail

  try {
    decodedEmail = decodeURIComponent(trimmedEmail)
  } catch {
    return undefined
  }

  if (/[\r\n]/.test(trimmedEmail) || /[\r\n]/.test(decodedEmail)) {
    return undefined
  }

  return `mailto:${trimmedEmail}`
}
