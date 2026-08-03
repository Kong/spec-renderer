import { describe, expect, it } from 'vitest'
import { resolveRenderOptions } from './resolve-render-options.js'

describe('resolveRenderOptions', () => {
  it('defaults every hide/verbose flag to false, content scrolling to true, and branding to true, when no flags are passed', () => {
    expect(resolveRenderOptions({})).toEqual({
      hideInternal: false,
      hideDeprecated: false,
      hideSchemas: false,
      hideTryIt: false,
      hideInsomniaTryIt: false,
      traceParsing: false,
      allowContentScrolling: true,
      showPoweredBy: true,
      navigationType: 'path',
      controlAddressBar: true,
    })
  })

  it('maps each CLI flag to its corresponding SpecRenderer prop', () => {
    expect(resolveRenderOptions({
      hideInternal: true,
      hideDeprecated: true,
      hideSchemas: true,
      hideTryIt: true,
      hideInsomniaTryIt: true,
      verbose: true,
      allowContentScrolling: false,
      hidePoweredBy: true,
    })).toEqual({
      hideInternal: true,
      hideDeprecated: true,
      hideSchemas: true,
      hideTryIt: true,
      hideInsomniaTryIt: true,
      traceParsing: true,
      allowContentScrolling: false,
      showPoweredBy: false,
      navigationType: 'path',
      controlAddressBar: true,
    })
  })

  it('defaults showPoweredBy to true even though the underlying prop itself defaults to false', () => {
    expect(resolveRenderOptions({})).toMatchObject({ showPoweredBy: true })
  })

  it('hides branding only when --hide-powered-by is explicitly passed', () => {
    expect(resolveRenderOptions({ hidePoweredBy: true })).toMatchObject({ showPoweredBy: false })
  })

  it('treats --verbose and --trace-parsing as aliases of each other', () => {
    expect(resolveRenderOptions({ verbose: true })).toMatchObject({ traceParsing: true })
    expect(resolveRenderOptions({ traceParsing: true })).toMatchObject({ traceParsing: true })
    expect(resolveRenderOptions({})).toMatchObject({ traceParsing: false })
  })

  it('passes maxExpandedDepth through when provided', () => {
    expect(resolveRenderOptions({ maxExpandedDepth: 3 })).toMatchObject({
      maxExpandedDepth: 3,
    })
  })

  it('omits maxExpandedDepth when not provided', () => {
    expect(resolveRenderOptions({})).not.toHaveProperty('maxExpandedDepth')
  })

  it('always hardcodes navigationType and controlAddressBar regardless of input', () => {
    const result = resolveRenderOptions({ hideInternal: true })

    expect(result.navigationType).toBe('path')
    expect(result.controlAddressBar).toBe(true)
  })
})
