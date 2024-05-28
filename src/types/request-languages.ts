import type { TargetId, ClientId } from 'httpsnippet-lite'
type TargetIdEx = TargetId | 'json'
interface LibraryConfig {
  label: string
  httpSnippetLibrary: ClientId
}

interface LanguageConfig {
  label: string
  httpSnippetLanguage: TargetIdEx
  libraries?: Array<LibraryConfig>
}

export type RequestSampleConfigs = Array<LanguageConfig>
