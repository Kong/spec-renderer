import { describe, it, expect } from 'vitest'
import { formatServerUrl } from './server-url'
import type { IServer } from '@/types'

describe('formatServerUrl', () => {
  it('should return an empty string for an undefined server', () => {
    expect(formatServerUrl(undefined)).toBe('')
  })

  it('should return the server url', () => {
    expect(formatServerUrl(<IServer>{ id: '1', url: 'https://api.example.com/v1' })).toBe('https://api.example.com/v1')
  })

  it('should strip a trailing slash', () => {
    expect(formatServerUrl(<IServer>{ id: '1', url: 'https://api.example.com/v1/' })).toBe('https://api.example.com/v1')
  })

  it('should prefer origUrl over the formatted url', () => {
    expect(formatServerUrl(<IServer>{ id: '1', origUrl: 'https://{env}.example.com', url: 'https://prod.example.com' })).toBe('https://{env}.example.com')
  })

  it('should substitute server variables with their defaults', () => {
    expect(formatServerUrl(<IServer>{
      id: '1',
      url: 'https://{region}.example.com',
      variables: {
        region: {
          default: 'prod',
          enum: ['prod', 'staging'],
        },
      },
    })).toBe('https://prod.example.com')
  })

  it('should prefer a variable value set at runtime over its default', () => {
    expect(formatServerUrl(<IServer>{
      id: '1',
      url: 'https://{region}.example.com',
      variables: {
        region: {
          default: 'prod',
          extensions: { value: 'staging' },
        },
      },
    })).toBe('https://staging.example.com')
  })
})
