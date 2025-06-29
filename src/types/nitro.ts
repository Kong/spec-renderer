import type { SpecRendererProps } from './spec-renderer'

export interface SpecRendererNitroConfig extends Pick<SpecRendererProps,
  'basePath' |
  'currentPath' |
  Required<'specUrl'> |
  'controlAddressBar' |
  'hideSchemas' |
  'hideInternal' |
  'hideDeprecated' |
  'hideTryIt' |
  'hideInsomniaTryIt' |
  'withCredentials' |
  'allowContentScrolling' |
  'markdownStyles' |
  'allowCustomServerUrl' |
  'hideNavigationButtons' |
  'hideDownloadButton' |
  'maxExpandedDepth'
> { }
