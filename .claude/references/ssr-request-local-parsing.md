# Request-local parsing: preventing cross-request (SSR) state bleed

## The invariant

`@kong/spec-renderer` is rendered **server-side in long-lived, single-threaded, many-requests-per-process
runtimes** (Cloudflare Workers isolates, AWS Lambda, Node SSR). `src/utils/schema-parser.ts` calls
`useSchemaParser()` **once at module load**, so its exported `parsedDocument` / `tableOfContents` refs are
**process-global** — one set shared by every concurrent request for the isolate's lifetime.

**Rule: a parse must never expose its result through process-global state that another concurrent request
can observe.** Two SSR renders of different specs interleave at every `await`; shared parse state means one
tenant's API reference can render another tenant's spec — a data-integrity / tenant-isolation defect, not a
cosmetic one.

## What went wrong (the bug we fixed)

The parse pipeline threaded its *working document* through a shared `jsonDocument` ref and **read it back
after `await` points** (`titleResolve` / `refParser.dereference`). A concurrent parse overwrote that ref
during the awaits, so the call computed and returned the **other** request's document. Note: merely returning
the shared refs at the synchronous tail does **not** fix this — the corruption happens earlier, before the
tail runs.

## The pattern to follow

1. **Thread all intermediate state through request-local variables** (`localJson` / `localParsed` /
   `localToc`). Never read a module/shared ref across an `await`.
2. **Return the result.** The parse functions return `ParseResult` (`{ parsedDocument, tableOfContents }`,
   defined in `src/types/spec-renderer.ts`). Consumers must read the returned value, not the shared refs.
3. **Always (re)bundle the provided spec** — never consult shared state as a cache to decide *what* to parse.
   This makes parsing *fail-safe*: an omitted flag can't cause a prior request's document to come back.
   (`enforceResetBeforeParsing` is a retained no-op.)
4. The shared refs are still assigned and exported (`@deprecated`) **only** for backward compatibility with
   single-request / client consumers.

## Regression checklist (before changing `useSchemaParser.ts` / `schema-parser.ts`)

- [ ] No `await` sits between reading a shared/module ref and using its value. Capture into a local **before**
      the first `await`, or don't read shared state at all.
- [ ] All three parse functions still **return** their request-local `ParseResult`; every new/early code path
      returns its own result (`{ parsedDocument: undefined, tableOfContents: undefined }` on failure), not bare
      `return`.
- [ ] No new **module-scope** mutable state that holds per-request data. Module `let`s persist for the whole
      isolate lifetime → both a bleed **and** a memory-retention risk. (`specText` / `specTitle` are a known
      pre-existing exception: client-download only, guarded by `isSsr()`.)
- [ ] Don't reintroduce a shared-ref cache keyed on anything but the call's own freshly-computed local.

## Test that guards it

`src/composables/useSchemaParser.spec.ts` → `describe('concurrency (cross-request state bleed)')` fires two
concurrent parses of different specs (the larger one dereferences slower, forcing the interleaving) and
asserts each call **returns its own** document; a companion test asserts an omitted `enforceResetBeforeParsing`
no longer returns a prior spec. These fail against the shared-ref pattern and pass with request-local returns —
keep and extend them when touching the pipeline.
