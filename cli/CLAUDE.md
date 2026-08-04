# CLAUDE.md (cli/)

Guidance for working on the `kong-spec-renderer preview <spec>` CLI specifically. This
file is source-only (not published - `package.json`'s `files` field is `["dist"]`, so only
the compiled `dist/cli/` output ships). See the root `CLAUDE.md` for the rest of the repo,
and `cli/README.md` for user-facing flag/usage docs - keep that file in sync with `index.ts`
whenever a flag is added, renamed, or its default changes.

## What this is

A standalone CLI, runnable via `npx`/`pnpm dlx` with no host project, that serves the
package's own pre-built web-component bundle in a minimal static+websocket server, so a
user can preview a local spec file (or remote URL) with live-reload. It does zero spec
parsing itself - that's entirely the already-built `dist/kong-spec-renderer.web-component.*`
bundle's job.

## Layout

- `index.ts` - commander setup, all flag definitions, `--version`/`--help` wiring.
- `commands/preview.ts` - orchestration: load spec → start server → watch file → open browser.
- `server.ts` - the http+ws server (static assets, `/spec`, `/config`, reload broadcast).
- `resolve-render-options.ts` - pure mapping: parsed CLI flags → `SpecRendererProps` subset.
- `resolve-spec-source.ts` / `spec-source.ts` - pure file-vs-URL classification / actual I/O.
- `find-open-port.ts`, `parse-int-flag.ts`, `ui.ts` - small pure/near-pure helpers.
- `preview-page/` - the static HTML page + `client.ts` served to the browser.

Pure logic is deliberately split from I/O (mirrors `src/composables` vs `src/utils`) so it's
unit-testable without a real server/filesystem/browser. `server.ts`/`commands/preview.ts` stay
thin orchestration and are covered mostly by `server.spec.ts`'s real-server integration tests,
not unit tests of the orchestration itself.

## Commands

```sh
pnpm run typecheck:cli          # tsc against tsconfig.cli.json (plain Node/TS, not vue-tsc)
pnpm exec vitest run --project cli   # cli/**/*.spec.ts only (Node env, not jsdom)
pnpm run build:cli               # compiles cli/ + copies preview-page/index.html into dist/cli/
node dist/cli/index.js preview <spec>   # run the built CLI locally
```

`pnpm run typecheck`/`pnpm run test`/`pnpm run build` at the repo root already include all of
the above. `build:cli` is intentionally **not** wired into `postinstall` - it only needs to
run for this repo's own publish build, not for consumers installing the package.

## Sharp edges (hard-won, don't relitigate)

- **Vue custom-element prop timing**: `defineCustomElement` only picks up a property as an
  *initial* prop value if it's already an own property on the element **before** the tag is
  registered/upgraded (`customElements.define`) - some props (like `currentPath`) are
  snapshotted once at setup and never re-synced if set afterward. `preview-page/client.ts`
  fetches `/spec`+`/config`, sets every property, and only *then* dynamically imports and
  calls `registerKongSpecRenderer()` - don't reorder this.
- **`--path` takes the rendered doc's node URI** (`/operations/{operationId}`,
  `/schemas/{SchemaName}`), not the spec's raw OAS path - there's no CLI-side spec parsing to
  validate it, so an invalid path only surfaces via the component's own `path-not-found`
  event, handled in `client.ts` (logs a warning, resets the address bar and re-mounts the
  element with a fresh `currentPath` since the prop can't be corrected in place - see above).
- **`navigationType` defaults to `hash`**, not the component's own `path` default - the
  server has no SPA fallback route, so a `path`-style deep link 404s on browser refresh.
- **chokidar**: needs `ignoreInitial: true` (its startup scan otherwise fires a real `add`
  event) and `awaitWriteFinish` (avoids reading a mid-write, truncated file). Some editors
  (e.g. Vim's default `writebackup` save) rename the file away and recreate it, which can
  surface as a genuine `unlink`+`add` pair rather than a single `change` - `preview.ts` treats
  `add` as a reload trigger and holds the `unlink` "file deleted" warning briefly in case an
  `add` follows.
- **`ws`'s `WebSocketServer` re-emits the underlying `http.Server`'s `'error'` event on
  itself** - an `'error'` listener on `server` alone isn't enough to prevent an unhandled
  exception on e.g. `EADDRINUSE`; `wss` needs one too (see `server.ts`).
- **Terminal color is forced on** via `picocolors`' `createColors(true)` (still honors
  `NO_COLOR`) - the preview banner is meant to be readable when piped through another tool,
  not just in a raw TTY. Import `pc`/`hyperlink` from `ui.ts`, not `picocolors` directly.
