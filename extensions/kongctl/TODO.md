# TODO

- [ ] Windows support is currently blocked upstream: kongctl execs `runtime.command`
      directly via `exec.CommandContext` (see `internal/extensions/runtime.go:188` in
      the kongctl repo, no shell/shebang interpretation), so a POSIX `#!/usr/bin/env sh`
      script extension cannot run on Windows, and the executable-bit check in
      `internal/extensions/manifest.go` (~lines 308-355) doesn't map cleanly onto NTFS
      permissions either. `docs/extensions.md`'s script-extension example and Windows
      archive guidance only ever pair Windows support with compiled Go binaries.
      Consider filing an issue against github.com/kong/kongctl asking for either
      shell-script interpretation on Windows (e.g. detecting a shebang and dispatching
      through a configured interpreter) or clearer documentation that script extensions
      are POSIX-only. Revisit once kongctl addresses this, or if we decide to ship a
      bundled standalone binary instead of the npx wrapper (see spec-renderer's kongctl
      extension plan, "Not in scope" section).

- [ ] `--help`/`-h` are always intercepted by kongctl itself for extension commands
      (see `internal/extensions/cobra.go`'s `SplitExtensionArgs`, which matches
      `--help`/`-h` unconditionally, before the host-flag-collision check even runs),
      and rendered purely from the manifest's `description`/`usage`/`examples`/
      `args`/`flags` fields — the extension process is never invoked to answer
      `--help`. This is likely intentional (uniform host UX across built-in and
      extension commands, and it avoids running arbitrary/untrusted extension code
      just to answer `--help`), not a bug. `docs/extensions.md` does mention `--`
      as the escape hatch for `--help`/`--output`/`--profile` collisions, but only
      in passing — it doesn't call out that extension `--help` is *entirely* static
      from the manifest with no fallback to the underlying tool's own help, or show
      a worked example of `kongctl <cmd> -- --help` reaching the live tool. We only
      found this by testing, not by reading a clear warning. Consider filing a
      documentation-clarity suggestion against github.com/kong/kongctl (not a bug
      report) asking for this to be spelled out more explicitly, ideally with an
      example in the extension developer guide. This is why our own manifest fully
      declares `args`/`flags` mirroring `kong-spec-renderer preview`'s real flags -
      `kongctl-extension.yaml` is entirely generated from `cli/program.ts` +
      `kongctl-extension.config.mjs`, automatically as part of `pnpm run build`, and
      verified by `extensions/kongctl/kongctl-extension.spec.ts`'s raw-text snapshot
      test in CI, so they can't drift silently the way they did once already (see
      manifest maintenance notes in `README.md`).
