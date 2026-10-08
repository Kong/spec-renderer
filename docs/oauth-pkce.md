# OAuth2 authorization code + PKCE in Try It

The Try It panel can sign users in with the OAuth 2.0 authorization code flow and PKCE (S256), then send the access token with the request. The PKCE panel is opt-in: it shows for any security scheme that declares an `authorizationCode` flow once the host passes `oauthRedirectUri`, as long as its authorization and token URLs are absolute http(s) URLs (otherwise the Access Token input stays). A scheme that declares both `clientCredentials` and `authorizationCode` then shows both panels. Next to the auth section title, a status badge shows Unauthenticated, Authorizing, Authenticated or Expired.

The sign-in happens in a popup. The identity provider redirects the popup to a callback page that your app serves, and that page passes the authorization code back to spec-renderer. Spec-renderer then exchanges the code for a token directly from the browser.

## Pass the redirect URI

Spec-renderer cannot guess the redirect URI. It has to be a real page that your app serves, registered exactly with the identity provider, and running the small callback script described below. Without the prop nothing changes for existing hosts: `authorizationCode` schemes keep the Access Token input, where users paste a token, and a scheme that declares both flows shows only the client credentials panel. Passing the prop turns the PKCE panel and the status badge on.

Vue component:

```vue
<SpecRenderer
  :spec="spec"
  oauth-redirect-uri="https://docs.example.com/oauth-callback.html"
/>
```

Web component:

```html
<kong-spec-renderer
  oauth-redirect-uri="https://docs.example.com/oauth-callback.html"
></kong-spec-renderer>
```

The page must use `http` or `https`, and the app must run in a secure context (HTTPS or `localhost`).

## The callback page

Serve a page at the redirect URI. It reads `code`, `state`, `error` and `error_description` from the URL and posts them to `window.opener`, using the message type exported by spec-renderer:

```js
import { OAUTH_MESSAGE_TYPE } from '@kong/spec-renderer'

window.opener.postMessage({
  type: OAUTH_MESSAGE_TYPE,
  state,
  code,
  error,
  error_description,
}, window.location.origin)
```

If the page has no build step, or importing would bundle spec-renderer into an otherwise tiny page, use the constant's value `'kong-spec-renderer:oauth-callback'` directly, like the [sandbox page](../sandbox/public/oauth-callback.html).

Rules:

- The target origin must be the page's own origin (`window.location.origin`). Never use `'*'`. Spec-renderer only accepts messages whose origin matches the redirect URI's origin, so the callback page has to be served from the same origin as the page that renders spec-renderer.
- Never log or display the code. It is a live, single-use credential.

A copy-pasteable page is in [`sandbox/public/oauth-callback.html`](../sandbox/public/oauth-callback.html).

## Identity provider setup

- Register a public client (single-page app type) that uses the authorization code flow with PKCE (S256).
- Do not use a client secret. Spec-renderer runs in the browser and cannot keep one.
- Register the redirect URI exactly as you pass it in `oauthRedirectUri`, including scheme, host, port and path.
- Allow the scopes your spec declares.

## CORS on the token endpoint

The browser calls the token endpoint directly, so the endpoint must:

- answer the preflight `OPTIONS` request,
- allow your app's origin (`Access-Control-Allow-Origin`),
- allow the `POST` method and the `Content-Type` header.

If CORS is wrong, spec-renderer shows "Unable to reach the token endpoint at <origin>." This usually means CORS. The browser console and network tab show the exact failure.

## Cross-Origin-Opener-Policy

The page that renders spec-renderer must send `Cross-Origin-Opener-Policy: same-origin-allow-popups`, or no such header. The value `same-origin` cuts the popup's link to the page, so the callback cannot report back and sign-in fails.

## Trust model

The OAuth URLs come from the spec. The popup keeps `window.opener`, because the callback page needs it to post the result. This means an attacker-controlled `authorizationUrl` could navigate the host window. This is an accepted risk.

If you render specs you do not control, vet the security scheme URLs (`authorizationUrl` and `tokenUrl`) before passing the spec in. The panel shows the sign-in host next to the Authorize button, so users can see where they will sign in.

## Tokens

- Tokens are kept in memory only. They are never written to `localStorage` or `sessionStorage`, and they are lost on reload.
- There is no refresh. Spec-renderer treats a token as expired 30 seconds before its real expiry. When it expires, the badge shows Expired and Send is blocked with a session-expired message. Click Authorize again.

## Try it locally

The sandbox uses the public demo server of Duende IdentityServer. It is a third-party server that can change or go down at any time. Use it for local testing only, and never enter real credentials.

1. Run `pnpm run dev`.
2. Select "OAuth2 Authorization Code (PKCE)" in the sample spec selector. The "OAuth redirect URI" input is prefilled with `<origin>/spec-renderer/oauth-callback.html`.
3. Open `GET /test` and open the Try It auth section.
4. Enter Client ID `interactive.public.short` (75 second token, so the Expired badge shows after about 45 seconds) or `interactive.public` (1 hour token).
5. Tick the `api` scope and click Authorize.
6. Log in as `bob` / `bob` (or `alice` / `alice`). The popup closes and the badge shows Authenticated.
7. Click Send. The request returns 200.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| An `authorizationCode` scheme shows only an Access Token input, no Authorize button | The `oauthRedirectUri` prop is not set. |
| "Your browser blocked the sign-in window" | The browser blocked the popup. Allow popups for the site. |
| The popup shows an identity provider error, and after you close it the panel says the redirect URI is most likely not registered | The identity provider rejected the redirect URI. Register it exactly. |
| "Signing in requires a secure context" | The page is not served over HTTPS or from `localhost`. |
