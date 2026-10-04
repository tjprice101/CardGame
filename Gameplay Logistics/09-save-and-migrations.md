# Save And Migrations

## Why Saves Need Versions

Players keep saves while the code evolves. Card IDs can disappear, fields can change shape, and mechanics can be retired. A save version tells the loader which transforms still need to run.

`src/save/SaveManager.ts` owns versioning and migrations. Migrations must remain available for old saves.

## Current Compatibility Notes

Player-facing terminology is Divine Light, but persisted/API keys still include `oblivion`, `lifetimeOblivion`, `bestSingleTurnOblivion`, and effect tags such as `oblivion_flat`. Do not rename those fields without a versioned migration and compatibility read/write path.

Ain Soph Aur cards belong in `deck.extraDeck`; save cleanup and runtime invariants defensively move leaked Ain Soph Aur cards out of hand, draw pile, and discard pile.

Board, hand, pending effects, and mulligan selection are ephemeral. Materialized ability loadouts, ability cooldown timestamps, and Divine Field expiration are persisted runtime state and must survive End Turn and save/load. Migration/sanitization may clear other active turn state to a safe idle state.

Garden material progress includes the Neutrality currencies plus `seedOfCausality`, `causalBloom`, `shatteredCausalTranscript`, and `heartOfCausality`, and the Intensity currencies `emberglass`, `abyssalCinder`, `solarSlag`, and `heartOfTheInferno`. Missing values from older saves must normalize to zero before dungeon rewards or Infinite crafting mutate them. `turn.attackSequence` is ephemeral and should never be resumed from an untrusted interrupted save.

Profile UI changes reuse existing save fields: name, bio, avatar/title, five signature IDs, `uiThemeId`, `customUiTheme`, and `mainMenuBackgroundId`. Light/Dark Mode remains `settings.buttonColorMode`. Keep canonical background IDs, not image URLs, in saves so production asset hashing or desktop overrides cannot invalidate selections.

All fourteen background rewards latch into `progress.achievementUnlocks` and use existing `achievementClaims`. Retroactive load checks earn eligible rewards; once latched they remain earned even if current ownership changes. Art availability is separate from achievement progress. Installing PNGs and reorganizing achievement presentation required no new save version. Intensity gameplay content uses stable IDs independently of pending cosmetic artwork.

Intensity accomplishments add optional lifetime fields: `intensityCardsPlayed`, `intensityInfernoGenerated`, `intensityInfernoSpent`, `intensityBestTurnInferno`, `intensityCraterClears`, and `intensityAbilityActivations`. Store loading normalizes missing/invalid records to finite nonnegative integers; only missing card-play counts can be reconstructed from existing per-definition play history. Do not fabricate historical Inferno generation/spending, dungeon clears, or ability usage from current balances. These fields persist across turn/encounter resets; the separate turn-local gained/spent fields still reset normally. Successful actions record deltas once; rejected actions and trial-deck activity do not count.

## Temporary Debug Sessions

Type `key` in quick succession outside a text field after the game loads. Activation requires idle gameplay (finish any current turn, encounter, trial, or co-op session first). The session grants every registered card, eight normal copies where supported, eight holofoils, all abilities, finite testing currencies/materials, completed boss/Enigma gates, and profile cosmetics. Eternal, Infinite, Enigmatic, and Transcendent cards remain holo-only. Missing art remains unavailable.

The global shortcut is in [`useDebugShortcut`](../card-game-idle/src/ui/useDebugShortcut.ts); the grant and **Exit Debug** restore actions are in [`store`](../card-game-idle/src/state/store.ts). Repeating `key` does not overwrite the original snapshot. The always-visible **Temporary Debug** banner returns you to the main menu when exiting.

[`debugSession`](../card-game-idle/src/core/debugSession.ts) keeps an independent normal-state snapshot in memory, outside the save schema. [`SaveManager`](../card-game-idle/src/save/SaveManager.ts) uses this snapshot for manual saves, autosaves, shutdown saves, and exports that must create an initial save. Existing exports continue reading the normal stored envelope. No grants or debug-mode flag are persisted. Exit restores the normal session; reload, load/import, or reset discards temporary mode. Explicit importing/resetting still replaces the normal save as usual.

Debug is offline: [`getSupabase`](../card-game-idle/src/net/supabaseClient.ts) disables new social, gift, co-op, leaderboard, and cloud operations while the snapshot exists. Stats transition detection ignores the grant/restore boundaries, profile synchronization reads only normal profile data, and cloud reconciliation cannot replace an active debug snapshot. No save migration is needed.

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
- v56 initializes and sanitizes the four Intensity material balances, Inferno stacks, and turn-local gained/spent counters as nonnegative finite integers. It defaults the one-shot Inferno gain multiplier to 1 while preserving valid existing balances/reserves. These counters and the reserve reset at turn end; material balances and ability cooldowns do not.
- Test old fixtures and current fixtures.

## Progress Snapshots

Some runs restore pre-run progress snapshots, especially boss and Garden encounter flows. If gameplay can complete Enigma steps during such a run, capture Enigma progress before restoring and merge completion flags afterward.

Boss completion/defeat and Null Raid completion/forfeit also capture and merge the six monotonic Intensity lifetime records through `intensityProgress.ts`. Merge by maximum, not addition, because the snapshot already includes prior lifetime progress; repeated restoration must not double-count actions. Trial snapshots restore their original records without merging trial activity.
