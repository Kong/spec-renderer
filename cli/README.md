# Spec Renderer CLI

A small CLI for previewing an OpenAPI or AsyncAPI spec (from a local file or remote URL), rendered with `@kong/spec-renderer`'s own UI, right on your machine - no host app or project setup required. The preview reloads automatically whenever you save changes to the spec file.

## Table of Contents

- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Local file](#local-file)
  - [Remote URL](#remote-url)
- [Flags](#flags)
- [Live Reload](#live-reload)
- [Troubleshooting](#troubleshooting)

## Quick Start

No installation needed - run it directly with `npx` or `pnpm dlx`:

```sh
npx @kong/spec-renderer preview ./openapi.yaml
```

```sh
pnpm dlx @kong/spec-renderer preview ./openapi.yaml
```

This starts a local server, opens your default browser to the preview, and watches the file for changes.

If you'd rather install it (e.g. as a dev dependency in a project you already work in), the same `kong-spec-renderer` command becomes available:

```sh
pnpm add -D @kong/spec-renderer
pnpm exec kong-spec-renderer preview ./openapi.yaml
```

## Usage

```sh
kong-spec-renderer preview <spec> [options]
```

`<spec>` is required, and can be either a local file path or a URL.

### Local file

```sh
npx @kong/spec-renderer preview ./specs/openapi.yaml
```

The file is watched for changes - saving it reloads the preview automatically.

### Remote URL

```sh
npx @kong/spec-renderer preview https://example.com/openapi.yaml
```

The spec is fetched once when the server starts. There's no local file to watch, so live-reload isn't available for a remote URL - the CLI logs this so it isn't a surprise.

### Version

```sh
kong-spec-renderer --version
```

The CLI isn't versioned independently - `--version`/`-V` always reports the installed `@kong/spec-renderer` package version.

## Flags

| Flag | Description | Default |
| --- | --- | --- |
| `--port <port>` | Port to run the local preview server on. If the port is already in use, the CLI automatically tries the next few ports. | `4757` |
| `--no-open` | Don't automatically open the preview in a browser. | opens automatically |
| `--hide-internal` | Hide internal operations from the table of contents. | `false` |
| `--hide-deprecated` | Hide deprecated operations from the table of contents. | `false` |
| `--hide-schemas` | Hide schemas (models) from the table of contents. | `false` |
| `--hide-try-it` | Hide the "Try it" UI. | `false` |
| `--hide-insomnia-try-it` | Hide the "Insomnia" option within the "Try it" UI. | `false` |
| `--max-expanded-depth <depth>` | Maximum depth to expand nested schema properties by default. | `1` |
| `--verbose` (alias: `--trace-parsing`) | Log spec parsing stages to the browser console - useful when troubleshooting a spec that fails to render. | `false` |
| `--no-content-scrolling` | Navigate between operations/schemas one at a time instead of scrolling through them continuously. | scrolls continuously |
| `--show-navigation-buttons` | Show prev/next buttons at the bottom of each operation - useful with `--no-content-scrolling`, since the TOC sidebar is otherwise the only in-page way to move between operations in that mode. | `false` (hidden) |
| `--hide-powered-by` | Hide the "Powered by" branding in the table of contents. | `false` (shown) |
| `--with-credentials` | Send credentials when the browser resolves external (http) `$ref`s within the spec during parsing. Only matters if your spec's `$ref`s point to authenticated endpoints. | `false` |
| `--no-custom-server-url` | Don't let the preview add a custom server URL to the servers list - useful if you want to lock the preview to only the servers defined in the spec. | can add one |
| `--hide-download-button` | Hide the spec download button. | `false` (shown) |
| `--enable-operation-links` | Show a permalink icon on each operation that copies its URL to the clipboard. | `false` |
| `--path <path>` | Open the preview at a specific operation or schema, instead of the doc's overview. | overview |
| `--navigation-type <path\|hash>` | How the current operation/schema is tracked in the URL. `path` puts it directly in the URL path (e.g. `/operations/getPets`); `hash` keeps it in the URL fragment (e.g. `#/operations/getPets`). | `hash` |

> [!Note]
> `--path` takes the rendered document's own node path, not the spec's raw OAS path - use `/operations/{operationId}` for an operation (e.g. `/operations/getPets`) or `/schemas/{SchemaName}` for a model (e.g. `/schemas/Pet`), matching the `operationId`/schema name in your spec. If the path doesn't match anything, the preview logs a warning to the browser console and falls back to the overview.

> [!Note]
> `navigationType` defaults to `hash` rather than the underlying component's own `path` default - the CLI's server doesn't fall back to the preview page for arbitrary unmatched routes, so with `path`, refreshing the browser at a deep link (from `--path`, or after clicking through the doc) 404s. `hash` keeps the current path entirely client-side, so a refresh always hits `/` and reloads correctly. Pass `--navigation-type path` if you specifically want path-style URLs and don't mind that limitation.

> [!Note]
> `--no-content-scrolling`/`--show-navigation-buttons` have no visible effect on a very large spec (1200+ operations/schemas combined) - continuous scrolling and the TOC-only navigation mode are automatically disabled above that size regardless of these flags, falling back to one-operation-at-a-time navigation with prev/next buttons shown, since rendering that many operations in one continuously-scrolling page isn't practical.

> [!Note]
> The underlying component only fully hides the "Try it" panel when **both** `--hide-try-it` and `--hide-insomnia-try-it` are set - pass both together if you want it gone entirely.

Examples:

```sh
# Run on a specific port, without opening a browser tab
npx @kong/spec-renderer preview ./openapi.yaml --port 5000 --no-open

# Hide internal and deprecated operations, and the "Try it" panel
npx @kong/spec-renderer preview ./openapi.yaml --hide-internal --hide-deprecated --hide-try-it

# Troubleshoot a spec that isn't rendering as expected
npx @kong/spec-renderer preview ./openapi.yaml --verbose
```

> [!Note]
> A few `SpecRenderer` rendering options aren't exposed as flags because the CLI's preview page already fixes them to the values that make sense for a locally-served, single-page preview (for example, how the table of contents builds its links). See the [full `SpecRendererProps` interface](../src/types/spec-renderer.ts) if you're consuming the component directly and want more control.

## Live Reload

When previewing a local file, the CLI watches it on disk. Saving the file:

1. Re-reads the spec text.
2. Pushes a reload signal to the browser over a WebSocket connection.
3. The preview page reloads and re-fetches the latest spec content.

This is a full page reload rather than an in-place update, so scroll position/expanded state resets on each change - this keeps the preview simple and reliable rather than depending on the parser's internal reactivity.

## Troubleshooting

- **`ENOENT: no such file or directory`**: the given spec path doesn't exist or isn't readable. Double check the path is correct relative to your current directory.
- **Port already in use**: the CLI automatically tries the next few ports after the requested/default one. If it still fails, pass a different `--port` explicitly.
- **Live reload not happening for a URL**: this is expected - see [Remote URL](#remote-url) above. Reload isn't available when previewing a remote URL, since there's no local file to watch.
