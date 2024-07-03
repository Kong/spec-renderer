import type { RequestSampleConfigs } from './types'

/*
 libraries are commented, so code viewer will be using default library
 for each language foe now
*/
export const requestSampleConfigs: RequestSampleConfigs = [
  {
    label: 'Shell',
    httpSnippetLanguage: 'shell',
    highlightLanguage: 'fish',
    // libraries: [
    //   {
    //     label: 'cURL',
    //     httpSnippetLibrary: 'curl',
    //   },
    //   {
    //     label: 'Wget',
    //     httpSnippetLibrary: 'wget',
    //   },
    // ],
  },
  {
    label: 'JSON (body)',
    httpSnippetLanguage: 'json',
    highlightLanguage: 'json',
  },
  {
    label: 'Python',
    httpSnippetLanguage: 'python',
    highlightLanguage: 'python',
    // libraries: [
    //   {
    //     label: 'Python 3',
    //     httpSnippetLibrary: 'python3',
    //   },
    //   {
    //     label: 'Requests',
    //     httpSnippetLibrary: 'requests',
    //   },
    // ],
  },
  {
    label: 'Node',
    httpSnippetLanguage: 'node',
    highlightLanguage: 'javascript',
    // libraries: [
    //   {
    //     label: 'Native',
    //     httpSnippetLibrary: 'native',
    //   },
    //   {
    //     label: 'Request',
    //     httpSnippetLibrary: 'request',
    //   },
    //   {
    //     label: 'Unirest',
    //     httpSnippetLibrary: 'unirest',
    //   },
    //   {
    //     label: 'Fetch',
    //     httpSnippetLibrary: 'fetch',
    //   },
    //   {
    //     label: 'Axios',
    //     httpSnippetLibrary: 'axios',
    //   },
    // ],
  },
  {
    label: 'JavaScript',
    httpSnippetLanguage: 'javascript',
    highlightLanguage: 'javascript',
    // libraries: [
    //   {
    //     label: 'Fetch',
    //     httpSnippetLibrary: 'fetch',
    //   },
    //   {
    //     label: 'XMLHttpRequest',
    //     httpSnippetLibrary: 'xhr',
    //   },
    //   {
    //     label: 'Axios',
    //     httpSnippetLibrary: 'axios',
    //   },
    // ],
  },
  {
    label: 'Go',
    httpSnippetLanguage: 'go',
    highlightLanguage: 'go',
  },
  {
    label: 'Java',
    httpSnippetLanguage: 'java',
    highlightLanguage: 'java',
    // libraries: [
    //   {
    //     label: 'AsyncHttp',
    //     httpSnippetLibrary: 'asynchttp',
    //   },
    //   {
    //     label: 'NetHttp',
    //     httpSnippetLibrary: 'nethttp',
    //   },
    //   {
    //     label: 'OkHttp',
    //     httpSnippetLibrary: 'okhttp',
    //   },
    //   {
    //     label: 'Unirest',
    //     httpSnippetLibrary: 'unirest',
    //   },
    // ],
  },
  {
    label: 'Ruby',
    httpSnippetLanguage: 'ruby',
    highlightLanguage: 'ruby',
  },
]

// maximum nested levels to look deep when generating request/response sample
export const MAX_NESTED_LEVELS = 10
