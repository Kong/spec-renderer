import { webcrypto } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  base64UrlEncode,
  buildAuthorizeUrl,
  buildPkceTarget,
  canUsePkce,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  PkceUnavailableError,
  PKCE_UNRESERVED,
  randomUnreservedString,
  sha256,
} from './oauth-pkce'
import type { IOauth2SecurityScheme } from '@stoplight/types'

// jsdom provides crypto.getRandomValues but not crypto.subtle, so WebCrypto is stubbed per-suite here rather than globally in vitest.setup.ts.
describe('oauth-pkce', () => {
  describe('with real WebCrypto', () => {
    beforeAll(() => {
      vi.stubGlobal('crypto', webcrypto)
    })

    afterAll(() => {
      vi.unstubAllGlobals()
    })

    it('matches the RFC 7636 Appendix B known-answer vector', async () => {
      const challenge = await generateCodeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')

      expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
    })

    describe('generateCodeVerifier', () => {
      it('defaults to length 43 matching the unreserved charset', () => {
        const verifier = generateCodeVerifier()

        expect(verifier).toHaveLength(43)
        expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/)
      })

      it('generates distinct verifiers across iterations', () => {
        const verifiers = new Set(Array.from({ length: 200 }, () => generateCodeVerifier()))

        expect(verifiers.size).toBe(200)
      })

      it('accepts the maximum length of 128', () => {
        expect(generateCodeVerifier(128)).toHaveLength(128)
      })

      it('throws RangeError below the minimum length', () => {
        expect(() => generateCodeVerifier(42)).toThrow(RangeError)
      })

      it('throws RangeError above the maximum length', () => {
        expect(() => generateCodeVerifier(129)).toThrow(RangeError)
      })
    })

    describe('generateState', () => {
      it('generates a 32-character string from the random alphabet', () => {
        const state = generateState()

        expect(state).toHaveLength(32)
        expect(state).toMatch(/^[A-Za-z0-9\-_]+$/)
      })

      it('generates distinct states across iterations', () => {
        const states = new Set(Array.from({ length: 200 }, () => generateState()))

        expect(states.size).toBe(200)
      })
    })

    describe('base64UrlEncode', () => {
      it('returns an empty string for empty input', () => {
        expect(base64UrlEncode(new Uint8Array())).toBe('')
      })

      it('produces url-safe output with no padding', () => {
        const encoded = base64UrlEncode(new Uint8Array([251, 255, 190]))

        expect(encoded).not.toContain('+')
        expect(encoded).not.toContain('/')
        expect(encoded).not.toContain('=')
        expect(encoded).toMatch(/[-_]/)
      })

      it('accepts an ArrayBuffer', () => {
        const bytes = new Uint8Array([1, 2, 3])
        expect(base64UrlEncode(bytes.buffer)).toBe(base64UrlEncode(bytes))
      })

      it('accepts a Uint8Array', () => {
        expect(base64UrlEncode(new Uint8Array([72, 101, 108]))).not.toBe('')
      })

      it('never contains padding at the 1-byte boundary', () => {
        expect(base64UrlEncode(new Uint8Array([1]))).not.toContain('=')
      })

      it('never contains padding at the 2-byte boundary', () => {
        expect(base64UrlEncode(new Uint8Array([1, 2]))).not.toContain('=')
      })

      it('never contains padding at the 3-byte boundary', () => {
        expect(base64UrlEncode(new Uint8Array([1, 2, 3]))).not.toContain('=')
      })
    })

    describe('canUsePkce', () => {
      it('returns true when getRandomValues and subtle.digest are both available', () => {
        expect(canUsePkce()).toBe(true)
      })
    })

    describe('buildAuthorizeUrl', () => {
      it('includes all required PKCE params in order with S256', () => {
        const result = buildAuthorizeUrl({
          authorizationUrl: 'https://auth.example.com/authorize',
          clientId: 'client-123',
          redirectUri: 'https://app.example.com/callback',
          scope: 'read write',
          state: 'the-state',
          codeChallenge: 'the-challenge',
        })

        const url = new URL(result)
        expect(url.searchParams.get('response_type')).toBe('code')
        expect(url.searchParams.get('client_id')).toBe('client-123')
        expect(url.searchParams.get('redirect_uri')).toBe('https://app.example.com/callback')
        expect(url.searchParams.get('scope')).toBe('read write')
        expect(url.searchParams.get('state')).toBe('the-state')
        expect(url.searchParams.get('code_challenge')).toBe('the-challenge')
        expect(url.searchParams.get('code_challenge_method')).toBe('S256')
      })

      it('omits scope entirely when empty', () => {
        const result = buildAuthorizeUrl({
          authorizationUrl: 'https://auth.example.com/authorize',
          clientId: 'client-123',
          redirectUri: 'https://app.example.com/callback',
          scope: '',
          state: 'the-state',
          codeChallenge: 'the-challenge',
        })

        expect(new URL(result).searchParams.has('scope')).toBe(false)
      })

      it('appends extraParams', () => {
        const result = buildAuthorizeUrl({
          authorizationUrl: 'https://auth.example.com/authorize',
          clientId: 'client-123',
          redirectUri: 'https://app.example.com/callback',
          scope: '',
          state: 'the-state',
          codeChallenge: 'the-challenge',
          extraParams: { audience: 'my-api' },
        })

        expect(new URL(result).searchParams.get('audience')).toBe('my-api')
      })

      it('preserves a pre-existing query param on authorizationUrl', () => {
        const result = buildAuthorizeUrl({
          authorizationUrl: 'https://auth.example.com/authorize?tenant=acme',
          clientId: 'client-123',
          redirectUri: 'https://app.example.com/callback',
          scope: '',
          state: 'the-state',
          codeChallenge: 'the-challenge',
        })

        expect(new URL(result).searchParams.get('tenant')).toBe('acme')
      })
    })
  })

  describe('with getRandomValues stubbed for bias detection', () => {
    afterAll(() => {
      vi.unstubAllGlobals()
    })

    it('produces the exact RANDOM_ALPHABET characters for sequential byte values, proving no modulo bias', () => {
      // Sequential bytes 0..255 wrapping; a % 66 implementation would produce a different string than & 63.
      vi.stubGlobal('crypto', {
        getRandomValues: (arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = i % 256
          }
          return arr
        },
      })

      const length = 70
      const result = randomUnreservedString(length)

      const RANDOM_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
      let expected = ''
      for (let i = 0; i < length; i++) {
        expected += RANDOM_ALPHABET[(i % 256) & 63]
      }

      expect(result).toBe(expected)
    })
  })

  describe('feature detection and error paths without crypto.subtle', () => {
    afterAll(() => {
      vi.unstubAllGlobals()
    })

    it('canUsePkce returns false when subtle.digest is missing', () => {
      vi.stubGlobal('crypto', { getRandomValues: vi.fn() })

      expect(canUsePkce()).toBe(false)
    })

    it('canUsePkce returns false when crypto is undefined', () => {
      vi.stubGlobal('crypto', undefined)

      expect(canUsePkce()).toBe(false)
    })

    it('sha256 throws PkceUnavailableError when subtle is absent', async () => {
      vi.stubGlobal('crypto', { getRandomValues: vi.fn() })

      await expect(sha256('input')).rejects.toThrow(PkceUnavailableError)
    })

    it('generateCodeChallenge throws PkceUnavailableError when subtle is absent', async () => {
      vi.stubGlobal('crypto', { getRandomValues: vi.fn() })

      await expect(generateCodeChallenge('verifier')).rejects.toThrow(PkceUnavailableError)
    })

    it('randomUnreservedString throws PkceUnavailableError when getRandomValues is absent', () => {
      vi.stubGlobal('crypto', {})

      expect(() => randomUnreservedString(43)).toThrow(PkceUnavailableError)
    })
  })

  describe('PKCE_UNRESERVED', () => {
    it('contains the full RFC 7636 §4.1 unreserved set (66 chars)', () => {
      expect(PKCE_UNRESERVED).toHaveLength(66)
      expect(PKCE_UNRESERVED).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~')
    })
  })

  describe('buildPkceTarget', () => {
    it('returns undefined when authorizationUrl is an empty string', () => {
      const scheme = {
        type: 'oauth2',
        flows: { authorizationCode: { authorizationUrl: '', tokenUrl: 'https://idp.test/token', scopes: {} } },
      } as unknown as IOauth2SecurityScheme
      expect(buildPkceTarget('k', scheme, 'client')).toBeUndefined()
    })

    it('returns undefined when tokenUrl is blank', () => {
      const scheme = {
        type: 'oauth2',
        flows: { authorizationCode: { authorizationUrl: 'https://idp.test/authorize', tokenUrl: '   ', scopes: {} } },
      } as unknown as IOauth2SecurityScheme
      expect(buildPkceTarget('k', scheme, 'client')).toBeUndefined()
    })

    const scheme = (flows: IOauth2SecurityScheme['flows']): IOauth2SecurityScheme => ({
      id: 'scheme-id',
      key: 'oauth2Auth',
      type: 'oauth2',
      flows,
    })

    it('flattens a valid authorizationCode flow', () => {
      const target = buildPkceTarget('oauth2Auth', scheme({
        authorizationCode: {
          authorizationUrl: 'https://auth.example.com/authorize',
          tokenUrl: 'https://auth.example.com/token',
          refreshUrl: 'https://auth.example.com/refresh',
          scopes: { read: 'Read access' },
        },
      }), 'client-123')

      expect(target).toEqual({
        schemeKey: 'oauth2Auth',
        authorizationUrl: 'https://auth.example.com/authorize',
        tokenUrl: 'https://auth.example.com/token',
        refreshUrl: 'https://auth.example.com/refresh',
        scopes: { read: 'Read access' },
        fingerprint: 'https://auth.example.com/authorize|https://auth.example.com/token|client-123',
      })
    })

    it('defaults scopes to an empty object when the flow has none', () => {
      const target = buildPkceTarget('oauth2Auth', scheme({
        authorizationCode: {
          authorizationUrl: 'https://auth.example.com/authorize',
          tokenUrl: 'https://auth.example.com/token',
        } as IOauth2SecurityScheme['flows']['authorizationCode'],
      }), 'client-123')

      expect(target?.scopes).toEqual({})
    })

    it('returns undefined when there is no authorizationCode flow', () => {
      const target = buildPkceTarget('oauth2Auth', scheme({
        clientCredentials: {
          tokenUrl: 'https://auth.example.com/token',
          scopes: {},
        },
      }), 'client-123')

      expect(target).toBeUndefined()
    })

    it('returns undefined when the authorizationCode flow is missing tokenUrl', () => {
      const target = buildPkceTarget('oauth2Auth', scheme({
        authorizationCode: {
          authorizationUrl: 'https://auth.example.com/authorize',
          scopes: {},
        } as IOauth2SecurityScheme['flows']['authorizationCode'],
      }), 'client-123')

      expect(target).toBeUndefined()
    })

    it('changes the fingerprint when the client id changes', () => {
      const flows: IOauth2SecurityScheme['flows'] = {
        authorizationCode: {
          authorizationUrl: 'https://auth.example.com/authorize',
          tokenUrl: 'https://auth.example.com/token',
          scopes: {},
        },
      }

      const targetA = buildPkceTarget('oauth2Auth', scheme(flows), 'client-a')
      const targetB = buildPkceTarget('oauth2Auth', scheme(flows), 'client-b')

      expect(targetA?.fingerprint).not.toBe(targetB?.fingerprint)
    })
  })
})
