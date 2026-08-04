// Pure transform: (hand-authored config, live commander program) -> the full
// kongctl-extension.yaml manifest object. No file I/O, no YAML, no mutation
// of its inputs - kept deliberately dumb and side-effect-free so it's cheap
// to unit test (see build-kongctl-manifest.spec.ts) without needing a real
// CLI build, a real file on disk, or a real kongctl checkout.
//
// Each command_paths entry in the config may carry a `commanderCommand` hint
// naming the commander subcommand whose args/flags should be merged in; entries
// without that hint are passed through unchanged (e.g. a future command path
// not backed by this CLI at all).

/**
 * @typedef {object} Argument
 * @property {string} name
 * @property {boolean} required
 * @property {string} description
 */

/**
 * @typedef {object} Flag
 * @property {string} name
 * @property {string} [type]
 * @property {string} description
 */

/**
 * @typedef {object} CommandPathConfig
 * @property {string} id
 * @property {Array<{name: string}>} path
 * @property {string} summary
 * @property {string} [description]
 * @property {string} [usage]
 * @property {string[]} [examples]
 * @property {string} [commanderCommand] name of the commander subcommand whose
 *   args/flags should be merged into this entry's `args`/`flags` fields; omit
 *   for a command path not backed by a commander command at all.
 */

/**
 * @typedef {object} ManifestConfig
 * @property {number} schema_version
 * @property {string} publisher
 * @property {string} name
 * @property {{command: string}} runtime
 * @property {CommandPathConfig[]} command_paths
 */

/**
 * @typedef {Omit<CommandPathConfig, 'commanderCommand'> & {args?: Argument[], flags?: Flag[]}} ManifestCommandPath
 */

/**
 * @typedef {Omit<ManifestConfig, 'command_paths'> & {command_paths: ManifestCommandPath[]}} Manifest
 */

/**
 * Extension-only flag, not part of the CLI's own commander definition - always
 * appended after whatever commander itself defines, so it survives regardless
 * of what the CLI's own flags happen to be.
 * @type {Flag}
 */
const LOCAL_CLI_FLAG = {
  name: 'local-cli',
  type: 'string',
  description:
    'Extension-only flag. Path to a local kong-spec-renderer CLI build '
    + '(dist/cli/index.js) to use instead of npx, for local development.',
}

/**
 * @param {import('commander').Command} command
 * @returns {Argument[]}
 */
function extractArgs(command) {
  return command.registeredArguments.map((arg) => ({
    name: arg.name(),
    required: arg.required,
    description: arg.description,
  }))
}

/**
 * @param {import('commander').Command} command
 * @returns {Flag[]}
 */
function extractFlags(command) {
  const flags = command.options
    .filter((option) => !option.hidden)
    .map((option) => {
      if (!option.long) {
        // Every option this CLI defines has a `--long` form; a short-only
        // option (e.g. just `-x`) isn't a shape the manifest format supports.
        throw new Error(`Option '${option.flags}' on '${command.name()}' has no --long flag form`)
      }
      const hasValue = option.required || option.optional
      const type = option.argChoices ? option.argChoices.join('|') : hasValue ? 'string' : undefined
      return {
        name: option.long.replace(/^--/, ''),
        ...(type ? { type } : {}),
        description: option.description,
      }
    })
  flags.push(LOCAL_CLI_FLAG)
  return flags
}

/**
 * @param {ManifestConfig} config hand-authored manifest data.
 * @param {import('commander').Command} program a live commander program (e.g.
 *   from `createProgram()`), used only to look up subcommands by name.
 * @returns {Manifest} the full manifest object, ready to pass to `YAML.stringify()`.
 */
export function buildManifest(config, program) {
  return {
    ...config,
    command_paths: config.command_paths.map((entry) => {
      const { commanderCommand, ...rest } = entry
      if (!commanderCommand) {
        return rest
      }

      const command = program.commands.find((c) => c.name() === commanderCommand)
      if (!command) {
        throw new Error(
          `command_paths entry '${entry.id}' names commanderCommand '${commanderCommand}', `
          + `but the CLI program has no such subcommand (available: ${program.commands.map((c) => c.name()).join(', ')})`,
        )
      }

      return {
        ...rest,
        args: extractArgs(command),
        flags: extractFlags(command),
      }
    }),
  }
}
