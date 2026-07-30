// returns hundreds of response codes, e.g. 200 -> 2xx, 401 -> 4xx
export const getResponseCodeKey = (code: string) => {
  return code.startsWith('2') ? '2xx' : '4xx'
}

/**
 * Strips parameters (e.g. charset) from a Content-Type header value and lowercases it,
 * e.g. 'Application/JSON; charset=utf-8' -> 'application/json'.
 */
export const normalizeContentType = (contentType: string | null | undefined): string => {
  return (contentType || '').split(';')[0]!.trim().toLowerCase()
}

/**
 * Content types (or subtype suffixes) whose bodies are safe to render as text.
 * `application/json` is handled separately by the caller since it is parsed.
 */
const TEXTUAL_CONTENT_TYPE_PATTERNS = [
  /^text\//,
  /\/xml$/,
  /\+xml$/,
  /\+json$/,
  /\/javascript$/,
  /\/ecmascript$/,
  /\/csv$/,
  /\/x-www-form-urlencoded$/,
]

/**
 * Determines whether a response body of the given content type can be safely
 * displayed as text. Everything else (pdf, octet-stream, zip, audio, video, ...)
 * is treated as binary and offered as a download instead of being decoded as text.
 */
export const isTextualContentType = (contentType: string): boolean => {
  const type = normalizeContentType(contentType)
  if (!type) return false
  return TEXTUAL_CONTENT_TYPE_PATTERNS.some(pattern => pattern.test(type))
}

/**
 * MIME type -> file extension overrides, only for types whose subtype is not
 * itself a usable extension. Types whose subtype already is the right extension
 * (application/pdf, image/png, video/mp4, ...) are handled by the subtype
 * fallback in extensionForContentType
 */
const CONTENT_TYPE_EXTENSION_OVERRIDES: Record<string, string> = {
  'application/octet-stream': 'bin',
  'application/gzip': 'gz',
  'application/x-tar': 'tar',
  'application/msword': 'doc',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'audio/mpeg': 'mp3',
}

/**
 * Returns a file extension for the given content type.
 * Uses the subtype (e.g. "application/pdf" -> "pdf") for the common case, an
 * override table where the subtype is not a good extension, and `bin` otherwise.
 */
export const extensionForContentType = (contentType: string): string => {
  const type = normalizeContentType(contentType)
  if (CONTENT_TYPE_EXTENSION_OVERRIDES[type]) return CONTENT_TYPE_EXTENSION_OVERRIDES[type]
  // fall back to the subtype for everything else, e.g. "application/x-custom" -> "x-custom"
  const subtype = type.split('/')[1]
  return subtype && /^[a-z0-9.+-]+$/.test(subtype) ? subtype : 'bin'
}

/**
 * Extracts a filename from a Content-Disposition header value.
 * Supports both the extended `filename*=UTF-8''...` form and the plain `filename="..."` form.
 */
export const parseContentDispositionFilename = (header: string | null | undefined): string | undefined => {
  if (!header) return undefined

  const extendedMatch = header.match(/filename\*=(?:[^']*'[^']*')?([^;]+)/i)
  if (extendedMatch?.[1]) {
    const value = extendedMatch[1].trim().replace(/^["']|["']$/g, '')
    try {
      return decodeURIComponent(value) || undefined
    } catch {
      return value || undefined
    }
  }

  const match = header.match(/filename=("?)([^";]+)\1/i)
  const filename = match?.[2]?.trim()
  return filename || undefined
}

/**
 * Formats a byte count into a human-readable string, e.g. 2048 -> "2 KB".
 */
export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  const rounded = value >= 10 || Number.isInteger(value) ? Math.round(value) : Math.round(value * 10) / 10
  return `${rounded} ${units[unitIndex]}`
}
