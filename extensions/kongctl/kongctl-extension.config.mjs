// Hand-authored source of truth for extensions/kongctl/kongctl-extension.yaml.
// That file is fully generated (see scripts/generate-kongctl-manifest.mjs) -
// edit this config instead, then run `pnpm run generate:kongctl-manifest`.
//
// `commanderCommand` on a command_paths entry names the commander subcommand
// (from cli/program.ts's createProgram()) whose `args`/`flags` should be
// merged in; omit it for a command path not backed by this CLI at all.

/** @type {import('../../scripts/build-kongctl-manifest.mjs').ManifestConfig} */
export const config = {
  schema_version: 1,
  publisher: 'kong',
  name: 'spec-renderer',
  runtime: {
    command: 'bin/kongctl-ext',
  },
  command_paths: [
    {
      id: 'preview_spec',
      path: [{ name: 'preview' }, { name: 'spec' }],
      summary: 'Preview an OpenAPI or AsyncAPI spec (local file or remote URL) using @kong/spec-renderer',
      description:
        'Starts a preview server for an OpenAPI or AsyncAPI spec (from a local file or remote URL), rendered '
        + "with @kong/spec-renderer's own UI, with auto-reload on save. Runs `npx "
        + '@kong/spec-renderer preview` under the hood - requires Node.js.',
      usage: 'kongctl preview spec <spec> [flags]',
      examples: [
        'kongctl preview spec ./openapi.yaml',
        'kongctl preview spec ./openapi.yaml --port 4000 --hide-internal',
        'kongctl preview spec -- --help',
      ],
      commanderCommand: 'preview',
    },
  ],
}
