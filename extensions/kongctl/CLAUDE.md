# CLAUDE.md (extensions/kongctl/)

Guidance for maintaining the `kongctl` extension specifically. See the root `CLAUDE.md` for
the rest of the repo, `cli/CLAUDE.md` for the CLI this wraps, and `README.md` here for
user-facing usage docs.

## What this is

A [kongctl](https://github.com/Kong/kongctl) extension contributing `kongctl preview spec
<spec>`, which shells out to `kong-spec-renderer preview` (via `npx`, or a local build with
`--local-cli`). Distributed as a release archive (built by
`../../scripts/build-kongctl-extension.sh`) containing only `kongctl-extension.yaml`,
`README.md`, and `bin/kongctl-ext` - nothing else here ships.

## Layout

- `kongctl-extension.yaml` - **generated, never hand-edit.** Rebuilt from scratch, automatically,
  by `pnpm run build:cli` (and therefore `pnpm run build`) from two inputs:
  `kongctl-extension.config.mjs` (hand-authored: `summary`/`description`/`examples`/`publisher`/
  `name`/`runtime`) and `cli/program.ts`'s live commander definition (`args`/`flags`, via
  `../../scripts/build-kongctl-manifest.mjs`). To change anything, edit one of those two inputs
  and rebuild - never patch the `.yaml` output directly.
  The committed manifest has **no `version` field** - `../../scripts/build-kongctl-extension.sh`
  stamps `version: <release-version>` into a *copy* at release-build time (via `awk`, right
  after `name:`), so only the published release archive's manifest has one.
- `kongctl-extension.config.mjs` - the actual source of truth for hand-authored manifest fields.
- `bin/kongctl-ext` - the shipped POSIX shell entrypoint (macOS/Linux only - see `TODO.md`).
- `kongctl-extension.spec.ts` - two things: a parsed-data equality check (fast local feedback -
  it imports `cli/program.ts` source directly, so it catches drift even without building), and
  a raw-text snapshot test. The snapshot is what actually catches "forgot to commit" in CI: its
  `.snap` file only changes via a deliberate `vitest -u`, so it stays a stable baseline even
  though `build` auto-regenerates `kongctl-extension.yaml` itself before this test runs.
- `bin/kongctl-ext.spec.ts` - runs the real shell script as a subprocess with fake `node`/`npx`
  on a scoped `PATH`, asserting on actual argv rather than re-implementing the script's logic.
- `TODO.md` - known upstream kongctl limitations (Windows support, `--help` interception).

## Commands

```sh
pnpm run build:cli   # regenerates kongctl-extension.yaml as its last step (generate:kongctl-manifest is an alias)
pnpm run typecheck:scripts   # tsc against tsconfig.scripts.json - covers this dir + scripts/*.mjs
pnpm exec vitest run extensions/kongctl   # this directory's tests only

# Local dev against a real kongctl checkout:
kongctl link extension ./extensions/kongctl
kongctl preview spec ./some-spec.yaml --local-cli "$(pwd)/dist/cli/index.js"
```

## Sharp edges (hard-won, don't relitigate)

- **kongctl always intercepts `--help`/`-h` itself**, before the extension process ever runs,
  rendering purely from the manifest's `args`/`flags`/`examples` fields - this is *why*
  `kongctl-extension.yaml`'s `args`/`flags` must be generated and accurate, not a nicety. To
  reach `kong-spec-renderer`'s own live `--help`, use `kongctl preview spec -- --help`.
- **`--local-cli <path>` is a flag, not an env var, on purpose** - scoped to one invocation so
  there's no ambient state to forget to unset. Parsing it needs a rotate-and-shift loop in
  `bin/kongctl-ext` (POSIX `sh` has no arrays) - don't replace that with string concatenation
  or `eval`, both break on paths containing spaces.
- **`kongctl-extension.yaml` used to be hand-patched via YAML AST surgery** (parse the existing
  file, mutate specific nodes, re-serialize) - this broke three separate ways (lazy node
  conversion silently dropping comments, raw-string keys not persisting `.commentBefore`,
  structural reordering on a deleted/recreated key) before being replaced with the current
  from-scratch generation. Don't go back to patching the committed file in place.
- **Test coverage intentionally spans both TS source and the raw shell script** -
  `kongctl-extension.spec.ts` imports `cli/program.ts` (TS source), while the real
  `../../scripts/generate-kongctl-manifest.mjs` imports the compiled `dist/cli/program.js` -
  these are genuinely different code paths (a bug once existed that only manifested
  post-compilation, invisible to a source-only test). `bin/kongctl-ext.spec.ts` exists because
  it's the only file with real logic in the shipped archive; a change to it isn't done until
  that spec passes, not just the TS-side tests.
