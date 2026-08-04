import { Command, Option } from 'commander'
import { describe, expect, it } from 'vitest'
import { buildManifest } from './build-kongctl-manifest.mjs'

interface CommandPathConfig {
  id: string
  path: Array<{ name: string }>
  summary: string
  description?: string
  usage?: string
  examples?: string[]
  commanderCommand?: string
}

interface ManifestConfig {
  schema_version: number
  publisher: string
  name: string
  runtime: { command: string }
  command_paths: CommandPathConfig[]
}

function fakeProgram(): Command {
  const program = new Command()
  program
    .command('preview')
    .argument('<spec>', 'spec description')
    .option('--port <port>', 'port description')
    .option('--no-open', 'no-open description')
    .addOption(new Option('--secret-thing', 'should never appear').hideHelp())
    .addOption(new Option('--nav <type>', 'nav description').choices(['a', 'b']))
  return program
}

function baseConfig(): ManifestConfig {
  return {
    schema_version: 1,
    publisher: 'kong',
    name: 'spec-renderer',
    runtime: { command: 'bin/kongctl-ext' },
    command_paths: [
      {
        id: 'preview_spec',
        path: [{ name: 'preview' }, { name: 'spec' }],
        summary: 'a summary',
        description: 'a description',
        usage: 'kongctl preview spec <spec> [flags]',
        examples: ['kongctl preview spec ./x.yaml'],
        commanderCommand: 'preview',
      },
    ],
  }
}

describe('buildManifest', () => {
  it('passes through every non-command_paths field unchanged', () => {
    const config = baseConfig()
    const manifest = buildManifest(config, fakeProgram())

    expect(manifest.schema_version).toBe(1)
    expect(manifest.publisher).toBe('kong')
    expect(manifest.name).toBe('spec-renderer')
    expect(manifest.runtime).toEqual({ command: 'bin/kongctl-ext' })
  })

  it('preserves every hand-authored field on a command_paths entry', () => {
    const config = baseConfig()
    const manifest = buildManifest(config, fakeProgram())
    const entry = manifest.command_paths[0]

    expect(entry.id).toBe('preview_spec')
    expect(entry.path).toEqual([{ name: 'preview' }, { name: 'spec' }])
    expect(entry.summary).toBe('a summary')
    expect(entry.description).toBe('a description')
    expect(entry.usage).toBe('kongctl preview spec <spec> [flags]')
    expect(entry.examples).toEqual(['kongctl preview spec ./x.yaml'])
  })

  it('does not leak the commanderCommand hint field into the output', () => {
    const config = baseConfig()
    const manifest = buildManifest(config, fakeProgram())

    expect(manifest.command_paths[0]).not.toHaveProperty('commanderCommand')
  })

  it('derives args from the matched commander command', () => {
    const config = baseConfig()
    const manifest = buildManifest(config, fakeProgram())

    expect(manifest.command_paths[0].args).toEqual([
      { name: 'spec', required: true, description: 'spec description' },
    ])
  })

  it('derives flags from the matched commander command, using the flag name without leading dashes', () => {
    const config = baseConfig()
    const manifest = buildManifest(config, fakeProgram())
    const flags = manifest.command_paths[0].flags

    expect(flags).toContainEqual({ name: 'port', type: 'string', description: 'port description' })
    expect(flags).toContainEqual({ name: 'no-open', description: 'no-open description' })
  })

  it('maps a choices() option to a pipe-joined type', () => {
    const config = baseConfig()
    const manifest = buildManifest(config, fakeProgram())
    const flags = manifest.command_paths[0].flags

    expect(flags).toContainEqual({ name: 'nav', type: 'a|b', description: 'nav description' })
  })

  it('excludes hidden options from flags', () => {
    const config = baseConfig()
    const manifest = buildManifest(config, fakeProgram())
    // baseConfig()'s entry always sets commanderCommand, so args/flags are
    // always present here - the `?` on ManifestCommandPath only accounts for
    // entries without that hint, which this test doesn't exercise.
    const flags = manifest.command_paths[0].flags!

    expect(flags.some((flag) => flag.name === 'secret-thing')).toBe(false)
  })

  it('always appends the extension-only local-cli flag, even though it is not a commander option', () => {
    const config = baseConfig()
    const manifest = buildManifest(config, fakeProgram())
    const flags = manifest.command_paths[0].flags!

    expect(flags.at(-1)).toMatchObject({ name: 'local-cli', type: 'string' })
  })

  it('leaves a command_paths entry without a commanderCommand hint untouched (no args/flags added)', () => {
    const config = baseConfig()
    config.command_paths.push({
      id: 'no_cli_here',
      path: [{ name: 'something-else' }],
      summary: 'no CLI backing this one',
    })
    const manifest = buildManifest(config, fakeProgram())

    expect(manifest.command_paths[1]).not.toHaveProperty('args')
    expect(manifest.command_paths[1]).not.toHaveProperty('flags')
  })

  it('throws a clear error when commanderCommand names a command the program does not have', () => {
    const config = baseConfig()
    config.command_paths[0].commanderCommand = 'does-not-exist'

    expect(() => buildManifest(config, fakeProgram())).toThrow(/does-not-exist/)
  })

  it('does not mutate the input config', () => {
    const config = baseConfig()
    const snapshot = JSON.parse(JSON.stringify(config))
    buildManifest(config, fakeProgram())

    expect(config).toEqual(snapshot)
  })
})
