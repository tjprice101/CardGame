# Save And Migrations

## Why Saves Need Versions

Players keep saves while the code evolves. Card IDs can disappear, fields can change shape, and mechanics can be retired. A save version tells the loader which transforms still need to run.

`src/save/SaveManager.ts` owns versioning and migrations. Migrations must remain available for old saves.

## Current Compatibility Notes

Player-facing terminology is Divine Light, but persisted/API keys still include `oblivion`, `lifetimeOblivion`, `bestSingleTurnOblivion`, and effect tags such as `oblivion_flat`. Do not rename those fields without a versioned migration and compatibility read/write path.

Ain Soph Aur cards belong in `deck.extraDeck`; save cleanup and runtime invariants defensively move leaked Ain Soph Aur cards out of hand, draw pile, and discard pile.

Board, hand, pending effects, and mulligan selection are ephemeral. Materialized ability loadouts, ability cooldown timestamps, and Divine Field expiration are persisted runtime state and must survive End Turn and save/load. Migration/sanitization may clear other active turn state to a safe idle state.

Garden material progress includes the Neutrality currencies plus `seedOfCausality`, `causalBloom`, `shatteredCausalTranscript`, and `heartOfCausality`. Missing values from older saves must normalize to zero before dungeon rewards or Infinite crafting mutate them. `turn.attackSequence` is ephemeral and should never be resumed from an untrusted interrupted save.

Profile UI changes reuse existing save fields: name, bio, avatar/title, five signature IDs, `uiThemeId`, `customUiTheme`, and `mainMenuBackgroundId`. Light/Dark Mode remains `settings.buttonColorMode`. Keep canonical background IDs, not image URLs, in saves so production asset hashing or desktop overrides cannot invalidate selections.

The seven background rewards latch into `progress.achievementUnlocks` and use existing `achievementClaims`. Retroactive load checks earn eligible rewards; once latched they remain earned even if current ownership changes. Art availability is separate from achievement progress. Installing PNGs and reorganizing achievement presentation required no new save schema or migration. Intensity's proposed art roster must not create live card IDs or alter saves.

## Migration Rules

- Treat old fields as optional.
- Validate arrays before reading them.
- Filter retired IDs instead of crashing.
- Preserve unrelated progress.
- Clear or normalize active turn state when old runtime fields cannot be trusted.
- Bump the save version only after transforms complete.
- v49 initializes `progress.ownedAbilities` for saves created before Ability Materialization.
- v50 initializes and sanitizes Garden material currencies and clears interrupted Garden runtime encounters. Garden now includes Neutrality and Causality material fields.
- v54 standardizes the Login Calendar to claimed local Days 1–2 and locks the current local day so Day 3 becomes available the following local day. The normalization marker prevents repeat resets.
- v55 initializes accumulated Forge wheel spins and gives previously Forge-unlocked accounts one launch spin. Unspent daily spins accumulate after unlock.
- Test old fixtures and current fixtures.

## Progress Snapshots

Some runs restore pre-run progress snapshots, especially boss and Garden encounter flows. If gameplay can complete Enigma steps during such a run, capture Enigma progress before restoring and merge completion flags afterward.
