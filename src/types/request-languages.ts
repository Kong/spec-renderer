interface LibraryConfig {
  label: string
  httpSnippetLibrary: string
}

interface LanguageConfig {
  label: string
  httpSnippetLanguage: string
  libraries?: Array<LibraryConfig>
}

export type RequestSampleConfigs = Array<LanguageConfig>
