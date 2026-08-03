import { describe, expect, it } from 'vitest'
import { resolveRenderOptions } from './resolve-render-options.js'

describe('resolveRenderOptions', () => {
  it('defaults every hide/verbose flag to false, content scrolling and custom-server-url to true, branding to true, and navigationType to hash, when no flags are passed', () => {
    expect(resolveRenderOptions({})).toEqual({
      hideInternal: false,
      hideDeprecated: false,
      hideSchemas: false,
      hideTryIt: false,
      hideInsomniaTryIt: false,
      traceParsing: false,
      withCredentials: false,
      allowContentScrolling: true,
      allowCustomServerUrl: true,
      hideNavigationButtons: true,
      hideDownloadButton: false,
      enableOperationLinks: false,
      showPoweredBy: true,
      navigationType: 'hash',
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
      withCredentials: true,
      allowContentScrolling: false,
      customServerUrl: false,
      showNavigationButtons: true,
      hideDownloadButton: true,
      enableOperationLinks: true,
      hidePoweredBy: true,
      navigationType: 'path',
    })).toEqual({
      hideInternal: true,
      hideDeprecated: true,
      hideSchemas: true,
      hideTryIt: true,
      hideInsomniaTryIt: true,
      traceParsing: true,
      withCredentials: true,
      allowContentScrolling: false,
      allowCustomServerUrl: false,
      hideNavigationButtons: false,
      hideDownloadButton: true,
      enableOperationLinks: true,
      showPoweredBy: false,
      navigationType: 'path',
      controlAddressBar: true,
    })
  })

  it('passes currentPath through when provided', () => {
    expect(resolveRenderOptions({ currentPath: '/pets/{id}' })).toMatchObject({
      currentPath: '/pets/{id}',
    })
  })

  it('omits currentPath when not provided', () => {
    expect(resolveRenderOptions({})).not.toHaveProperty('currentPath')
  })

  it('only shows navigation buttons when --show-navigation-buttons is explicitly passed', () => {
    expect(resolveRenderOptions({})).toMatchObject({ hideNavigationButtons: true })
    expect(resolveRenderOptions({ showNavigationButtons: false })).toMatchObject({ hideNavigationButtons: true })
    expect(resolveRenderOptions({ showNavigationButtons: true })).toMatchObject({ hideNavigationButtons: false })
  })

  it('disables custom server url only when --no-custom-server-url is explicitly passed', () => {
    expect(resolveRenderOptions({})).toMatchObject({ allowCustomServerUrl: true })
    expect(resolveRenderOptions({ customServerUrl: false })).toMatchObject({ allowCustomServerUrl: false })
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

  it('always hardcodes controlAddressBar regardless of input', () => {
    const result = resolveRenderOptions({ hideInternal: true })

    expect(result.controlAddressBar).toBe(true)
  })

  it('defaults navigationType to hash rather than the component prop default of path, since the CLI server has no route fallback for a refresh at a deep path link', () => {
    expect(resolveRenderOptions({})).toMatchObject({ navigationType: 'hash' })
  })

  it('uses path navigationType only when --navigation-type path is explicitly passed', () => {
    expect(resolveRenderOptions({ navigationType: 'path' })).toMatchObject({ navigationType: 'path' })
    expect(resolveRenderOptions({ navigationType: 'hash' })).toMatchObject({ navigationType: 'hash' })
  })
})
