# fix cross-request state bleed in `@kong/spec-renderer` (SSR singleton)

**Audience:** an agent working **in the `@kong/spec-renderer` repository** (Kong/spec-renderer). You do
NOT have the consuming app (Kong Konnect Portal) checked out; all the context you need is below.

**The ask:** the package exposes parse results via **process-global singleton refs**. Under SSR
concurrency this bleeds one consumer's parsed spec into another's.

---

## 1. Severity and real-world impact

`@kong/spec-renderer` is rendered **server-side** in a **multi-tenant** developer portal that runs on a
**single-threaded JS runtime serving many concurrent requests per process** (a Nuxt app run in a Cloudflare Workers isolate;
also true of any Node SSR server). Because the parse writes into module-global refs, two concurrent SSR
renders of **different** OpenAPI specs can interleave and clobber each other, so **one API-reference page
can render a *different* API's (or a different tenant's) spec**. That is a correctness and data-integrity
defect, not a cosmetic one.

## 2. Root cause — exact locations

Line numbers are from `origin/main` (v1.110.0); verify against current `main` (the pattern is
long-standing and identical across recent versions).

### 2a. The public API re-exports one shared parser instance
`src/index.ts`:
```ts
// We need to expose refs to parsed document/toc and parseSpecDocument method to outside word
export * from './utils/schema-parser'
```

`src/utils/schema-parser.ts` (the whole file):
```ts
import composables from '../composables'

const {
  parseSpecDocument,
  parsedDocument,
  tableOfContents,
  parseOpenApiSpecDocument,
  parseAsyncApiSpecDocument,
  downloadSpecFile,
} = composables.useSchemaParser()   // <-- called ONCE, at module load

export {
  parseSpecDocument,
  parseOpenApiSpecDocument,
  parseAsyncApiSpecDocument,
  downloadSpecFile,
  parsedDocument,        // <-- process-global Ref, shared by every importer
  tableOfContents,       // <-- process-global Ref, shared by every importer
}
```
`useSchemaParser()` is invoked **exactly once** here, so `parsedDocument` / `tableOfContents` (and the
internal `jsonDocument`) are **one set of refs for the whole process lifetime**, shared by every consumer
that imports them from `@kong/spec-renderer`. Confirmed shipped: `dist/types/utils/schema-parser.d.ts`
declares these as flat `Ref<...>` exports.

### 2b. The parse functions mutate those shared refs across `await` points
`src/composables/useSchemaParser.ts`, `parseOpenApiSpecDocument` (and `parseAsyncApiSpecDocument`):
- Declares `parsedDocument` / `jsonDocument` / `tableOfContents` as `ref()` **inside** the factory (fine
  on their own), but §2a makes the single instance global.
- Mutates them across **three await points** — `await saveSpecText(...)`, `await fetchAndBundle(...)`
  (always taken when the portal passes `enforceResetBeforeParsing: true`), and
  `await refParser.dereference(jsonDocument.value, ...)` (a real multi-tick `$ref` traversal).
- After the final `await`, everything through `parsedDocument.value = transformOasToServiceNode(...)`,
  `fixSecurityScopes()`, and `tableOfContents.value = computeAPITree(...)` is **synchronous** — there is
  **no `await` between the package's write of `parsedDocument.value` and a consumer's read of it**.
- Module-scope `let asyncParser`, `let specText`, `let specTitle` (declared **outside** the factory
  function) are also process-global. `specText`/`specTitle` are only read client-side for file download, so
  they are lower priority; `asyncParser` is a stateless lazily-created parser instance (fine to keep).

## 3. Why it bleeds (SSR/concurrency primer)

A consumer does: `await parseOpenApiSpecDocument(spec)` then reads `parsedDocument.value`. In a
single-threaded runtime serving concurrent requests, execution interleaves at every `await`:

1. Request A (spec α, larger) reaches `await refParser.dereference(α)` and yields.
2. Request B (spec β, smaller) runs the same pipeline, overwriting `jsonDocument.value = β`, then awaits its
   own `refParser.dereference(β)`.
3. Whichever `dereference` settles first runs its synchronous tail and sets `parsedDocument.value`. Because
   the two parse promise chains are independent and resolve close together, the **other** parse's tail can
   interpose between the first parse's write and the first consumer's read.
4. The consumer then reads `parsedDocument.value` and gets the **other request's** parsed document.

`enforceResetBeforeParsing: true` does **not** help — it forces a re-parse, adding no mutual exclusion. The
map key / caching a consumer does is also no help: the *key* is right, but the *value* read from the shared
ref belongs to whichever parse last wrote it.

## 4. How the SSR consumer uses it (portal context you don't have)

- The portal imports the **singleton exports** directly: `import { parseOpenApiSpecDocument, parsedDocument,
  tableOfContents } from '@kong/spec-renderer'`, then on the **server** does
  `await parseOpenApiSpecDocument(specContent, { enforceResetBeforeParsing: true })` and reads
  `parsedDocument.value` / `tableOfContents.value`. This runs during SSR for public OpenAPI specs ≤3 MB.
