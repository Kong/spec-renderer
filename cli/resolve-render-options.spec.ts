import { describe, expect, it } from 'vitest'
import { resolveRenderOptions } from './resolve-render-options.js'

describe('resolveRenderOptions', () => {
  it('defaults every hide/verbose flag to false, and content scrolling to true, when no flags are passed', () => {
    expect(resolveRenderOptions({})).toEqual({
      hideInternal: false,
      hideDeprecated: false,
      hideSchemas: false,
      hideTryIt: false,
      traceParsing: false,
      allowContentScrolling: true,
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
      verbose: true,
      allowContentScrolling: false,
    })).toEqual({
      hideInternal: true,
      hideDeprecated: true,
      hideSchemas: true,
      hideTryIt: true,
      traceParsing: true,
      allowContentScrolling: false,
      navigationType: 'path',
      controlAddressBar: true,
    })
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
