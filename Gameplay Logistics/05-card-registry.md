# Card Registry

`src/cards/CardRegistry.ts` is the runtime catalog. It combines authored definitions into one lookup surface for gameplay, UI, tests, packs, rewards, and deck construction.

## Current Sources

The registry imports live definitions from:

- `src/data/cards/lightCards.ts`
- `src/data/cards/darkCards.ts`
- `src/data/cards/ainSophAurCards.ts`
- `src/data/cards/eternalCards.ts`
- `src/data/cards/enigmaRewardCards.ts`
- `src/data/ascension/transcendentCards.ts`

Current runtime coverage expects 67 registered cards across Light, Dark, and Ain Soph Aur definitions.

## Registry API

Use:

```ts
CardRegistry.get(id)
CardRegistry.getAll()
CardRegistry.getByType('Light')
CardRegistry.getByRarity('Eternal')
```

Do not hardcode cross-file catalog scans in gameplay code. Runtime audits should use `CardRegistry.getAll()` because that is what the game sees.

## Neutrality Pack Pool

The Neutrality pack pool is generated from live base catalogs: 24 Light, 24 Dark, and 4 Ain Soph Aur cards. It must not contain retired Seraphim/Ophanim/Cherubim/Angel IDs. `PackOpeningFlow.test.ts` verifies that every pool ID resolves through the registry.

## Display Copies

`displayCardDefinition` applies player-facing text formatting for names/descriptions. Runtime fields still keep compatibility names such as `baseOblivion`; UI text must say Divine Light.

## Debugging Missing Cards

1. Confirm the data file exports the card.
2. Confirm `CardRegistry.ts` imports the source array.
3. Confirm the `definitionId` is unique.
4. Confirm `CardRegistry.get(id)` resolves.
5. Confirm art resolves through `cardBackgrounds.ts` and the asset audit.
6. Confirm behavior is covered by `CardRuntimeWiring.test.ts`.
