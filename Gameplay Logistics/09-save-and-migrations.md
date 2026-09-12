# Save And Migrations

## Why Saves Need Versions

Players keep saves while the code evolves. Card IDs can disappear, fields can change shape, and mechanics can be retired. A save version tells the loader which transforms still need to run.

`src/save/SaveManager.ts` owns versioning and migrations. Migrations must remain available for old saves.

## Current Compatibility Notes

Player-facing terminology is Divine Light, but persisted/API keys still include `oblivion`, `lifetimeOblivion`, `bestSingleTurnOblivion`, and effect tags such as `oblivion_flat`. Do not rename those fields without a versioned migration and compatibility read/write path.

Ain Soph Aur cards belong in `deck.extraDeck`; save cleanup and runtime invariants defensively move leaked Ain Soph Aur cards out of hand, draw pile, and discard pile.

Board, hand, pending effects, and mulligan selection are ephemeral. Materialized ability loadouts, ability cooldown timestamps, and Divine Field expiration are persisted runtime state and must survive End Turn and save/load. Migration/sanitization may clear other active turn state to a safe idle state.

## Migration Rules

- Treat old fields as optional.
- Validate arrays before reading them.
- Filter retired IDs instead of crashing.
- Preserve unrelated progress.
- Clear or normalize active turn state when old runtime fields cannot be trusted.
- Bump the save version only after transforms complete.
- v49 initializes `progress.ownedAbilities` for saves created before Ability Materialization.
- Test old fixtures and current fixtures.

## Progress Snapshots

Some runs restore pre-run progress snapshots, especially boss, trial, and raid flows. If gameplay can complete Enigma steps during such a run, capture Enigma progress before restoring and merge completion flags afterward.
