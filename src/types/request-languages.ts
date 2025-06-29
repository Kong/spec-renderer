import type { TargetId, ClientId } from 'httpsnippet'
export type LanguageCode = TargetId | 'json'
interface LibraryConfig {
  label: string
  httpSnippetLibrary: ClientId
}

interface LanguageConfig {
  label: string
  httpSnippetLanguage: LanguageCode
  highlightLanguage: string
  libraries?: LibraryConfig[]
}

export type RequestSampleConfigs = LanguageConfig[]
