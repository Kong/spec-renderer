import type { SpecRendererProps } from './spec-renderer'

export interface SpecRendererNitroConfig extends Pick<SpecRendererProps,
'basePath' |
'currentPath' |
Required<'specUrl'> |
'controlAddressBar' |
'navigationType' |
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
'hidePoweredBy' |
'maxExpandedDepth'
> { }