- **Important — the package's own components are already safe:** `src/components/SpecRenderer.vue` calls
  `composables.useSchemaParser()` **fresh per component instance** (its `watch(..., { immediate: true })`
  parses into that instance's own refs). So consumers who render via `<SpecRenderer>` / `<SpecDocument>`
  are request-local and correct. The defect is specifically the `schema-parser.ts` **module-singleton
  re-export**, used by consumers who need the parsed data **as values** (not via the component) — which is
  exactly what SSR text/data extraction and the portal's own state management do.

## 5. Recommended fix — Option A (return the result; backward-compatible)

Make the parse functions **return** the freshly-computed values so callers never read a module-global ref.

In `src/composables/useSchemaParser.ts`:
- Change `parseOpenApiSpecDocument`, `parseAsyncApiSpecDocument`, and `parseSpecDocument` from returning
  `Promise<void>` to returning the request-local result, e.g.:
  ```ts
  Promise<{ parsedDocument: ServiceNode | string | undefined, tableOfContents: TableOfContentsItem[] | string | undefined }>
  ```
- At the end of each, after the refs are assigned, `return { parsedDocument: parsedDocument.value,
  tableOfContents: tableOfContents.value }`. (Because there is no `await` between the assignment and the
  `return`, the returned values are guaranteed to be this call's own results — that is the whole fix.)
- **Keep** writing the refs and keep exporting `parsedDocument`/`tableOfContents` from
  `schema-parser.ts` / `index.ts` so existing consumers do not break — this change is purely additive. You
  may add a `@deprecated` JSDoc on the exported refs steering consumers to the return value.
- Optionally address `specText`/`specTitle` module state the same way (return them, or move into the
  factory) — lower priority, client-download-only.

This is the least-friction fix: consumers migrate from `await parse(...); read parsedDocument.value` to
`const { parsedDocument } = await parse(...)`, with no import changes.

### Option B (alternative) — export the factory
Export `useSchemaParser` itself from `src/index.ts` so each consumer calls it fresh per request/component
and gets request-local refs. More disruptive (consumers change both import and call site). Prefer Option A.

## 6. Backward-compatibility constraints (do not break)

- `export * from './utils/schema-parser'` and every current export (`parseSpecDocument`,
  `parseOpenApiSpecDocument`, `parseAsyncApiSpecDocument`, `downloadSpecFile`, `parsedDocument`,
  `tableOfContents`) must keep working — they back the web-component build and existing consumers. Option A
  is additive (functions gain a return value; refs and signatures otherwise unchanged).
- Do **not** change `SpecRenderer.vue` / `SpecDocument.vue` behavior — they are already request-local.

## 7. Regression test (required)

Add a test proving concurrent parses of different specs — whose internal `refParser.dereference` resolve
out of order — each **return** their own document. Extend `src/composables/useSchemaParser.spec.ts`.

Shape:
1. Build two distinct OpenAPI specs, A and B, each with a unique, identifiable marker (e.g. a unique
   `info.title` / `operationId`). Make them differ enough that their dereference cost differs (A larger).
2. Fire both concurrently: `const [ra, rb] = await Promise.all([parseOpenApiSpecDocument(A), parseOpenApiSpecDocument(B)])`.
3. Assert `ra` corresponds to A and `rb` to B (by their markers) — **not** the other's. Also assert this
   holds across a few interleavings if your test can influence resolution order.
4. This test **fails** against the singleton-read behavior and **passes** once the functions return the
   request-local result (Option A). Keep an assertion that the exported refs still exist (backward compat).

## 8. Repo workflow (spec-renderer)

- `pnpm install`.
- **Test:** `pnpm test` (vitest; `pnpm test:open` for the UI). **Typecheck:** `pnpm typecheck` (vue-tsc).
  **Lint:** `pnpm lint` / `pnpm lint:fix`. **Stylelint:** `pnpm stylelint`.
- **Build:** `pnpm build` (typecheck + package + web-component + types + aliases).
- **Commits/releases:** `pnpm commit` (commitizen, Conventional Commits). Releases are **semantic-release**
  — the commit type drives the version bump, so use **`fix:`** for this change so it ships as a patch/minor
  that the portal can bump to.

## 9. Done criteria

- New concurrent-parse regression test passes; existing tests, `pnpm typecheck`, and `pnpm lint` all pass.
- The exported refs and function signatures remain backward-compatible (only additive return values).
- PR description notes that this lets the Kong Konnect Portal remove its parse-mutex workaround.

## 10. Consuming-side follow-up (after this ships — not your task, for context)

Once `@kong/spec-renderer` returns the parsed result, the portal will:
- Bump to the new version, switch `useSpecRenderer.ts` to `const { parsedDocument, tableOfContents } =
  await parseOpenApiSpecDocument(...)`. (Referenced here only so you understand the intended end state; you do not touch the portal.)
