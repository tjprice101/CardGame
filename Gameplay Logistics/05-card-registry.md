# Card Registry

`src/cards/CardRegistry.ts` turns many authored arrays into one runtime catalog.

## Boot process

The registry imports card arrays from Neutrality, Eternal, Infinite, and Ascension data files, then concatenates them into `SOURCE_DEFINITIONS`.

It then performs several passes:

```text
source definitions
  -> normalize authored/runtime balance
  -> apply documentation overrides
  -> apply global balance policies
  -> enforce global attack ladder
  -> registry Map
  -> display copies and lookup indices
```

## Why use a registry

Without a registry, every caller would need to know every data file. The registry gives gameplay code one stable API:

```ts
CardRegistry.get(id)
CardRegistry.getAll()
CardRegistry.getByType('Seraphim')
CardRegistry.getByRarity('Eternal')
```

It also centralizes aliases, normalization, special-card exceptions, and display text preparation.

## Maps and indexes

The internal `Map<string, CardDefinition>` gives O(1)-style ID lookup. Additional maps group definitions by type and rarity so menus and deck-building screens do not repeatedly scan the full catalog.

## Source versus materialized balance

`src/data/cards/materializedCardBalance.ts` is generated balance data. It can provide attack and effect overrides. `normalizeDefinition` decides whether a card keeps authored behavior or receives materialized tuning.

This distinction is important:

- Authored source tells designers what a card is intended to be.
- Materialized balance tells runtime code what the current tuned numbers are.
- The registry produces the definition that gameplay actually sees.

Runtime audits should use `CardRegistry.getAll()`, not only raw source arrays.

## Display copies

The registry keeps runtime definitions and builds display definitions with formatted names and attack descriptions. UI code receives display-ready card definitions while gameplay still resolves IDs through the registry.

## How to debug a missing card

1. Check that the data file exports it.
2. Check that the file is imported into `CardRegistry.ts`.
3. Check that its `definitionId` is unique.
4. Check whether normalization filters or replaces it.
5. Check `CardRegistry.get(id)` in a test or console path.
6. Check save migration aliases if the ID was renamed.
