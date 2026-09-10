# Testing And Build Workflow

Run commands from `card-game-idle/`.

## Commands

```powershell
npm run build
npm run typecheck:tests
npm test -- --run
```

For focused validation:

```powershell
npm test -- --run src/tests/unit/systems/CardRuntimeWiring.test.ts
```

## Current Critical Test Files

- `CardRuntimeWiring.test.ts`: exhaustive runtime coverage for registered card lifecycles, flips, sacrifices, Light attacks, Dark utilities, Ain Soph Aur summons, Bridge, costs, cooldowns, and atomic failure guards.
- `CardCatalog.test.ts`: catalog counts, rarity/cost policies, registry exposure, playability checks.
- `FullTurnE2E.test.ts`: turn start, mulligan, play, summon, Bridge, hand cap, rejection paths.
- `GameplayEdgeCases.test.ts`: focused lifecycle edge cases including Soph/Ain placement and force removal.
- `PackOpeningFlow.test.ts`: live pack pool and purchase awards.
- `PackOpeningModalSource.test.ts`: pack opening must not auto-reveal.
- `CardDescriptionAudit.test.ts`: authored descriptions and summary text do not leak internal tokens.
- `CardBackgroundAssetAudit.test.ts`: card art references resolve.

## Gameplay Test Rules

1. Resolve definitions through `CardRegistry` when testing live behavior.
2. Call public store actions unless testing a pure system function.
3. Assert state outcomes: zone movement, resource changes, cooldowns, pending effects, and rejection safety.
4. Include invalid-action cases for trust boundaries.
5. Run focused tests before full validation.

## When To Add Tests

Add or extend tests whenever you change:

- Card definitions, effects, costs, rarity, or summon requirements.
- Store action ordering or validation.
- Pending-effect contracts.
- Pack pools, reward generation, or collection writes.
- Card UI that controls availability, costs, previews, or reveal timing.

## Debugging Order

1. Does `CardRegistry.get(id)` resolve?
2. Does the definition contain the expected fields?
3. Does the store action choose the correct branch?
4. Does `CardEffectExecutor` handle every effect tag?
5. Are pending effects queued and resolved?
6. Are Divine Light, cooldowns, and card zones updated atomically?
7. Does the UI disabled state match the store guard?
8. Does the card face use shared summary/chrome helpers?
