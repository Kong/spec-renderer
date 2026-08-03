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
 * Builds a mailto href from a basic email-like value.
 * This is not full RFC validation; it only checks for text before and after `@`.
 */
export function sanitizeMailtoHref(email?: string): string | undefined {
  const trimmedEmail = email?.trim()

  if (!trimmedEmail) {
    return undefined
  }

  const atIndex = trimmedEmail.indexOf('@')

  if (atIndex <= 0 || atIndex === trimmedEmail.length - 1) {
    return undefined
  }

  return `mailto:${trimmedEmail}`
}
