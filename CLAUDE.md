# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kong Spec Renderer is an open-source Vue 3 component library that renders OpenAPI 3 and AsyncAPI specifications into interactive API documentation. It supports both Vue components and native web components.

## Common Commands

```bash
pnpm install              # Install dependencies
pnpm run dev              # Start development sandbox with hot reload
pnpm run build            # Build package (typecheck + lib + web-component + types)
pnpm run test             # Run unit/component tests with Vitest
pnpm run test:open        # Run tests with Vitest UI
pnpm run lint             # ESLint check
pnpm run lint:fix         # ESLint auto-fix
pnpm run stylelint        # Check CSS/SCSS styles
pnpm run stylelint:fix    # Auto-fix style issues
pnpm run typecheck        # Vue + TypeScript type checking
pnpm run commit           # Interactive Commitizen prompt (required for commits)
```

## Architecture

### Source Structure (`src/`)

- **components/** - Vue 3 components
  - `SpecRenderer.vue` - Main all-in-one component
  - `spec-document/` - Document rendering (endpoints, overview, samples, schema-model, try-it)
  - `spec-renderer-toc/` - Table of Contents component
  - `common/` - Shared UI components
- **composables/** - Vue 3 composables for stateful logic (parsing, auth, content types)
- **utils/** - Pure utility functions (schema parsing, request data, transformers)
- **types/** - TypeScript type definitions
- **stoplight/** - Fork of Stoplight Elements for spec parsing and AST generation
- **styles/** - SCSS styles with Kong Design Token mixins

### Key Patterns

- **ServiceNode tree** - Specs are parsed into a ServiceNode tree structure for rendering
- **Dual build output** - Same components available as Vue components or web components
- **Kong Design Tokens** - All styles use `--kui-*` CSS custom properties from `@kong/design-tokens`
- **Composition API** - Heavy use of Vue 3 composables for logic reuse

### Main Exports (`src/index.ts`)

- Vue plugin (default export)
- `parseSpecDocument()` function
- `parsedDocument` and `tableOfContents` refs
- `findMatchingNode`, `slugifyPath` utilities
- Type exports: `ServiceNode`, `NavigationTypes`, `ParseOptions`, `SchemaObject`, `SpecRendererProps`

## Testing

Tests use Vitest with Vue Test Utils. Test files are colocated with source files using `*.spec.ts` pattern.

```bash
pnpm run test                    # Run all tests
pnpm run test -- path/to/file    # Run specific test file
pnpm run test:open               # Interactive Vitest UI
```

## Commit Convention

This repo uses Conventional Commits with Commitizen. Always use:
```bash
pnpm run commit
```

Git hooks (Lefthook) enforce:
- `commit-msg`: Validates commit message format
- `pre-push`: Runs stylelint, eslint, and typecheck

## Development Sandbox

The `/sandbox` directory contains a Vue app for testing components during development. Run `pnpm run dev` to start it.
