/** The curated subset of `preview` CLI flags that map to `SpecRendererProps`. */
export interface PreviewCliFlags {
  hideInternal?: boolean
  hideDeprecated?: boolean
  hideSchemas?: boolean
  hideTryIt?: boolean
  hideInsomniaTryIt?: boolean
  maxExpandedDepth?: number
  /** From `--verbose` - a friendlier alias for `--trace-parsing`. */
  verbose?: boolean
  /** From `--trace-parsing`, matching the underlying `traceParsing` prop name. */
  traceParsing?: boolean
  /**
   * From `--no-content-scrolling`. Named to match `allowContentScrolling`
   * below (the prop it maps to) rather than commander's auto-derived
   * `contentScrolling` (stripped from the negatable flag name).
   */
  allowContentScrolling?: boolean
  /** From `--hide-powered-by`, deliberately not mentioning "Kong" in the flag itself. */
  hidePoweredBy?: boolean
}

/** The `SpecRendererProps` subset the preview page applies to `<kong-spec-renderer>`. */
export interface RenderOptions {
  hideInternal: boolean
  hideDeprecated: boolean
  hideSchemas: boolean
  hideTryIt: boolean
  hideInsomniaTryIt: boolean
  maxExpandedDepth?: number
  traceParsing: boolean
  allowContentScrolling: boolean
  showPoweredBy: boolean
  navigationType: 'path'
  controlAddressBar: true
}

/**
 * Maps parsed `preview` CLI flags to the `SpecRendererProps` subset the preview
 * page renders with.
 *
 * `navigationType` and `controlAddressBar` are always hardcoded - the CLI, not
 * the user, owns the single-page preview environment those props govern.
 * `showPoweredBy` defaults to `true` here even though the component prop
 * itself defaults to `false` - the CLI wants branding visible unless a user
 * opts out with `--hide-powered-by`.
 */
export function resolveRenderOptions(flags: PreviewCliFlags): RenderOptions {
  return {
    hideInternal: flags.hideInternal ?? false,
    hideDeprecated: flags.hideDeprecated ?? false,
    hideSchemas: flags.hideSchemas ?? false,
    hideTryIt: flags.hideTryIt ?? false,
    hideInsomniaTryIt: flags.hideInsomniaTryIt ?? false,
    ...(flags.maxExpandedDepth === undefined ? {} : { maxExpandedDepth: flags.maxExpandedDepth }),
    traceParsing: (flags.verbose ?? false) || (flags.traceParsing ?? false),
    allowContentScrolling: flags.allowContentScrolling ?? true,
    showPoweredBy: !flags.hidePoweredBy,
    navigationType: 'path',
    controlAddressBar: true,
  }
}
