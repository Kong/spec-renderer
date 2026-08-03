/** The curated subset of `preview` CLI flags that map to `SpecRendererProps`. */
export interface PreviewCliFlags {
  hideInternal?: boolean
  hideDeprecated?: boolean
  hideSchemas?: boolean
  hideTryIt?: boolean
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
}

/** The `SpecRendererProps` subset the preview page applies to `<kong-spec-renderer>`. */
export interface RenderOptions {
  hideInternal: boolean
  hideDeprecated: boolean
  hideSchemas: boolean
  hideTryIt: boolean
  maxExpandedDepth?: number
  traceParsing: boolean
  allowContentScrolling: boolean
  navigationType: 'path'
  controlAddressBar: true
}

/**
 * Maps parsed `preview` CLI flags to the `SpecRendererProps` subset the preview
 * page renders with.
 *
 * `navigationType` and `controlAddressBar` are always hardcoded - the CLI, not
 * the user, owns the single-page preview environment those props govern.
 */
export function resolveRenderOptions(flags: PreviewCliFlags): RenderOptions {
  return {
    hideInternal: flags.hideInternal ?? false,
    hideDeprecated: flags.hideDeprecated ?? false,
    hideSchemas: flags.hideSchemas ?? false,
    hideTryIt: flags.hideTryIt ?? false,
    ...(flags.maxExpandedDepth === undefined ? {} : { maxExpandedDepth: flags.maxExpandedDepth }),
    traceParsing: (flags.verbose ?? false) || (flags.traceParsing ?? false),
    allowContentScrolling: flags.allowContentScrolling ?? true,
    navigationType: 'path',
    controlAddressBar: true,
  }
}
