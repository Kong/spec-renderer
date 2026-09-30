import { webcrypto } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  buildAuthorizeUrl,
  buildPkceTarget,
  canUsePkce,
  createPkceChallenge,
  generateCodeChallenge,
  isAbsoluteHttpUrl,
} from './oauth-pkce'
import type { IOauth2SecurityScheme } from '@stoplight/types'

const RANDOM_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

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

    describe('createPkceChallenge', () => {
      it('generates a 43-character verifier from the unreserved charset', async () => {
        const { verifier } = await createPkceChallenge()

        expect(verifier).toHaveLength(43)
        expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/)
      })

      it('generates a 32-character state', async () => {
        const { state } = await createPkceChallenge()

        expect(state).toHaveLength(32)
        expect(state).toMatch(/^[A-Za-z0-9\-_]+$/)
      })

      it('challenge matches generateCodeChallenge(verifier)', async () => {
        const { verifier, challenge } = await createPkceChallenge()

        expect(challenge).toBe(await generateCodeChallenge(verifier))
      })

      it('generates distinct verifiers across iterations', async () => {
        const challenges = await Promise.all(Array.from({ length: 200 }, () => createPkceChallenge()))

        expect(new Set(challenges.map(c => c.verifier)).size).toBe(200)
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

    it('produces the exact RANDOM_ALPHABET characters for byte values starting at 64, proving no modulo bias', async () => {
      // byte i is i + 64 (>= 64, so `& 63` and `% 66` disagree). A `% 66` implementation would not match RANDOM_ALPHABET.slice(0, 43).
      vi.stubGlobal('crypto', {
        getRandomValues: (arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = i + 64
          }
          return arr
        },
        subtle: webcrypto.subtle,
      })

      const { verifier } = await createPkceChallenge()

      expect(verifier).toBe(RANDOM_ALPHABET.slice(0, 43))
    })
  })

  describe('feature detection', () => {
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
  })

  describe('isAbsoluteHttpUrl', () => {
    for (const { name, url, expected } of [
      { name: 'an https URL', url: 'https://auth.example.com/authorize', expected: true },
      { name: 'an http URL', url: 'http://localhost:8443/token', expected: true },
      { name: 'a javascript: URL', url: 'javascript:evil();//', expected: false },
      { name: 'a javascript: URL without comment syntax', url: 'javascript:alert(1)', expected: false },
      { name: 'another scheme like ftp', url: 'ftp://auth.example.com/authorize', expected: false },
      { name: 'a non-URL string', url: 'not a url', expected: false },
      { name: 'an empty string', url: '', expected: false },
      { name: 'a protocol-relative URL since new URL has no base', url: '//auth.example.com/authorize', expected: false },
    ]) {
      it(`returns ${expected} for ${name}`, () => {
        expect(isAbsoluteHttpUrl(url)).toBe(expected)
      })
    }
  })

  describe('buildPkceTarget', () => {
    const scheme = (flows: IOauth2SecurityScheme['flows']): IOauth2SecurityScheme => ({
      id: 'scheme-id',
      key: 'oauth2Auth',
      type: 'oauth2',
      flows,
    })

    it('flattens a valid authorizationCode flow', () => {
      const target = buildPkceTarget(scheme({
        authorizationCode: {
          authorizationUrl: 'https://auth.example.com/authorize',
          tokenUrl: 'https://auth.example.com/token',
          scopes: { read: 'Read access' },
        },
      }), 'client-123')

      expect(target).toEqual({
        schemeKey: 'oauth2Auth',
        authorizationUrl: 'https://auth.example.com/authorize',
        tokenUrl: 'https://auth.example.com/token',
        scopes: { read: 'Read access' },
        fingerprint: 'https://auth.example.com/authorize|https://auth.example.com/token|client-123',
      })
    })

    it('defaults scopes to an empty object when the flow has none', () => {
      const target = buildPkceTarget(scheme({
        authorizationCode: {
          authorizationUrl: 'https://auth.example.com/authorize',
          tokenUrl: 'https://auth.example.com/token',
        } as IOauth2SecurityScheme['flows']['authorizationCode'],
      }), 'client-123')

      expect(target?.scopes).toEqual({})
    })

    for (const { name, flows } of [
      { name: 'authorizationUrl is an empty string', flows: { authorizationCode: { authorizationUrl: '', tokenUrl: 'https://idp.test/token', scopes: {} } } },
      { name: 'tokenUrl is blank', flows: { authorizationCode: { authorizationUrl: 'https://idp.test/authorize', tokenUrl: '   ', scopes: {} } } },
      { name: 'there is no authorizationCode flow', flows: { clientCredentials: { tokenUrl: 'https://auth.example.com/token', scopes: {} } } },
      { name: 'the authorizationCode flow is missing tokenUrl', flows: { authorizationCode: { authorizationUrl: 'https://auth.example.com/authorize', scopes: {} } } },
      { name: 'authorizationUrl is a javascript: URL', flows: { authorizationCode: { authorizationUrl: 'javascript:evil();//', tokenUrl: 'https://auth.example.com/token', scopes: {} } } },
      { name: 'tokenUrl is a javascript: URL', flows: { authorizationCode: { authorizationUrl: 'https://auth.example.com/authorize', tokenUrl: 'javascript:evil();//', scopes: {} } } },
    ]) {
      it(`returns undefined when ${name}`, () => {
        expect(buildPkceTarget(scheme(flows as IOauth2SecurityScheme['flows']), 'client-123')).toBeUndefined()
      })
    }

    it('changes the fingerprint when the client id changes', () => {
      const flows: IOauth2SecurityScheme['flows'] = {
        authorizationCode: {
          authorizationUrl: 'https://auth.example.com/authorize',
          tokenUrl: 'https://auth.example.com/token',
          scopes: {},
        },
      }

      const targetA = buildPkceTarget(scheme(flows), 'client-a')
      const targetB = buildPkceTarget(scheme(flows), 'client-b')

      expect(targetA?.fingerprint).not.toBe(targetB?.fingerprint)
    })
  })
})
