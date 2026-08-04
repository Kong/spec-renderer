#!/usr/bin/env node
// Regenerates extensions/kongctl/kongctl-extension.yaml from scratch: the
// hand-authored extensions/kongctl/kongctl-extension.config.mjs, merged with
// args/flags derived live from the CLI's own commander definition
// (cli/program.ts, via the built dist/cli/program.js). The output file is
// fully generated - never hand-edit it; edit the config instead and re-run
// `pnpm run generate:kongctl-manifest`.
//
// All the actual merging logic lives in the pure, unit-tested
// buildManifest() (see build-kongctl-manifest.spec.ts) - this file is
// intentionally just I/O glue around it.
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stringify } from 'yaml'
import { createProgram } from '../dist/cli/program.js'
import { buildManifest } from './build-kongctl-manifest.mjs'
import { config } from '../extensions/kongctl/kongctl-extension.config.mjs'

const currentDir = dirname(fileURLToPath(import.meta.url))
const manifestPath = join(currentDir, '..', 'extensions', 'kongctl', 'kongctl-extension.yaml')

const manifest = buildManifest(config, createProgram())

const header = '# GENERATED FILE - DO NOT EDIT BY HAND.\n'
  + '# Source: extensions/kongctl/kongctl-extension.config.mjs + cli/program.ts\n'
  + '# Regenerate: pnpm run generate:kongctl-manifest\n\n'

writeFileSync(manifestPath, header + stringify(manifest, { lineWidth: 100 }))

const flagCount = manifest.command_paths.reduce((total, entry) => total + (entry.flags?.length ?? 0), 0)
console.log(`Wrote ${manifestPath} (${manifest.command_paths.length} command path(s), ${flagCount} flag(s))`)
