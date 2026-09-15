# OAuth2 Authorization Code + PKCE

## What it does

For a security scheme using OAuth2's `authorizationCode` flow, the Try-It panel runs the
full authorization-code grant with PKCE (S256) in a pop-up window:

- It is a **public client** flow - no `client_secret` is ever collected or sent.
- The user signs in against the real (or mock) identity provider in a pop-up; the pop-up
  reports the authorization code back to the renderer and closes itself.
- The renderer exchanges the code for an access token itself, verifying its own PKCE
  code verifier against the challenge it sent.
- Tokens are held **in memory only** - never written to `localStorage` or
  `sessionStorage`. They do not survive a page reload, by design: there is nowhere safe
  for a component library embedded in an arbitrary host page to persist a bearer token
  without risking exposure to any other script on that origin.

## Host setup

`@kong/spec-renderer` cannot host its own OAuth callback page - it's a component
library, shipped both as Vue components and as framework-agnostic web components, and
has no route of its own inside the host application. The host must serve one and tell
the renderer its URL.

1. **Serve the callback page.** Host a static page - see [The callback page](#the-callback-page)
   below - at a stable URL on your own origin, e.g. `https://your-app.example.com/oauth-callback.html`.
2. **Register that exact URL** as an allowed redirect URI at your identity provider.
3. **Register the client as a public/SPA client using PKCE.** No `client_secret` should
   be issued or required - the renderer never sends one for `authorizationCode`.
4. **Set the redirect URI on the renderer**: the `oauthRedirectUri` prop (Vue) or the
   `oauth-redirect-uri` attribute (web component) must be set to the exact URL from step 1.
   In the sandbox, this is the "OAuth redirect URI" text input in the playground controls
   (`sandbox/pages/SpecRendererPlayground.vue`), bound to `oauthRedirectUri`.
5. **Enable CORS on the token endpoint** for the origin the docs/renderer page is served
   from - see [CORS](#cors) below.

## The callback page

The callback page's only job is to read `code`/`state` (or `error`/`error_description`)
off its own URL and hand them back to the window that opened it. This is the exact file
used in this repo's sandbox (`sandbox/public/oauth-callback.html`):

```html
<!doctype html>
<!--
  OAuth2 authorization-code callback page.

  This is the page the identity provider redirects the pop-up back to once the user
  authorizes (or denies) access. It reads `code`/`state` (or `error`/`error_description`)
  from the query string and hands them to the opener (the page that opened the pop-up)
  via `postMessage`, then closes itself.

  Host applications must serve a copy of this exact file at the URL they pass as the
  `oauthRedirectUri` prop (or `oauth-redirect-uri` attribute). See docs/oauth-pkce.md.

  This file is intentionally plain HTML/JS with no framework and no build step - it must
  load and run instantly, with nothing (router boot, auth guards, bundlers) that could
  delay or drop the callback.
-->
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Signing in...</title>
</head>
<body>
  <p id="message">Signing in...</p>

  <script>
    // The message contract with the renderer's opener side
    // (see `src/utils/oauth-popup.ts` in @kong/spec-renderer).
    var OAUTH_MESSAGE_TYPE = 'kong-spec-renderer:oauth-callback';

    function showFallback(text) {
      var el = document.getElementById('message');
      el.textContent = text;
    }

    function main() {
      var params = new URLSearchParams(window.location.search);

      // Never render or log `code` - it is a live, single-use authorization code.
      var code = params.get('code') || undefined;
      var state = params.get('state') || undefined;
      var error = params.get('error') || undefined;
      var errorDescription = params.get('error_description') || undefined;

      var message = {
        type: OAUTH_MESSAGE_TYPE,
        version: 1,
        state: state,
        code: code,
        error: error,
        error_description: errorDescription,
      };

      try {
        if (!window.opener) {
          // `window.opener` can be missing/null if the opener was closed, or if the
          // opener page is served with `Cross-Origin-Opener-Policy: same-origin` (that
          // header severs the opener relationship once this pop-up navigates away to the
          // identity provider, and it is not restored on return). There is no way to
          // recover the token/code exchange from here - show a visible message instead
          // of failing silently, so the user isn't left staring at a page that hangs.
          showFallback('Sign-in finished, but this window lost its connection to the page ' +
            'that opened it, so it could not report back. This usually means the opener ' +
            'page has "Cross-Origin-Opener-Policy: same-origin" set - use ' +
            '"same-origin-allow-popups" instead, or unset the header. You can close this window.');
          return;
        }

        // IMPORTANT: `targetOrigin` must be an exact origin, never '*'. This deployment
        // is same-origin with the renderer page, so `window.location.origin` is correct.
        // A cross-origin deployment must hardcode the renderer's exact origin here
        // instead - '*' would broadcast the authorization code to any document that
        // happens to be the opener.
        window.opener.postMessage(message, window.location.origin);

        showFallback('Signing in... you can close this window.');
        window.close();
      } catch (e) {
        showFallback('Sign-in finished, but reporting back to the opener failed. You can close this window.');
      }
    }

    main();
  </script>
</body>
</html>
```

The message contract is defined in `src/utils/oauth-popup.ts`:

```ts
{
  type: 'kong-spec-renderer:oauth-callback',
  version: 1,
  state: string,
  code?: string,
  error?: string,
  error_description?: string,
}
```

The opener validates, in order: `event.origin` against the origin of the configured
redirect URI, then `event.source` against the pop-up it opened, then the message shape,
then that `state` matches the value it sent.

This page should be a **plain static file**, not a route inside the host's own SPA - no
router boot, no auth guard, nothing that can delay or drop the callback before it can
`postMessage` and close itself. Serving it **same-origin** with the page that embeds the
renderer is strongly preferred; a cross-origin deployment is possible but requires
hardcoding the renderer's exact origin as `targetOrigin` in the snippet above instead of
`window.location.origin`.

## Cross-Origin-Opener-Policy

**`Cross-Origin-Opener-Policy: same-origin` on the page that embeds the renderer silently
breaks pop-up sign-in, with no library-side workaround.** When the pop-up navigates to the
identity provider's origin, `COOP: same-origin` on the *opener* page severs the
opener/pop-up relationship at that point - and it is **not** restored when the pop-up
navigates back to the (same-origin) callback page. `window.opener` in the callback page
comes back `null`, and `postMessage` never arrives; from the opener's side, the flow just
looks like the pop-up closed with no result.

The embedding page must be served with `Cross-Origin-Opener-Policy: same-origin-allow-popups`,
or with the header unset. There is nothing the renderer or the callback page can do to
detect or recover from this ahead of time - the callback page's fallback message (see
above) is the best available diagnostic.

## CORS

The two network hops in this flow have opposite CORS behavior, and this asymmetry is a
constant source of confusion:

- **`authorizationUrl`** - the pop-up's top-level navigation to the identity provider.
  This is a full page navigation, **not** a `fetch`/`XHR` request, so it is never subject
  to CORS. A failure here shows up as the identity provider's own error page (most
  commonly: the redirect URI wasn't registered, or doesn't match exactly).
