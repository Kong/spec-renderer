import type { TargetId, ClientId } from 'httpsnippet-lite'
export type LanguageCode = TargetId | 'json'
interface LibraryConfig {
  label: string
  httpSnippetLibrary: ClientId
}

interface LanguageConfig {
  label: string
  httpSnippetLanguage: LanguageCode
  highlightLanguage: string
  libraries?: Array<LibraryConfig>
}

export type RequestSampleConfigs = Array<LanguageConfig>
