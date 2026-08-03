#!/usr/bin/env node
import { Command } from 'commander'
import { runPreviewCommand, type PreviewCommandFlags } from './commands/preview.js'
import { error as printError } from './ui.js'

/**
 * The shape commander actually produces: flag names it auto-derives from the
 * registered `--flag`/`--no-flag` strings, which don't always match the
 * `SpecRendererProps` names `PreviewCommandFlags` uses (see the mapping to
 * `PreviewCommandFlags` below).
 */
interface RawPreviewFlags {
  port?: number
  open?: boolean
  hideInternal?: boolean
  hideDeprecated?: boolean
  hideSchemas?: boolean
  hideTryIt?: boolean
  maxExpandedDepth?: number
  verbose?: boolean
  traceParsing?: boolean
  /** Commander's auto-derived name for `--no-content-scrolling`. */
  contentScrolling?: boolean
}

const program = new Command()

program
  .name('kong-spec-renderer')
  .description('Preview a local OpenAPI/AsyncAPI spec using @kong/spec-renderer')

program
  .command('preview')
  .description('Render a spec file or URL in a local preview server, reloading when the file changes')
  .argument('<spec>', 'path to a local spec file, or a URL to a remote spec')
  .option('--port <port>', 'port to run the preview server on', (value) => Number.parseInt(value, 10))
  .option('--no-open', 'do not automatically open the preview in a browser')
  .option('--hide-internal', 'hide internal operations from the table of contents')
  .option('--hide-deprecated', 'hide deprecated operations from the table of contents')
  .option('--hide-schemas', 'hide schemas (models) from the table of contents')
  .option('--hide-try-it', 'hide the "Try it" UI')
  .option('--max-expanded-depth <depth>', 'maximum depth to expand nested schema properties by default', (value) => Number.parseInt(value, 10))
  .option('--verbose', 'log spec parsing stages to the browser console, for troubleshooting (alias for --trace-parsing)')
  .option('--trace-parsing', 'log spec parsing stages to the browser console, for troubleshooting (alias for --verbose)')
  .option('--no-content-scrolling', 'navigate between operations/schemas one at a time instead of scrolling through them continuously')
  .action(async (spec: string, raw: RawPreviewFlags) => {
    const flags: PreviewCommandFlags = {
      ...raw,
      allowContentScrolling: raw.contentScrolling,
    }

    try {
      await runPreviewCommand(spec, flags)
    } catch (error) {
      printError(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    }
  })

await program.parseAsync(process.argv)
