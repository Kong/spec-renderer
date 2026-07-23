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
