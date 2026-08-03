# Spec Renderer CLI

A small CLI for previewing a local OpenAPI or AsyncAPI spec, rendered with `@kong/spec-renderer`'s own UI, right on your machine - no host app or project setup required. The preview reloads automatically whenever you save changes to the spec file.

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

## Flags

| Flag | Description | Default |
| --- | --- | --- |
| `--port <port>` | Port to run the local preview server on. If the port is already in use, the CLI automatically tries the next few ports. | `4757` |
| `--no-open` | Don't automatically open the preview in a browser. | opens automatically |
| `--hide-internal` | Hide internal operations from the table of contents. | `false` |
| `--hide-deprecated` | Hide deprecated operations from the table of contents. | `false` |
| `--hide-schemas` | Hide schemas (models) from the table of contents. | `false` |
| `--hide-try-it` | Hide the "Try it" UI. | `false` |
| `--max-expanded-depth <depth>` | Maximum depth to expand nested schema properties by default. | `1` |
| `--verbose` (alias: `--trace-parsing`) | Log spec parsing stages to the browser console - useful when troubleshooting a spec that fails to render. | `false` |
| `--no-content-scrolling` | Navigate between operations/schemas one at a time instead of scrolling through them continuously. | scrolls continuously |

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
