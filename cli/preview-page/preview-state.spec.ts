import { describe, expect, it } from 'vitest'
import { nodePathFromUrl, parseSavedScrollPosition, safeDecode } from './preview-state.js'

describe('safeDecode', () => {
  it('decodes percent-encoded parts', () => {
    expect(safeDecode('/operations/get%20pets')).toBe('/operations/get pets')
  })

  it('returns malformed input as-is rather than throwing', () => {
    expect(safeDecode('/operations/get%')).toBe('/operations/get%')
  })
})

describe('nodePathFromUrl', () => {
  it('reads the node path from the hash in hash mode', () => {
    expect(nodePathFromUrl('hash', { pathname: '/', hash: '#/operations/getPets' })).toBe('/operations/getPets')
  })

  it('returns undefined in hash mode when no hash is set (fresh load)', () => {
    expect(nodePathFromUrl('hash', { pathname: '/', hash: '' })).toBeUndefined()
  })

  it('reads the node path from the pathname in path mode', () => {
    expect(nodePathFromUrl('path', { pathname: '/operations/getPets', hash: '' })).toBe('/operations/getPets')
  })

  it('returns undefined in path mode at the overview', () => {
    expect(nodePathFromUrl('path', { pathname: '/', hash: '' })).toBeUndefined()
  })

  it('normalizes a missing leading slash rather than failing to match', () => {
    expect(nodePathFromUrl('hash', { pathname: '/', hash: '#operations/getPets' })).toBe('/operations/getPets')
  })

  it('decodes percent-encoded node paths', () => {
    expect(nodePathFromUrl('hash', { pathname: '/', hash: '#/operations/get%20pets' })).toBe('/operations/get pets')
  })
})

describe('parseSavedScrollPosition', () => {
  it('returns undefined for a missing entry', () => {
    expect(parseSavedScrollPosition(null)).toBeUndefined()
  })

  it('returns undefined for malformed JSON', () => {
    expect(parseSavedScrollPosition('{not json')).toBeUndefined()
  })

  it('returns undefined for a non-object entry', () => {
    expect(parseSavedScrollPosition('"a string"')).toBeUndefined()
  })

  it('returns undefined when y is not a positive finite number', () => {
    expect(parseSavedScrollPosition(JSON.stringify({ href: 'http://x/#/a', y: 0 }))).toBeUndefined()
    expect(parseSavedScrollPosition(JSON.stringify({ href: 'http://x/#/a', y: -5 }))).toBeUndefined()
    expect(parseSavedScrollPosition(JSON.stringify({ href: 'http://x/#/a', y: '100' }))).toBeUndefined()
    expect(parseSavedScrollPosition(JSON.stringify({ href: 'http://x/#/a', y: Number.NaN }))).toBeUndefined()
  })

  it('returns undefined when href is missing or not a string', () => {
    expect(parseSavedScrollPosition(JSON.stringify({ y: 100 }))).toBeUndefined()
    expect(parseSavedScrollPosition(JSON.stringify({ href: 42, y: 100 }))).toBeUndefined()
  })

  it('parses a section-anchored entry', () => {
    const entry = {
      href: 'http://x/#/operations/a',
      y: 100,
      section: { id: '3-nodecontainer', heading: 'Get A', offsetIn: 40 },
    }

    expect(parseSavedScrollPosition(JSON.stringify(entry))).toEqual(entry)
  })

  it('keeps the entry but drops the anchor when the section is malformed', () => {
    const raw = JSON.stringify({ href: 'http://x/#/operations/a', y: 100, section: { id: 3 } })

    expect(parseSavedScrollPosition(raw)).toEqual({ href: 'http://x/#/operations/a', y: 100 })
  })

  it('keeps the entry but drops the anchor when offsetIn is negative or non-finite', () => {
    for (const offsetIn of [-3, Number.NaN, '40']) {
      const raw = JSON.stringify({
        href: 'http://x/',
        y: 100,
        section: { id: '1-nodecontainer', heading: 'A', offsetIn },
      })

      expect(parseSavedScrollPosition(raw)).toEqual({ href: 'http://x/', y: 100 })
    }
  })

  it('parses an entry without a section (raw-y restore fallback)', () => {
    expect(parseSavedScrollPosition(JSON.stringify({ href: 'http://x/#/operations/a', y: 100 })))
      .toEqual({ href: 'http://x/#/operations/a', y: 100 })
  })
})
