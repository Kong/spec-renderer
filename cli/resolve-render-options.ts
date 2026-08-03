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
  withCredentials?: boolean
  /**
   * From `--no-content-scrolling`. Named to match `allowContentScrolling`
   * below (the prop it maps to) rather than commander's auto-derived
   * `contentScrolling` (stripped from the negatable flag name).
   */
  allowContentScrolling?: boolean
  /** From `--no-custom-server-url` - inverse-named prop is `allowCustomServerUrl` below. */
  customServerUrl?: boolean
  /** From `--show-navigation-buttons` - inverse of the `hideNavigationButtons` prop below. */
  showNavigationButtons?: boolean
  hideDownloadButton?: boolean
  enableOperationLinks?: boolean
  /** From `--hide-powered-by`, deliberately not mentioning "Kong" in the flag itself. */
  hidePoweredBy?: boolean
  /** From `--path <path>`, matching the underlying `currentPath` prop name. */
  currentPath?: string
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
  withCredentials: boolean
  allowContentScrolling: boolean
  allowCustomServerUrl: boolean
  hideNavigationButtons: boolean
  hideDownloadButton: boolean
  enableOperationLinks: boolean
  showPoweredBy: boolean
  navigationType: 'path'
  controlAddressBar: true
  currentPath?: string
}

/**
 * Maps parsed `preview` CLI flags to the `SpecRendererProps` subset the preview
 * page renders with.
 *
 * `navigationType` and `controlAddressBar` are always hardcoded - the CLI, not
 * the user, owns the single-page preview environment those props govern.
 * `showPoweredBy` defaults to `true` here even though the component prop
 * itself defaults to `false` - the CLI wants branding visible unless a user
 * opts out with `--hide-powered-by`. `hideNavigationButtons` defaults to
 * `true` (hidden), matching the component's own default, and only flips to
 * `false` when `--show-navigation-buttons` is explicitly passed - mainly
 * useful alongside `--no-content-scrolling`, where the prev/next buttons are
 * otherwise the only in-page way to move between operations.
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
    withCredentials: flags.withCredentials ?? false,
    allowContentScrolling: flags.allowContentScrolling ?? true,
    allowCustomServerUrl: flags.customServerUrl ?? true,
    hideNavigationButtons: !(flags.showNavigationButtons ?? false),
    hideDownloadButton: flags.hideDownloadButton ?? false,
    enableOperationLinks: flags.enableOperationLinks ?? false,
    showPoweredBy: !flags.hidePoweredBy,
    navigationType: 'path',
    controlAddressBar: true,
    ...(flags.currentPath === undefined ? {} : { currentPath: flags.currentPath }),
  }
}
