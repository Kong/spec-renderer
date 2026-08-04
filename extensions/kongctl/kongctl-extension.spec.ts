import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'
import { createProgram } from '../../cli/program.ts'
import { buildManifest } from '../../scripts/build-kongctl-manifest.mjs'
import { config } from './kongctl-extension.config.mjs'

const currentDir = dirname(fileURLToPath(import.meta.url))
const manifestPath = join(currentDir, 'kongctl-extension.yaml')

describe('extensions/kongctl/kongctl-extension.yaml', () => {
  it('matches what regenerating it from cli/program.ts + kongctl-extension.config.mjs would produce', () => {
    const committed = parse(readFileSync(manifestPath, 'utf-8'))
    const expected = buildManifest(config, createProgram())

    // If this fails, the committed file is stale - run
    // `pnpm run generate:kongctl-manifest` and commit the result.
    expect(committed).toEqual(expected)
  })

  it('has the manifest fields required by the kongctl extension schema', () => {
    const committed = parse(readFileSync(manifestPath, 'utf-8'))

    expect(committed.schema_version).toBe(1)
    // Extension IDs must be lowercase, path-safe identifiers (kongctl's own
    // extension-builder guide) - this regressed once already (`publisher:
    // Kong`), so pin it explicitly rather than relying only on the
    // regenerate-and-compare check above to catch a hand-edit of the config.
    expect(committed.publisher).toBe('kong')
    expect(committed.name).toBe('spec-renderer')
    expect(committed.runtime.command).toBe('bin/kongctl-ext')
  })

  it('contributes the expected preview spec command path', () => {
    const committed = parse(readFileSync(manifestPath, 'utf-8'))
    const entry = committed.command_paths.find((cp: { id: string }) => cp.id === 'preview_spec')

    expect(entry).toBeDefined()
    expect(entry.path).toEqual([{ name: 'preview' }, { name: 'spec' }])
  })
})
