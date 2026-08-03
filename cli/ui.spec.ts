import { describe, expect, it } from 'vitest'
import { buildBannerLines, visibleLength } from './ui.js'

const BOLD = '\x1B[1m'
const RESET = '\x1B[22m'

describe('visibleLength', () => {
  it('returns the plain string length when there are no ANSI codes', () => {
    expect(visibleLength('hello')).toBe(5)
  })

  it('ignores ANSI color escape codes', () => {
    expect(visibleLength(`${BOLD}hello${RESET}`)).toBe(5)
  })
})

describe('buildBannerLines', () => {
  it('produces box lines that are all the same visible width', () => {
    const lines = buildBannerLines([
      { label: 'Spec', value: './openapi.yaml' },
      { label: 'URL', value: `${BOLD}http://localhost:4757${RESET}` },
      { label: 'Reload', value: 'watching for changes' },
    ])

    const widths = new Set(lines.map((line) => visibleLength(line)))

    expect(widths.size).toBe(1)
  })

  it('widens the box to fit a long colored value without breaking alignment', () => {
    const lines = buildBannerLines([
      { label: 'Spec', value: './openapi.yaml' },
      { label: 'URL', value: `${BOLD}http://localhost:4757/a/very/long/path/that/is/quite/wide${RESET}` },
    ])

    const widths = new Set(lines.map((line) => visibleLength(line)))

    expect(widths.size).toBe(1)
  })

  it('wraps a value far longer than the box max width onto continuation lines, keeping alignment', () => {
    const longValue = 'https://raw.githubusercontent.com/Kong/spec-renderer/refs/heads/main/sandbox/public/specs/stripe.json'
    const lines = buildBannerLines([
      { label: 'Spec', value: longValue },
      { label: 'URL', value: 'http://localhost:4757' },
      { label: 'Reload', value: 'not available (remote URL)' },
    ])

    const widths = new Set(lines.map((line) => visibleLength(line)))

    expect(widths.size).toBe(1)
    // border (top) + title + separator + Spec (wrapped to >1 line) + URL + Reload + border (bottom)
    expect(lines.length).toBeGreaterThan(7)
  })

  it('indents wrapped continuation lines under a blank label instead of repeating it', () => {
    const longValue = 'x'.repeat(200)
    const lines = buildBannerLines([{ label: 'Spec', value: longValue }])
    const contentLines = lines.slice(3, -1)

    expect(contentLines.length).toBeGreaterThan(1)
    expect(contentLines[0]).toContain('Spec')
    expect(contentLines[1]).not.toContain('Spec')
  })

  it('strips color from a value too long to wrap safely, rather than splitting mid-escape-sequence', () => {
    const longColoredValue = `${BOLD}${'x'.repeat(200)}${RESET}`
    const lines = buildBannerLines([{ label: 'Spec', value: longColoredValue }])
    // Row content lines only - excludes the title line, which is always bold regardless of row content.
    const contentLines = lines.slice(3, -1)

    expect(contentLines.some((line) => line.includes(BOLD))).toBe(false)
  })

  it('respects a caller-supplied narrower max width, e.g. for a small terminal window', () => {
    const longValue = 'https://raw.githubusercontent.com/Kong/spec-renderer/refs/heads/main/sandbox/public/specs/stripe.json'
    const narrowWidth = 40
    const lines = buildBannerLines([
      { label: 'Spec', value: longValue },
      { label: 'URL', value: 'http://localhost:4757' },
    ], narrowWidth)

    const widths = [...new Set(lines.map((line) => visibleLength(line)))]

    expect(widths).toHaveLength(1)
    expect(widths[0]).toBeLessThanOrEqual(narrowWidth + 4)
    // A ~100-char URL wrapped at a ~30-char value column takes several continuation lines.
    expect(lines.length).toBeGreaterThan(6)
  })
})
