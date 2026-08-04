import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

// Exercises the actual shipped POSIX shell script as a subprocess - this is
// the only file with real logic in the release archive that's actually
// distributed (scripts/build-kongctl-extension.sh's tar list is just
// kongctl-extension.yaml, README.md, bin/kongctl-ext) - so it's the one
// thing that must be tested by running it, not by re-implementing its logic
// in TypeScript. Fake `node`/`npx` executables on a scoped PATH let us
// observe exactly what argv the script would hand off, without needing a
// real Node build or hitting the real npm registry.

const scriptPath = join(dirname(fileURLToPath(import.meta.url)), 'kongctl-ext')

/** A fake executable that prints its own argv, one per line, to stdout. */
const ARGV_PRINTER = '#!/bin/sh\nprintf \'%s\\n\' "$@"\n'

let fixtureDir: string

beforeEach(() => {
  fixtureDir = mkdtempSync(join(tmpdir(), 'kongctl-ext-test-'))
})

afterEach(() => {
  rmSync(fixtureDir, { recursive: true, force: true })
})

function writeFakeExecutable(name: string, content: string) {
  const path = join(fixtureDir, name)
  writeFileSync(path, content)
  chmodSync(path, 0o755)
}

/**
 * Runs the real script with a PATH that puts fixtureDir first (so a fake
 * `node`/`npx` written there shadows anything real) followed by `/bin:/usr/bin`
 * - needed so `sh` itself (and any builtins it shells out to) can still be
 * found, since this becomes the ENTIRE environment for the child process.
 * `/bin:/usr/bin` deliberately excludes wherever this machine's real `node`
 * actually lives (nvm/volta/homebrew are never there), so a test that omits
 * a fake `node` from fixtureDir gets a genuinely node-less environment.
 */
function runScript(args: string[]) {
  return execFileSync('sh', [scriptPath, ...args], {
    env: { PATH: `${fixtureDir}:/bin:/usr/bin` },
    encoding: 'utf-8',
  })
}

describe('bin/kongctl-ext', () => {
  it('errors clearly, without running anything, when node is not on PATH', () => {
    // No node/npx written into fixtureDir at all.
    expect(() => runScript(['./openapi.yaml'])).toThrow(
      expect.objectContaining({
        status: 1,
        stderr: expect.stringContaining('requires Node.js'),
      }),
    )
  })

  it('--local-cli <path>: execs node on the given path with "preview" prepended, forwarding remaining args in order', () => {
    writeFakeExecutable('node', ARGV_PRINTER)
    const fakeCli = join(fixtureDir, 'fake-cli.js')
    writeFileSync(fakeCli, '')

    const output = runScript(['./openapi.yaml', '--local-cli', fakeCli, '--port', '4000'])

    expect(output.trim().split('\n')).toEqual([fakeCli, 'preview', './openapi.yaml', '--port', '4000'])
  })

  it('--local-cli=<path> form behaves the same as the space-separated form', () => {
    writeFakeExecutable('node', ARGV_PRINTER)
    const fakeCli = join(fixtureDir, 'fake-cli.js')
    writeFileSync(fakeCli, '')

    const output = runScript(['./openapi.yaml', `--local-cli=${fakeCli}`])

    expect(output.trim().split('\n')).toEqual([fakeCli, 'preview', './openapi.yaml'])
  })

  it('preserves the relative order of untouched args when --local-cli is in the middle', () => {
    writeFakeExecutable('node', ARGV_PRINTER)
    const fakeCli = join(fixtureDir, 'fake-cli.js')
    writeFileSync(fakeCli, '')

    const output = runScript(['a', '--local-cli', fakeCli, 'b', 'c'])

    expect(output.trim().split('\n')).toEqual([fakeCli, 'preview', 'a', 'b', 'c'])
  })

  it('forwards a spec path containing a space untouched', () => {
    writeFakeExecutable('node', ARGV_PRINTER)
    const fakeCli = join(fixtureDir, 'fake-cli.js')
    writeFileSync(fakeCli, '')

    const output = runScript(['./my spec.yaml', '--local-cli', fakeCli])

    expect(output.trim().split('\n')).toEqual([fakeCli, 'preview', './my spec.yaml'])
  })

  it('errors clearly when --local-cli is given with no path argument', () => {
    writeFakeExecutable('node', ARGV_PRINTER)

    expect(() => runScript(['./openapi.yaml', '--local-cli'])).toThrow(
      expect.objectContaining({
        status: 1,
        stderr: expect.stringContaining('--local-cli requires a path argument'),
      }),
    )
  })

  it('errors clearly, without falling through to npx, when --local-cli points at a file that does not exist', () => {
    writeFakeExecutable('node', ARGV_PRINTER)
    writeFakeExecutable('npx', ARGV_PRINTER)

    expect(() => runScript(['./openapi.yaml', '--local-cli', '/does/not/exist.js'])).toThrow(
      expect.objectContaining({
        status: 1,
        stderr: expect.stringContaining("no file exists there"),
      }),
    )
  })

  it('without --local-cli, falls through to npx with the version placeholder resolved to "latest" on an un-substituted checkout', () => {
    writeFakeExecutable('node', ARGV_PRINTER)
    writeFakeExecutable('npx', ARGV_PRINTER)

    const output = runScript(['./openapi.yaml', '--port', '4000'])

    expect(output.trim().split('\n')).toEqual([
      '--yes',
      '@kong/spec-renderer@latest',
      'preview',
      './openapi.yaml',
      '--port',
      '4000',
    ])
  })
})
