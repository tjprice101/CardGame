# Testing And Build Workflow

## Build

From `card-game-idle/`:

```powershell
npm run build
```

This runs TypeScript project compilation and then the Vite production build. It catches type errors, invalid imports, and bundling failures.

## Tests

The project uses Vitest. Run the full suite with:

```powershell
npm test -- --run
```

Run a focused test while changing one subsystem:

```powershell
npm test -- --run src/tests/unit/systems/CardSummaryDigest.test.ts
```

## Test layers

- **Type checking** catches invalid unions, missing fields, and incompatible store shapes.
- **Unit tests** validate pure calculations such as summaries, quests, abilities, and Enigma evaluation.
- **Store/system tests** validate action ordering and state transitions.
- **Build validation** ensures the actual module graph can bundle.

## How to write a gameplay test

1. Construct the smallest valid starting state.
2. Resolve definitions through the same registry path as runtime code.
3. Call the public store action or isolated system function.
4. Assert state outcomes, not implementation details.
5. Include invalid-action cases when the action crosses a trust boundary.

For card tests, use stable IDs and explicit `finish: 'normal'` fields in deck/extra-deck fixtures.

## Debugging order

When a card behaves incorrectly:

1. Is the source definition imported?
2. Does `CardRegistry.get(id)` return it?
3. Did normalization/materialized balance change it?
4. Does the action choose the correct card-type branch?
5. Does the executor handle every effect tag?
6. Did the store propagate `pendingEffect`?
7. Were durability and cooldown helpers called?
8. Does the UI use the canonical summary instead of raw text?
9. Is a save migration removing or reshaping the data?

This order follows the runtime pipeline and avoids guessing at the UI when the issue is actually data or state.
