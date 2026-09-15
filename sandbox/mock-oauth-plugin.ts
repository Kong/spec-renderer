// Vite dev-server plugin: a mock OAuth2 identity provider + protected API, so the
// authorization-code + PKCE flow can be exercised end to end in the sandbox without a
// real IdP. Dev/sandbox only - never registered in the library or web-component build
// (see the `USE_SANDBOX` guard around this plugin in `vite.config.ts`).
//
// Vite's base-stripping middleware order is easy to get wrong, so every route here is
// matched against BOTH the un-prefixed path (`/mock/...`) and the sandbox base-prefixed
// path (`/spec-renderer/mock/...`).
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createHash, randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Plugin } from 'vite'

// ─── In-memory stores (dev-only, reset on server restart) ──────────────────────

interface StoredAuthorization {
  codeChallenge: string
  redirectUri: string
  clientId: string
  scope: string
}

interface StoredRefreshToken {
  clientId: string
  scope: string
}

const pendingAuthorizations = new Map<string, StoredAuthorization>()
const refreshTokens = new Map<string, StoredRefreshToken>()

// ─── Small helpers ───────────────────────────────────────────────────────────────

const BASE_PREFIX = '/spec-renderer'

/**
 * The sample spec has to name absolute `authorizationUrl`/`tokenUrl`/`servers` values
 * (a relative URL would fail `new URL()` in the flow code), so it bakes in
 * `http://localhost:5173`. But Vite picks the next free port when 5173 is taken, which
 * would leave the fixture pointing at a different server - or nothing at all. Serve it
 * through a rewrite so it always targets whatever origin the dev server actually bound to.
 */
const SPEC_ROUTE = '/specs/oauth-authorization-code.yaml'
const SPEC_BAKED_ORIGIN = 'http://localhost:5173'

/**
 * The callback page lives in `sandbox/public`, so Vite serves it at the base-prefixed
 * `/spec-renderer/oauth-callback.html`. Requesting it WITHOUT the prefix returns Vite's
 * "public base URL" error page instead, which is a silent trap: the pop-up lands on that
 * error page, never posts the code back, and the only visible symptom is an unauthorized
 * API response. Serve it from here at the un-prefixed path too, so either value works in
 * the playground's "OAuth redirect URI" field.
 */
const CALLBACK_ROUTE = '/oauth-callback.html'

/** Strip the sandbox's `/spec-renderer` base prefix, if present, so every handler below
 *  only ever has to match the un-prefixed path. */
const stripBase = (pathname: string): string =>
  pathname.startsWith(BASE_PREFIX) ? pathname.slice(BASE_PREFIX.length) || '/' : pathname

const toBase64Url = (buffer: Buffer): string =>
  buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const randomToken = (bytes = 32): string => toBase64Url(randomBytes(bytes))

const sha256Base64Url = (input: string): string =>
  toBase64Url(createHash('sha256').update(input).digest())

const sendJson = (res: ServerResponse, status: number, body: unknown): void => {
  const payload = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(payload)
}

const sendHtml = (res: ServerResponse, status: number, html: string): void => {
  res.statusCode = status
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end(html)
}

const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })

/** Apply permissive dev-only CORS to every mock endpoint except `/token-nocors`, which
 *  deliberately omits this so the CORS-guidance UI can be reproduced on demand. */
const applyCors = (req: IncomingMessage, res: ServerResponse): void => {
  const origin = req.headers.origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization')
}

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ─── Consent page (GET /mock/oauth/authorize) ───────────────────────────────────

interface AuthorizeParams {
  responseType: string | null
  clientId: string | null
  redirectUri: string | null
  state: string | null
  codeChallenge: string | null
  codeChallengeMethod: string | null
  scope: string | null
  decision: string | null
}

const parseAuthorizeParams = (searchParams: URLSearchParams): AuthorizeParams => ({
  responseType: searchParams.get('response_type'),
  clientId: searchParams.get('client_id'),
  redirectUri: searchParams.get('redirect_uri'),
  state: searchParams.get('state'),
  codeChallenge: searchParams.get('code_challenge'),
  codeChallengeMethod: searchParams.get('code_challenge_method'),
  scope: searchParams.get('scope'),
  decision: searchParams.get('decision'),
})

/** Hidden `<input>`s that re-post every original authorize param, so the consent page's
 *  Authorize/Deny buttons can each submit a plain GET form back to this same endpoint. */
