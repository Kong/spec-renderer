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
