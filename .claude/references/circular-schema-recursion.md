# Circular schema recursion: bugs found, fixes applied, and how to avoid reintroducing them

## Background

A large/circular OpenAPI schema (a `$ref` that points back at itself, directly or through a chain)
could freeze or crash the browser tab when rendering an operation page, or crash the SSR render
entirely. The root cause was always the same shape, found in **four independent places**: an
unguarded recursive walk over a `SchemaObject` graph that assumed the graph was a tree, when it can
actually contain cycles.

**The core invariant driving all of this:** `useSchemaParser`'s `refParser.dereference(...,
{ dereference: { circular: true } })` preserves a circular `$ref` as a **live circular JS object
reference**, not a string, not a truncated stub, not an error. Any function or component that walks
`.properties`, `.items`, `.oneOf`, `.anyOf`, or `.allOf` on a `SchemaObject` recursively must assume
it can walk back into an object it has already visited, forever, unless it explicitly guards
against that.

If you are adding a new function or component that recursively walks a `SchemaObject`, or changing
one of the four fixed below, read this whole document first.

## The four fixed recursive walks

### 1. `removeFieldsFromSchemaObject` (`src/utils/schema-model.ts`)

Used to filter `readOnly` fields out of request bodies (`BodyContentList.vue`, the only caller).
Before the fix, an unguarded recursive walk over `properties`/`items`/`oneOf`/`anyOf` would throw
`TypeError: Converting circular structure to JSON` or `RangeError: Maximum call stack size
exceeded`.

Fixed with a `WeakMap<object, SchemaObject>` (`seen`) that memoizes each schema object's filtered
result **before** recursing into its own children. A cycle resolves to the same already-filtered
object instead of recursing forever; a schema reached via more than one path (a DAG, not just a
cycle) is filtered once and reused, not reprocessed.

Each of the four filtering steps (properties, items, oneOf, anyOf) has its own `try`/`catch`,
narrowed to only swallow `RangeError` (real stack depth) - anything else propagates instead of
silently leaving a field unfiltered. If you touch this function, keep those catches narrow; a bare
`catch {}` here previously masked real bugs.

### 2. `ModelNode.vue` / `ModelProperty.vue` variant rendering + `useSchemaVariants.ts`

`oneOf`/`anyOf` variants render **eagerly** - unlike nested `properties`, which require a manual
"Show Child Parameters" click before mounting further, a variant's fields render immediately on
selection. A schema whose variants cycle back to an ancestor would mount `ModelNode`/`ModelProperty`
forever, freezing the tab.

Fixed with an **ancestor-chain identity guard**, centralized in `useSchemaVariants.ts` (not
duplicated across the two components - see "extraction" note below):

- `ancestorSchemas` - a `Set<object>` of every schema visited so far in the current render branch,
  threaded through recursive component props. A **fresh copy per branch** (never the same mutable
  `Set` reused across sibling branches), so two unrelated properties that happen to share a
  non-circular schema (a DAG, not a cycle) don't falsely block each other.
- `ancestorsIncludingSelf` - the above plus the current node's own raw identity, added **on entry**,
  so a variant cycling straight back to the current node is caught with zero extra hops, not one
  lap later.
- `isCircularVariant` - true when the selected variant's raw identity is already in
  `ancestorsIncludingSelf`.
- `MAX_VARIANT_RECURSION_DEPTH` (`src/constants.ts`, currently 50) - a **backstop only**, for
  defense in depth if the identity guard is somehow defeated. It is deliberately generous: a real
  spec should never legitimately need anywhere close to 50 nested distinct variants, so this should
  essentially never fire in practice. Do not lower it to "be safe" - a low depth cap silently
  truncates legitimately deep, non-circular variant chains (this was tried during development and
  had to be raised from 10 to 50 after a 20-level legitimate chain got cut off).

**Do not gate variant rendering on depth alone.** A depth-only cap (no identity check) still stops
a crash, but it renders the same cyclic content over and over up to the cap before stopping -
visibly broken UI, not just a theoretical concern. The identity guard is what makes a cycle stop
at the exact repeat instead of after N duplicate renders.

### 3. `crawl` (`src/utils/schema-example.ts`) - request/response sample generation

Generates the JSON sample shown for a request/response body. Bounded by `MAX_NESTED_LEVELS` (a
real, intentional content-depth limit for generated examples - unrelated to cycle safety, don't
confuse the two), so this one was never at risk of an actual crash. But its memoization
(`seen: WeakMap`) had two real correctness bugs:

- The original code read `seen.get(objData)?.seenSample` but stored `seen.set(objData, { sampleObj,
  parentKey })` - the keys never matched, so the memo never hit and a schema shared by reference
  across sibling properties returned `undefined` for every occurrence after the first.
- Once that was fixed, the memo was still keyed on identity alone with no depth component, so a
  schema shared by reference at two *different* nesting depths could reuse a result computed at the
  wrong depth (`MAX_NESTED_LEVELS` truncation is depth-dependent). Fixed by keying on
  `(identity, nestedLevel)` via `WeakMap<object, Map<number, result>>`.

### 4. `_schemaHasSensitiveData` (`src/utils/sensitive-data-masking.ts`)

Recursed on `schema.properties` with **no cycle guard of any kind**. This was the actual root cause
of the live production crash that motivated this whole investigation - reproduced by matching the
exact stack trace from a crash report. Fixed with a `WeakSet<object>` of visited raw properties. A
plain "visited once, ever" set (not an ancestor-chain copy) is correct here specifically *because*
this function is a pure boolean predicate - the answer for a given schema doesn't depend on which
path reached it, and finding sensitive data anywhere already short-circuits the walk. Don't copy
this "one global set" pattern into a function that isn't a pure predicate (see the ancestor-chain
note in #2 for why that would be wrong there).

## The recurring pitfall: raw identity vs. resolved identity

This is the single most expensive lesson from this investigation, and it caused **two separate,
initially-shipped-then-caught regressions** in this same fix. Read this section before writing any
cycle guard.

`resolveSchemaObjectFields` (`src/utils/schema-model.ts`) returns a **freshly-copied object** every
time it's called on an array-typed or `allOf`-bearing schema (to hoist `items`' fields up, or to
merge `allOf` members). It is *not* identity-preserving for those shapes, even though it happens to
return the same object reference unchanged for a plain object/primitive schema with no `allOf`.

Any `Set`/`WeakMap`/`WeakSet` used to detect "have I seen this schema before" **must be keyed on the
raw, pre-resolve object**, not on the output of `resolveSchemaObjectFields`. If you key on the
resolved form instead:

- For the common case (plain object/primitive variants, no `allOf`), it happens to work, because
  resolve is a no-op there - **this is exactly what made the bug easy to miss** in code review and
  in tests that only used plain schemas.
- For an array-typed or `allOf`-bearing schema specifically, the guard silently stops matching on
  a genuine repeat, because every visit produces a new object. A cycle running through such a node
  degrades from "stops at the exact repeat" to "stops when the depth backstop kicks in" - not a
  crash, but a real, measurable regression (verified: an array-typed 2-node cycle went from 1
  rendered node to 50 once this was gotten wrong).

This is why `ModelNode.vue`/`ModelProperty.vue` deliberately use **different objects for different
purposes** and it is not a stray inconsistency to "clean up":

- The **recursive `:property=` binding** (what gets passed to the next component down) uses
  `rawSelectedVariant` - the raw, pre-resolve variant - specifically so its identity survives
  correctly for the next level's cycle check.
- The **render-gate condition** (`v-if` deciding whether to render at all) uses `selectedSchemaModel`
  - the *resolved*, `allOf`-merged form - because `oneOf`/`anyOf` can be hidden inside a variant's
  own `allOf` and only becomes visible after resolution. Gating on the raw form here would silently
  drop a legitimately nested variant whose `oneOf` only appears post-merge.

If a future refactor "simplifies" these to use the same object, verify against both of these cases
before merging - each has a passing regression test (`ModelNode.spec.ts`) that was specifically
written to fail if you get this wrong:

- `'detects a cycle running back through an array-typed intermediate variant'`
  (`useSchemaVariants.spec.ts`) - would silently degrade to a 50-node render instead of 1.
- `'still renders a variant whose oneOf is hidden inside its own allOf'`
  (`ModelNode.spec.ts`) - would silently drop the nested variant entirely.

## Why the cycle-detection logic lives in `useSchemaVariants.ts`, not inline in the components

It used to be duplicated almost verbatim across `ModelNode.vue` and `ModelProperty.vue`. It was
extracted into the composable (matching the existing pattern of centralizing reactive,
prop-dependent logic there rather than duplicating computeds across components - see CLAUDE.md)
for two reasons that matter for future changes:

1. It removes the duplication risk - fixing this logic in one file and forgetting the other copy is
   exactly how bugs like #2 above happen.
2. It's independently unit-testable (`useSchemaVariants.spec.ts`) without mounting either Vue
   component - faster and more precise for testing edge cases like the array-typed-intermediate
   cycle above, which is awkward to construct through a full component mount.

If you need to add a new piece of cycle-detection or variant-selection state, add it to the
composable and export it, rather than computing it separately in a consuming component.

## If you're adding a new recursive schema walk

Checklist, based on the mistakes made and caught above:

1. Assume the input can contain a cycle (a live circular object reference), not just deep nesting.
   Both are possible and need different handling (a cycle needs identity tracking; pure depth needs
   a bound like `MAX_NESTED_LEVELS`).
2. Pick identity tracking vs. ancestor-chain tracking deliberately, not by copy-pasting whichever
   one you saw last:
   - Ancestor-chain (fresh `Set` copy per branch, self added on entry) - correct when the same
     schema reached via two different *non-circular* paths (a DAG) should be treated as fine, and
     only a true cycle back to one of *your own* ancestors should be blocked. This is what the
     variant-rendering guard needs.
   - Global "visited once, ever" (a single shared `WeakSet`/`WeakMap`) - only correct for a pure,
     order-independent computation (a boolean predicate, or a result that's identical no matter
     which path reaches it). Using this for something path-dependent (like rendering) will falsely
     suppress legitimate DAG-shared content.
3. Key whatever structure you use on the **raw, pre-resolve** schema object, never on the output of
   `resolveSchemaObjectFields` (or any other function that can return a new object for the same
   logical schema). If you're not sure whether a helper is identity-preserving, test it directly
   with an array-typed or `allOf`-bearing input before relying on it.
4. Write a test that actually exercises a cycle through the *specific* shape your new code handles
   (array-typed, `allOf`-bearing, direct self-reference, etc.), not just a plain object cycle - the
   plain-object case is the one shape that tends to work by accident even when the guard is wrong.
5. Prefer testing through a full component mount over the composable/util in isolation when the
   bug could plausibly only show up in the actual recursive render (several of the bugs above were
   invisible at the unit level and only reproduced once mounted end-to-end).