const hiddenFields = (params: AuthorizeParams, decision: 'allow' | 'deny'): string => {
  const fields: Array<[string, string | null]> = [
    ['response_type', params.responseType],
    ['client_id', params.clientId],
    ['redirect_uri', params.redirectUri],
    ['state', params.state],
    ['code_challenge', params.codeChallenge],
    ['code_challenge_method', params.codeChallengeMethod],
    ['scope', params.scope],
    ['decision', decision],
  ]
  return fields
    .filter(([, value]) => value !== null)
    .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value as string)}">`)
    .join('\n      ')
}

const renderConsentPage = (params: AuthorizeParams): string => {
  const scopes = (params.scope ?? '').split(' ').filter(Boolean)
  const scopeList = scopes.length
    ? `<ul>${scopes.map((s) => `<li><code>${escapeHtml(s)}</code></li>`).join('')}</ul>`
    : '<p><em>(no scopes requested)</em></p>'

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Mock IdP - Authorize</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 48px auto; padding: 0 16px; }
    .client { font-weight: 600; }
    button { font-size: 1rem; padding: 8px 16px; margin-right: 8px; cursor: pointer; }
    .authorize { background: #1f8a4c; color: #fff; border: none; border-radius: 4px; }
    .deny { background: #fff; color: #333; border: 1px solid #ccc; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Mock Identity Provider</h1>
  <p><span class="client">${escapeHtml(params.clientId ?? '(no client_id)')}</span> is requesting access to:</p>
  ${scopeList}
  <form method="get" style="display:inline">
    ${hiddenFields(params, 'allow')}
    <button class="authorize" type="submit">Authorize</button>
  </form>
  <form method="get" style="display:inline">
    ${hiddenFields(params, 'deny')}
    <button class="deny" type="submit">Deny</button>
  </form>
</body>
</html>`
}

const renderAuthorizeError = (message: string): string => `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Mock IdP - Error</title></head>
<body>
  <h1>Authorization request rejected</h1>
  <p>${escapeHtml(message)}</p>
</body>
</html>`

const handleAuthorize = (req: IncomingMessage, res: ServerResponse, searchParams: URLSearchParams): void => {
  const params = parseAuthorizeParams(searchParams)

  const missing = (['responseType', 'redirectUri', 'state', 'codeChallenge'] as const)
    .filter((key) => !params[key])
  if (params.responseType !== null && params.responseType !== 'code') {
    sendHtml(res, 400, renderAuthorizeError(`Unsupported response_type "${params.responseType}". Only "code" is supported.`))
    return
  }
  if (missing.length > 0) {
    sendHtml(res, 400, renderAuthorizeError(`Missing required parameter(s): ${missing.join(', ')}.`))
    return
  }
  if (params.codeChallengeMethod !== 'S256') {
    sendHtml(res, 400, renderAuthorizeError('code_challenge_method must be "S256". This mock does not support "plain".'))
    return
  }

  const redirectUri = params.redirectUri as string
  const state = params.state as string

  if (params.decision === 'deny') {
    const url = new URL(redirectUri)
    url.searchParams.set('error', 'access_denied')
    url.searchParams.set('error_description', 'The user denied the authorization request.')
    url.searchParams.set('state', state)
    res.statusCode = 302
    res.setHeader('Location', url.toString())
    res.end()
    return
  }

  if (params.decision === 'allow') {
    const code = randomToken(24)
    pendingAuthorizations.set(code, {
      codeChallenge: params.codeChallenge as string,
      redirectUri,
      clientId: params.clientId ?? '',
      scope: params.scope ?? '',
    })

    const url = new URL(redirectUri)
    url.searchParams.set('code', code)
    url.searchParams.set('state', state)
    res.statusCode = 302
    res.setHeader('Location', url.toString())
    res.end()
    return
  }

  // No decision yet - show the consent page.
  sendHtml(res, 200, renderConsentPage(params))
}

// ─── Token endpoint (POST /mock/oauth/token[-nocors]) ───────────────────────────

const issueTokenResponse = (res: ServerResponse, expiresIn: number, scope: string, refreshToken: string): void => {
  sendJson(res, 200, {
    access_token: `mock_access_${randomToken(16)}`,
    token_type: 'Bearer',
    expires_in: expiresIn,
    refresh_token: refreshToken,
    scope,
  })
}

const handleToken = async (req: IncomingMessage, res: ServerResponse, searchParams: URLSearchParams): Promise<void> => {
  const raw = await readBody(req)
  const body = new URLSearchParams(raw)
  const grantType = body.get('grant_type')

  const expiresInOverride = Number(searchParams.get('expires_in'))
  const expiresIn = Number.isFinite(expiresInOverride) && expiresInOverride > 0 ? expiresInOverride : 60

  if (grantType === 'authorization_code') {
    const code = body.get('code') ?? ''
    const verifier = body.get('code_verifier') ?? ''

    const stored = pendingAuthorizations.get(code)
    if (!stored) {
      sendJson(res, 400, { error: 'invalid_grant', error_description: 'Unknown or already-used authorization code.' })
      return
    }

    // The whole point of this mock: actually recompute the PKCE challenge from the
    // verifier and compare, rather than always succeeding. An always-200 mock would
    // hide a base64url/encoding bug in the real PKCE implementation.
    const recomputedChallenge = sha256Base64Url(verifier)
    if (recomputedChallenge !== stored.codeChallenge) {
      sendJson(res, 400, { error: 'invalid_grant', error_description: 'PKCE verification failed' })
      return
    }

    // Single-use: delete immediately, success or not past this point.
    pendingAuthorizations.delete(code)

    const refreshToken = randomToken(24)
    refreshTokens.set(refreshToken, { clientId: stored.clientId, scope: stored.scope })
    issueTokenResponse(res, expiresIn, stored.scope, refreshToken)
    return
  }

  if (grantType === 'refresh_token') {
    const refreshToken = body.get('refresh_token') ?? ''
    const stored = refreshTokens.get(refreshToken)
    if (!stored) {
      sendJson(res, 400, { error: 'invalid_grant', error_description: 'Unknown refresh token.' })
      return
    }

    // Issue a new access token; keep the same refresh token so repeated silent refreshes
    // in the sandbox keep working.
    issueTokenResponse(res, expiresIn, stored.scope, refreshToken)
    return
  }

  sendJson(res, 400, { error: 'unsupported_grant_type' })
}

/** Runs `handleToken`, reporting any unexpected failure as a JSON 500 rather than
 *  letting it become an unhandled rejection (this is invoked fire-and-forget from
 *  Connect middleware, which has no way to `await` it). */
const handleTokenSafely = (req: IncomingMessage, res: ServerResponse, searchParams: URLSearchParams): void => {
  handleToken(req, res, searchParams).catch((error: unknown) => {
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'server_error', error_description: error instanceof Error ? error.message : String(error) })
    }
  })
}

// ─── Protected echo API (ALL /mock/api/*) ───────────────────────────────────────

const handleApiEcho = (req: IncomingMessage, res: ServerResponse): void => {
  const authorization = req.headers.authorization
  if (!authorization || !authorization.startsWith('Bearer ')) {
    sendJson(res, 401, { error: 'unauthorized' })
    return
  }
  sendJson(res, 200, { ok: true, sawAuthorization: true })
}

// ─── Plugin ────────────────────────────────────────────────────────────────────

const handleCallbackPage = async (res: ServerResponse): Promise<void> => {
  const html = await readFile(join(process.cwd(), 'sandbox', 'public', 'oauth-callback.html'), 'utf8')
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(html)
}

const handleSampleSpec = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const host = req.headers.host ?? 'localhost:5173'
  const yaml = await readFile(join(process.cwd(), 'sandbox', 'public', SPEC_ROUTE.replace(/^\//, '')), 'utf8')
  const rewritten = yaml.replaceAll(SPEC_BAKED_ORIGIN, `http://${host}`)

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/yaml; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(rewritten)
}

export const mockOAuthPlugin = (): Plugin => ({
  name: 'kong-spec-renderer:mock-oauth',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (!req.url) {
        next()
        return
      }

      const parsed = new URL(req.url, 'http://localhost')
      const pathname = stripBase(parsed.pathname)
      const method = (req.method ?? 'GET').toUpperCase()

      if (pathname === CALLBACK_ROUTE && method === 'GET') {
        handleCallbackPage(res).catch(() => next())
        return
      }

      if (pathname === SPEC_ROUTE && method === 'GET') {
        handleSampleSpec(req, res).catch(() => next())
        return
      }

      if (pathname === '/mock/oauth/authorize' && method === 'GET') {
        handleAuthorize(req, res, parsed.searchParams)
        return
      }

      if (pathname === '/mock/oauth/token') {
        applyCors(req, res)
        if (method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }
        if (method === 'POST') {
          handleTokenSafely(req, res, parsed.searchParams)
          return
        }
      }

      if (pathname === '/mock/oauth/token-nocors') {
        // Deliberately no CORS headers and no OPTIONS handling - reproduces the
        // CORS-failure guidance UI on demand.
        if (method === 'POST') {
          handleTokenSafely(req, res, parsed.searchParams)
          return
        }
      }

      if (pathname.startsWith('/mock/api/')) {
        applyCors(req, res)
        if (method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }
        handleApiEcho(req, res)
        return
      }

      next()
    })
  },
})

export default mockOAuthPlugin
