export type NavigationTypes = 'path' | 'hash'

export interface DocumentNavigationItem {
  name: string
  uri: string
  type: 'previous' | 'next'
  method?: string
}