- **`tokenUrl`** - the code-for-token exchange. This **is** a `fetch` request from the
  renderer's own origin to the identity provider, so it **is** subject to CORS. The token
  endpoint must answer the `OPTIONS` preflight and respond with
  `Access-Control-Allow-Origin` for the docs/renderer origin, plus `POST` in
  `Access-Control-Allow-Methods` and `Content-Type` in `Access-Control-Allow-Headers`.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Pop-up is blocked / never opens | The sign-in click handler awaited something (e.g. computing the PKCE challenge) before calling `window.open`, losing the click's user-activation - or the browser's pop-up blocker is on. |
| Pop-up closes with no result | The redirect URI isn't registered exactly at the identity provider, or the embedding page has `Cross-Origin-Opener-Policy: same-origin` (see above). |
| "Could not reach the token endpoint" | CORS: the token endpoint isn't answering `OPTIONS`, or isn't returning `Access-Control-Allow-Origin` for this origin. |
| `invalid_grant` | The PKCE code verifier didn't match the challenge sent at authorize time, the code was already used (single-use), or the code expired. |
| State mismatch | The `state` returned by the callback doesn't match what was sent - the flow is cancelled rather than proceeding, since this can indicate a cross-site request forgery attempt. |
| "Signing in requires a secure context" | `crypto.subtle` (used to derive the PKCE challenge) is unavailable outside a secure context - i.e. plain `http://` on anything other than `localhost`. Use HTTPS or `localhost`. |

## What is not supported

- The OAuth2 `implicit` and `password` (resource owner password credentials) flows are
  not supported.
- `client_secret` is not offered for `authorizationCode` by design - this flow is for
  public clients (PKCE replaces the client secret as proof of possession). If you need a
  confidential client, use `clientCredentials` instead.

## Local development

The sandbox ships a mock identity provider and a protected echo API
(`sandbox/mock-oauth-plugin.ts`, wired into `vite.config.ts` only for `USE_SANDBOX` dev
builds) so the whole flow can be exercised by hand without a real IdP:

1. `pnpm run dev`
2. In the sample-spec dropdown, pick **OAuth2 Authorization Code (PKCE)**
   (`sandbox/public/specs/oauth-authorization-code.yaml`).
3. Set the **OAuth redirect URI** control in the playground to
   `http://localhost:5173/spec-renderer/oauth-callback.html`.
4. Use any value as the Client ID and click sign in on any of the spec's secured
   operations.

What the mock endpoints do:

- `GET /mock/oauth/authorize` - a tiny consent page with **Authorize** and **Deny**
  buttons. Authorize redirects back with a code; **Deny** redirects back with
  `error=access_denied`, so the denial path can be tested by hand.
- `POST /mock/oauth/token` - actually recomputes and verifies the PKCE challenge from the
  submitted `code_verifier` before issuing a token; rejects with `invalid_grant` on a
  mismatch. Tokens expire in 60 seconds by default, so the silent-refresh path is
  observable within a minute.
- `POST /mock/oauth/token-nocors` - identical, but omits all CORS headers and doesn't
  answer `OPTIONS`. Use the spec's `OAuthNoCors`-secured operation to reproduce the CORS
  guidance UI on demand.
- `ALL /mock/api/*` - the echo API the spec's `servers` entry points at: `401` without an
  `Authorization: Bearer` header, `200` with one, confirming the token actually reaches
  the request.
