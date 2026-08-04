# kong/spec-renderer kongctl extension

A [`kongctl`](https://github.com/Kong/kongctl) extension that wraps the [`kong-spec-renderer`](../../cli/README.md) CLI, letting you preview a local OpenAPI or AsyncAPI spec without leaving `kongctl`.

```sh
kongctl preview spec ./openapi.yaml
kongctl preview spec ./openapi.yaml --port 4000 --no-open
```

Every flag supported by `kong-spec-renderer preview` passes straight through. See the [CLI README](../../cli/README.md) for the full list (`--port`, `--path`, `--hide-*`, `--with-credentials`, `--max-expanded-depth`, etc.), or run `kongctl preview spec --help` for a summary.

`kongctl preview spec --help` always intercepts `--help`/`-h` itself and shows kongctl's own manifest-based summary, never the underlying CLI. For the exact, always-current flag reference straight from `kong-spec-renderer`, use the `--` escape hatch: `kongctl preview spec -- --help`.

## Manifest maintenance

**`kongctl-extension.yaml` is entirely generated - never hand-edit it.** It's rebuilt from scratch every time from two inputs: `kongctl-extension.config.mjs` (hand-authored: `summary`, `description`, `examples`, `publisher`, `name`, `runtime`) and `cli/program.ts`'s own commander definition (`args`/`flags`, introspected live via its real `Option`/`Argument` objects - not hand-copied, which previously let them drift: a `--navigation-type` flag was added to the CLI without ever making it into the manifest). To change anything in the manifest, edit `kongctl-extension.config.mjs` (for hand-authored fields) or `cli/program.ts` (for flags/args), then run:

```sh
pnpm run generate:kongctl-manifest
```

`extensions/kongctl/kongctl-extension.spec.ts` verifies the committed file matches what regenerating it would produce right now, and runs as part of the normal `pnpm run test` - so CI catches drift with a plain, readable test diff, without ever needing to write anything back to the repo. The actual merge logic (`scripts/build-kongctl-manifest.mjs`) is a pure function with its own unit tests (`scripts/build-kongctl-manifest.spec.ts`), so it doesn't depend on parsing/mutating a possibly-hand-edited YAML file at all.

## Requirements

- Node.js (the extension shells out to `npx @kong/spec-renderer preview`)
- macOS or Linux — **Windows is not supported** (`kongctl` execs `runtime.command` directly, with no shell/shebang interpretation, so this POSIX shell script cannot run on Windows; see `TODO.md`)

## Local development

By default the extension always runs `npx @kong/spec-renderer preview`, the same as any real install — it never auto-detects or guesses at a local build. To exercise local changes instead, opt in explicitly per-invocation with `--local-cli <path>`:

```sh
pnpm run build:cli
```

Then, from this repo's root:

```sh
kongctl link extension ./extensions/kongctl
kongctl get extension kong/spec-renderer
kongctl preview spec ./sandbox/path/to/some-spec.yaml --local-cli "$(pwd)/dist/cli/index.js"
kongctl list extensions
```

Without `--local-cli`, `kongctl preview spec` runs the published `@kong/spec-renderer` package instead — useful for confirming what a real install will actually do. `--local-cli` is scoped to the single command it's passed on, so there's no ambient state to forget to unset later. Linked extensions run from the working tree and aren't upgraded automatically. Re-link after changing `kongctl-extension.config.mjs`'s command paths; re-run `pnpm run build:cli` after changes to `cli/`.

## Installation

Once a tagged release of `@kong/spec-renderer` has been published:

```sh
kongctl install extension kong/spec-renderer@<tag>
kongctl upgrade extension kong/spec-renderer
```

The extension's release archive is built and attached automatically to each GitHub release, pinned to the `@kong/spec-renderer` npm version published in that same release.
