#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Command, Option } from 'commander'
import { runPreviewCommand, type PreviewCommandFlags } from './commands/preview.js'
import { error as printError } from './ui.js'
import { parseIntFlag } from './parse-int-flag.js'

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
  hideInsomniaTryIt?: boolean
  maxExpandedDepth?: number
  verbose?: boolean
  traceParsing?: boolean
  withCredentials?: boolean
  /** Commander's auto-derived name for `--no-content-scrolling`. */
  contentScrolling?: boolean
  /** Commander's auto-derived name for `--no-custom-server-url`. */
  customServerUrl?: boolean
  showNavigationButtons?: boolean
  hideDownloadButton?: boolean
  enableOperationLinks?: boolean
  hidePoweredBy?: boolean
  path?: string
  navigationType?: 'path' | 'hash'
}

// The CLI isn't versioned independently - it always reports the package's
// own version, which is what actually gets published/installed.
const currentDir = dirname(fileURLToPath(import.meta.url))
const packageJsonPath = join(currentDir, '..', '..', 'package.json')
const { version } = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { version: string }

const program = new Command()

// Flags are registered in the order that groups them logically for readers
// of this file, not alphabetically - sort them for `--help` output instead so
// they're easy to scan regardless of definition order. `showGlobalOptions`
// surfaces `-V/--version` (registered on the top-level program, not the
// `preview` subcommand) in `preview --help` too - otherwise it's easy to
// assume it doesn't exist, since usage is always through the subcommand.
program.configureHelp({ sortOptions: true, showGlobalOptions: true })

const DOCS_URL = 'https://github.com/Kong/spec-renderer/blob/main/cli/README.md'

program
  .name('kong-spec-renderer')
  .description('Preview a local OpenAPI/AsyncAPI spec using @kong/spec-renderer')
  .version(version, '-V, --version', 'output the current version')
  .addHelpText('after', `\nDocs: ${DOCS_URL}`)

program
  .command('preview')
  .description('Preview a local spec file or remote spec URL using the spec renderer.')
  .argument('<spec>', 'path to a local spec file, or a URL to a remote spec')
  .option('--port <port>', 'port to run the preview server on', parseIntFlag('--port', { max: 65535 }))
  .option('--no-open', 'do not automatically open the preview in a browser')
  .option('--hide-internal', 'hide internal operations from the table of contents')
  .option('--hide-deprecated', 'hide deprecated operations from the table of contents')
  .option('--hide-schemas', 'hide schemas (models) from the table of contents')
  .option('--hide-try-it', 'hide the "Try it" UI')
  .option('--hide-insomnia-try-it', 'hide the "Insomnia" option within the "Try it" UI')
  .option('--with-credentials', 'send credentials when resolving external (http) $refs within the spec')
  .option('--max-expanded-depth <depth>', 'maximum depth to expand nested schema properties by default', parseIntFlag('--max-expanded-depth'))
  .option('--verbose', 'log spec parsing stages to the browser console, for troubleshooting (alias: --trace-parsing)')
  .addOption(new Option('--trace-parsing', 'alias for --verbose').hideHelp())
  .option('--no-content-scrolling', 'navigate between operations/schemas one at a time instead of scrolling through them continuously (has no effect above 1200 combined operations/schemas, where this is always enforced)')
  .option('--no-custom-server-url', 'do not let the preview add a custom server URL to the servers list')
  .option('--show-navigation-buttons', 'show prev/next buttons at the bottom of each operation - useful with --no-content-scrolling')
  .option('--hide-download-button', 'hide the spec download button')
  .option('--enable-operation-links', 'show a permalink icon on each operation that copies its URL to the clipboard')
  .option('--hide-powered-by', 'hide the "Powered by" branding in the table of contents')
  .option('--path <path>', 'open the preview at a specific operation/schema, e.g. /operations/getPets or /schemas/Pet (not the raw OAS path)')
  .addOption(
    new Option('--navigation-type <type>', 'how the current operation/schema is tracked in the URL - "path" breaks a browser refresh at a deep link, since the server has no route fallback for it')
      .choices(['path', 'hash'])
      .default('hash'),
  )
  .addHelpText('after', `\nDocs: ${DOCS_URL}`)
  .action(async (spec: string, raw: RawPreviewFlags) => {
    const flags: PreviewCommandFlags = {
      ...raw,
      allowContentScrolling: raw.contentScrolling,
      currentPath: raw.path,
    }

    try {
      await runPreviewCommand(spec, flags)
    } catch (error) {
      printError(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    }
  })

await program.parseAsync(process.argv)
