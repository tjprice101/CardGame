# Card Registry

`src/cards/CardRegistry.ts` is the runtime catalog. It combines authored definitions into one lookup surface for gameplay, UI, tests, packs, rewards, and deck construction.

## Current Sources

The registry imports live definitions from:

- `src/data/cards/lightCards.ts`
- `src/data/cards/darkCards.ts`
- `src/data/cards/ainSophAurCards.ts`
- `src/data/cards/causalityCards.ts`
- `src/data/cards/causalityInfiniteCards.ts`
- `src/data/cards/neutralityInfiniteCards.ts`
- `src/data/cards/intensityCards.ts`
- `src/data/cards/eternalCards.ts`
- `src/data/cards/enigmaRewardCards.ts`
- `src/data/ascension/transcendentCards.ts`

Runtime coverage derives from all registered source arrays rather than a stale fixed count. Intensity contributes 29 cards: 19 base pack cards, five boss-awarded Eternals, and five crafted Infinites.

## Restored Neutrality Infinites

All eight original `inf-*` Neutrality IDs are live again. Existing ownership, recipes, art keys, and PNGs remain compatible; `infiniteCards.ts` derives its Neutrality display metadata from the live definitions rather than retaining retired class/Patience text.

| Card | Type | Required Spectrum |
| --- | --- | --- |
| The Absolute Null | persistent Dark | 5 |
| The Cascade of the Hollow Sky | persistent Dark | 4 |
| The White Throne Before Beginning | Light | 4 |
| The Apex of Nothing | Light | 5 |
| The Crown of Unmaking | persistent Dark | 5 |
| The Garden of Annihilation | persistent Dark | 4 |
| The Sovereign Veil | Ain Soph Aur | 5 |
| The Rift of Outer Silence | Ain Soph Aur | 4 |

Infinite rarity has a minimum Spectrum Level of 4; a Level-5 definition still requires Level 5. Light and Bridge attacks use Light Stack costs. The six new `neutrality_*` instructions implement capped stack resonance, oldest eligible Abyss recovery, capped slot-ordered Soph charge release, Soph charge grants, per-card cooldown rebates, and remaining Light/Dark support pairs. Eligibility includes Neutrality base/Eternal/Infinite cards and excludes other sets. Recovery never inserts Ain Soph Aur into the main-deck hand. Tentative board copies clone nested cooldown records so a later failed cost cannot leak edits.

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

## Intensity

The base pack contains five unique draws from its 19-card pool. Eternal and Infinite cards are excluded from ordinary packs. Canonical IDs use `light-intensity-`, `dark-intensity-`, `ain-soph-aur-intensity-`, `eternal-intensity-`, and `infinite-intensity-`. Use `getCardSetId` for classification, including premium cards; never classify every non-Causality card as Neutrality.

`intensityCards.ts` authors the Limitless Inferno engine with new typed effect instructions. Its attack values use the existing Spectrum power helpers rather than a new endgame power band. Installed artwork routes through `intensityArt.ts` and `cardBackgrounds.ts`, including the set-specific card back and store banner.

Rarity-specific backings take precedence over set backings: every Intensity Eternal uses `eternal/Eternal Cards Card Back.png`, and every Intensity Infinite uses `infinite/Infinity Cards Card Back.png`. Only base Intensity cards use `intensity/intensity-card-back.png`. Shared face styling applies this rule across previews and live face-down cards, including holo finishes; front artwork remains set-specific.

## Debugging Missing Cards

1. Confirm the data file exports the card.
2. Confirm `CardRegistry.ts` imports the source array.
3. Confirm the `definitionId` is unique.
4. Confirm `CardRegistry.get(id)` resolves.
5. Confirm art resolves through `cardBackgrounds.ts` and the asset audit.
6. Confirm behavior is covered by `CardRuntimeWiring.test.ts`.
