# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

`@kong/spec-renderer` is Kong's open-source OpenAPI/AsyncAPI spec renderer: a Vue 3 component library, distributed both as regular Vue components and as framework-agnostic web components. It's published to npm and consumed by other Kong products (e.g. the Konnect developer portal).

## Commands

```sh
# Install dependencies
pnpm install

# Local dev sandbox (Vue app under /sandbox for manually exercising components)
pnpm run dev

# Build and preview the sandbox against a production build
pnpm run preview

# Type check (uses tsconfig.build.json, not tsconfig.json)
pnpm run typecheck

# Lint
pnpm run lint
pnpm run lint:fix
pnpm run stylelint
pnpm run stylelint:fix

# Run all tests
pnpm run test

# Run a single test file
pnpm exec vitest run src/utils/schema-model.spec.ts

# Filter to specific test names within a run
pnpm exec vitest run src/utils/schema-model.spec.ts -t "some test name"

# Production build (typecheck + package bundle + web-component bundle + type declarations + path alias rewriting)
pnpm run build
```

Lefthook runs `stylelint`, `lint`, and `typecheck` on `pre-push`, and `commitlint` on `commit-msg` - expect a push to fail if any of these aren't clean.

## Architecture

### Dual distribution: Vue plugin vs web components

The library has two build entry points, controlled by `VITE_AS_WEB_COMPONENT`:
- `src/index.ts` - the Vue plugin/component export (`SpecRenderer`, `SpecDocument`, `SpecRendererToc`, `SchemaRenderer`), installable via `app.use(...)` or imported directly as SFCs.
- `src/web-component.ts` - wraps the same components with `defineCustomElement` so they can be used from any framework (or none) as `<kong-spec-renderer>` etc.

Both entry points share the same component tree underneath - when changing a component, consider whether the change needs to work correctly when mounted as a native custom element (no access to a Vue app context/provide-inject chain from a host app) as well as a normal SFC.

### Parsing pipeline

`useSchemaParser` (`src/composables/useSchemaParser.ts`), re-exported via `src/utils/schema-parser.ts`, is the entry point for turning a raw spec string into what the rest of the app renders:

1. Parse the spec text (OpenAPI or AsyncAPI, detected/dispatched separately - `parseOpenApiSpecDocument` vs `parseAsyncApiSpecDocument`).
2. Dereference `$ref`s via `@apidevtools/json-schema-ref-parser`, with `dereference: { circular: true }`. **This preserves circular references as live circular JS object references rather than erroring or truncating them** - any code that walks a `SchemaObject` recursively must be written assuming the object graph can contain cycles (see `.claude/references/circular-schema-recursion.md`).
3. Transform into a `ServiceNode` tree via `transformOasToServiceNode` and compute the table of contents via `computeAPITree` - both adapted from Stoplight's `elements`/`http-spec` packages, vendored under `src/stoplight/` (see the README's Thank You section; a PR upstreaming parts of this is pending).

`parsedDocument` and `tableOfContents` are the resulting reactive refs consumed by the rendering components. **They are also re-exported as process-global singletons via `src/utils/schema-parser.ts` (`useSchemaParser()` is called once at module load), so under concurrent SSR they are last-writer-wins and unsafe to read directly** - the parse functions instead **return** a request-local `ParseResult` (`{ parsedDocument, tableOfContents }`) that SSR consumers must read. **Read `.claude/references/ssr-request-local-parsing.md` before changing the parse pipeline (`useSchemaParser.ts`, `schema-parser.ts`) or consuming its output server-side.**

### Rendering components (`src/components/spec-document/`)

This is where an operation/model page is actually rendered. The schema-model rendering (`schema-model/ModelNode.vue`, `schema-model/ModelProperty.vue`) is recursive: a schema's `properties`, `items`, and `oneOf`/`anyOf` variants can each lead back into rendering another `ModelNode`/`ModelProperty`. Because the underlying schema graph can be circular (see above), this recursion has to be cycle-safe - **read `.claude/references/circular-schema-recursion.md` before modifying anything in this recursive chain** (`ModelNode.vue`, `ModelProperty.vue`, `useSchemaVariants.ts`, `schema-model.ts`, `schema-example.ts`, `sensitive-data-masking.ts`).

`src/components/extra-renderers/` holds standalone renderers (e.g. `SchemaRenderer`) usable independently of a full spec document. `src/components/spec-renderer-toc/` renders the table of contents sidebar. `src/components/common/` holds shared, non-domain-specific UI pieces.

### Composables vs utils

- `src/composables/` - stateful/reactive logic meant to be called from `<script setup>` (e.g. `useSchemaVariants` centralizes `oneOf`/`anyOf` variant selection and cycle detection so it isn't duplicated across the recursive components that need it, `useSchemaParser` owns the parsed-document state).
- `src/utils/` - plain, non-reactive functions operating on schema/spec data (e.g. `schema-model.ts` for filtering/resolving `SchemaObject`s, `schema-example.ts` for generating sample request/response bodies, `sensitive-data-masking.ts` for masking sensitive fields in samples and code snippets).

When logic needs to be shared between more than one component and depends on reactive props (like the variant-selection/cycle-detection logic above), prefer extracting a composable over duplicating `computed`s across components - it's also what makes that logic independently unit-testable without mounting the full component tree.

### Path alias

`@` resolves to `./src/` (configured in `vite.config.ts`, mirrored in `tsconfig.json`).

## Testing

- Tests are colocated with source (`Foo.vue` / `Foo.ts` next to `Foo.spec.ts`), run via Vitest with `jsdom` and `@vue/test-utils`.
- For component tests exercising recursive rendering (variant selection, nested properties), prefer testing through the actual component tree (`mount`, not `shallowMount`) rather than only at the composable level - several real bugs in this codebase have only been reproducible through the full recursive render, not the composable in isolation (see the reference doc above).
