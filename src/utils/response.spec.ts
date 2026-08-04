import { describe, it, expect } from 'vitest'
import {
  getResponseCodeKey,
  isTextualContentType,
  extensionForContentType,
  parseContentDispositionFilename,
  formatBytes,
} from './response'

describe('getResponseCodeKey', () => {
  it('maps 2xx codes', () => {
    expect(getResponseCodeKey('200')).toBe('2xx')
    expect(getResponseCodeKey('204')).toBe('2xx')
  })

  it('maps non-2xx codes to 4xx', () => {
    expect(getResponseCodeKey('404')).toBe('4xx')
    expect(getResponseCodeKey('500')).toBe('4xx')
  })
})

describe('isTextualContentType', () => {
  it('treats text/* and known text subtypes as textual', () => {
    expect(isTextualContentType('text/plain')).toBe(true)
    expect(isTextualContentType('text/html; charset=utf-8')).toBe(true)
    expect(isTextualContentType('application/xml')).toBe(true)
    expect(isTextualContentType('application/problem+json')).toBe(true)
    expect(isTextualContentType('application/xhtml+xml')).toBe(true)
    expect(isTextualContentType('application/javascript')).toBe(true)
    expect(isTextualContentType('text/csv')).toBe(true)
    expect(isTextualContentType('application/x-www-form-urlencoded')).toBe(true)
  })

  it('treats binary content types as non-textual', () => {
    expect(isTextualContentType('application/pdf')).toBe(false)
    expect(isTextualContentType('application/octet-stream')).toBe(false)
    expect(isTextualContentType('application/zip')).toBe(false)
    expect(isTextualContentType('image/png')).toBe(false)
    expect(isTextualContentType('audio/mpeg')).toBe(false)
    expect(isTextualContentType('')).toBe(false)
  })
})

describe('extensionForContentType', () => {
  it('applies overrides where the subtype is not a usable extension', () => {
    expect(extensionForContentType('application/octet-stream')).toBe('bin')
    expect(extensionForContentType('audio/mpeg')).toBe('mp3')
    expect(extensionForContentType('application/msword')).toBe('doc')
  })

  it('falls back to the subtype for everything else', () => {
    expect(extensionForContentType('application/pdf')).toBe('pdf')
    expect(extensionForContentType('application/zip')).toBe('zip')
    expect(extensionForContentType('image/png')).toBe('png')
    expect(extensionForContentType('image/jpeg; charset=binary')).toBe('jpeg')
    expect(extensionForContentType('application/x-custom')).toBe('x-custom')
  })

  it('falls back to bin when no usable subtype exists', () => {
    expect(extensionForContentType('')).toBe('bin')
    expect(extensionForContentType('application')).toBe('bin')
  })
})

describe('parseContentDispositionFilename', () => {
  it('returns undefined when the header is missing', () => {
    expect(parseContentDispositionFilename(null)).toBeUndefined()
    expect(parseContentDispositionFilename(undefined)).toBeUndefined()
    expect(parseContentDispositionFilename('attachment')).toBeUndefined()
  })

  it('parses a plain filename token', () => {
    expect(parseContentDispositionFilename('attachment; filename="report.pdf"')).toBe('report.pdf')
    expect(parseContentDispositionFilename('attachment; filename=report.pdf')).toBe('report.pdf')
  })

  it('prefers and decodes the RFC 5987 extended form', () => {
    expect(parseContentDispositionFilename("attachment; filename=\"fallback.pdf\"; filename*=UTF-8''r%C3%A9sum%C3%A9.pdf"))
      .toBe('résumé.pdf')
  })
})

describe('formatBytes', () => {
  it('formats byte counts', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB')
  })

  it('returns empty string for invalid input', () => {
    expect(formatBytes(-1)).toBe('')
    expect(formatBytes(NaN)).toBe('')
  })
})
