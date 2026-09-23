import { describe, it, expect } from 'vitest'
import { formatServerUrl, getServerIdentity } from './server-url'
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

describe('getServerIdentity', () => {
  it('should be the url template for a server without variables', () => {
    expect(getServerIdentity(<IServer>{ id: '1', url: 'https://api.example.com/v1' })).toBe('https://api.example.com/v1')
  })

  it('should prefer origUrl over the formatted url', () => {
    expect(getServerIdentity(<IServer>{ id: '1', origUrl: 'https://{env}.example.com', url: 'https://prod.example.com' })).toBe('https://{env}.example.com')
  })

  it('should include the declared variable defaults', () => {
    expect(getServerIdentity(<IServer>{
      id: '1',
      url: 'https://{region}.example.com',
      variables: {
        region: {
          default: 'us',
        },
      },
    })).toBe('https://{region}.example.com|region=us')
  })

  it('should be order-independent in the declared variables', () => {
    const identity = 'https://{region}.{env}.example.com|env=prod,region=us'
    expect(getServerIdentity(<IServer>{
      id: '1',
      url: 'https://{region}.{env}.example.com',
      variables: {
        region: {
          default: 'us',
        },
        env: {
          default: 'prod',
        },
      },
    })).toBe(identity)
    expect(getServerIdentity(<IServer>{
      id: '1',
      url: 'https://{region}.{env}.example.com',
      variables: {
        env: {
          default: 'prod',
        },
        region: {
          default: 'us',
        },
      },
    })).toBe(identity)
  })

  it('should ignore runtime variable overrides', () => {
    expect(getServerIdentity(<IServer>{
      id: '1',
      url: 'https://{region}.example.com',
      variables: {
        region: {
          default: 'us',
          extensions: { value: 'eu' },
        },
      },
    })).toBe('https://{region}.example.com|region=us')
  })

  it('should differ for servers that share a url template but declare different variable defaults', () => {
    expect(getServerIdentity(<IServer>{
      id: '1',
      url: 'https://{region}.example.com',
      variables: {
        region: {
          default: 'us',
        },
      },
    })).not.toBe(getServerIdentity(<IServer>{
      id: '2',
      url: 'https://{region}.example.com',
      variables: {
        region: {
          default: 'eu',
        },
      },
    }))
  })
})
