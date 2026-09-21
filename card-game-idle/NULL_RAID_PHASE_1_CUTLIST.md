# Null Raid Removal - Phase 1 Cut List

This document is the Phase 1 working checklist. It is intentionally limited to inventory, scope control, and a cut list for the next removal steps. No code or asset deletion happens in this phase.

## Phase goal

Remove Null Raid as an active game route without breaking the app, save compatibility, or the Forge-first progression path.

## Rule for this session

- Do not delete or rename anything in Phase 1.
- Only record confirmed active references and confirmed dead legacy targets.
- Keep the app stable while we complete the phases in order:
  1. Phase 1: document/cut list
  2. Phase 2: remove active Null Raid UI exposure
  3. Phase 3: guard store functions
  4. Phase 4: delete dead files
  5. Phase 5: validate and finalize

## Confirmed active Null Raid surface

These are the files and systems clearly tied to Null Raid and should be removed from the active UI flow in Phase 2.

### Active app/UI references

- [card-game-idle/src/app/App.tsx](card-game-idle/src/app/App.tsx)
  - Lazy-loads the coop invite modal.
  - This is a top-level app shell reference that should be reviewed before UI removal.

- [card-game-idle/src/ui/menu/CardBoundCoopHub.tsx](card-game-idle/src/ui/menu/CardBoundCoopHub.tsx)
  - Contains a null raid co-op draft flow and launch flow.
  - Must be removed from the active menu surface in Phase 2.

- [card-game-idle/src/ui/ascension/AscensionHub.tsx](card-game-idle/src/ui/ascension/AscensionHub.tsx)
  - Main Null Raid selection and launch UI.
  - Active user-facing raid browser and controls.

- [card-game-idle/src/ui/ascension/NullRaidArena.tsx](card-game-idle/src/ui/ascension/NullRaidArena.tsx)
  - Arena screen for the Null Raid encounter sequence.

- [card-game-idle/src/ui/ascension/NullRaidResults.tsx](card-game-idle/src/ui/ascension/NullRaidResults.tsx)
  - Results / completion screen for Null Raid.

- [card-game-idle/src/ui/ascension/CoopRaidInviteModal.tsx](card-game-idle/src/ui/ascension/CoopRaidInviteModal.tsx)
  - Invite modal for Null Raid co-op sessions.

- [card-game-idle/src/ui/ascension/nullRaidArt.ts](card-game-idle/src/ui/ascension/nullRaidArt.ts)
  - Null Raid visual asset lookup.

### Runtime/data references

- [card-game-idle/src/data/ascension/nullRaidDefinitions.ts](card-game-idle/src/data/ascension/nullRaidDefinitions.ts)
  - Null Raid boss metadata, encounter progression, damage goals, unlock thresholds.

- [card-game-idle/src/state/store.ts](card-game-idle/src/state/store.ts)
  - Contains the Null Raid lifecycle functions:
    - `startNullRaid`
    - `startNullRaidProveYourself`
    - `recordNullRaidClear`
    - `finalizeNullRaidAngelOutcome`
  - Also contains Null Raid encounter bookkeeping in boss-fight state.

- [card-game-idle/src/state/coopRaidStore.ts](card-game-idle/src/state/coopRaidStore.ts)
  - Co-op raid infrastructure tied directly to Null Raid.

- [card-game-idle/src/net/coopEvents.ts](card-game-idle/src/net/coopEvents.ts)
  - Event wiring for multiplayer raid invite flows.

- [card-game-idle/src/types/bossFight.ts](card-game-idle/src/types/bossFight.ts)
  - Null raid boss-fight fields such as `nullRaidId`, `nullRaidEncounterBossIds`, `nullRaidAccumulatedEntropy`, and `nullRaidBestDamageFirstMinute`.

- [card-game-idle/src/types/game.ts](card-game-idle/src/types/game.ts)
  - Save schema fields for null raid cooldowns, clears, prove-unlocks, and angel streaks.

- [card-game-idle/src/data/profile/titleBadges.ts](card-game-idle/src/data/profile/titleBadges.ts)
  - Tracks total Null Raid clears in badge unlock logic.

### Save compatibility / migration references

- [card-game-idle/src/save/SaveManager.ts](card-game-idle/src/save/SaveManager.ts)
  - Preserves legacy Null Raid values in migration logic.
  - Must be kept stable during Phase 2 and Phase 3 to avoid save breakage.

## Confirmed dead / legacy art and asset cluster

These are the assets that appear to be dedicated to Null Raid and should be considered for removal after the app no longer references them.

### Public art assets

- [card-game-idle/public/assets/enigma-banners/to-amplify-the-nullitude.png](card-game-idle/public/assets/enigma-banners/to-amplify-the-nullitude.png)
- [card-game-idle/public/assets/enigma-banners/null-surged.png](card-game-idle/public/assets/enigma-banners/null-surged.png)
- [card-game-idle/public/assets/dungeons/valley-of-null.png](card-game-idle/public/assets/dungeons/valley-of-null.png)
- [card-game-idle/public/assets/dungeons/items/nullified-oblivion-matter.png](card-game-idle/public/assets/dungeons/items/nullified-oblivion-matter.png)
- [card-game-idle/public/assets/dungeons/items/nullified-lattice.png](card-game-idle/public/assets/dungeons/items/nullified-lattice.png)
- [card-game-idle/public/assets/dungeons/items/null-seared-light.png](card-game-idle/public/assets/dungeons/items/null-seared-light.png)
- [card-game-idle/public/assets/ability-icons/nullified-barricade.png](card-game-idle/public/assets/ability-icons/nullified-barricade.png)
- [card-game-idle/public/assets/ability-icons/null-horizon.png](card-game-idle/public/assets/ability-icons/null-horizon.png)
- [card-game-idle/public/assets/pack-art/ascension-imports/verdant-null-last-wish-executioner.png](card-game-idle/public/assets/pack-art/ascension-imports/verdant-null-last-wish-executioner.png)
- [card-game-idle/public/assets/pack-art/ascension-imports/pyraxis-nullstar-sovereign.png](card-game-idle/public/assets/pack-art/ascension-imports/pyraxis-nullstar-sovereign.png)

### Card background art likely tied to the Null theme

- [card-game-idle/public/assets/card-backgrounds/neutrality/Celestial Null.png](card-game-idle/public/assets/card-backgrounds/neutrality/Celestial%20Null.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/Eternal Null.png](card-game-idle/public/assets/card-backgrounds/neutrality/Eternal%20Null.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/Null Catalyst.png](card-game-idle/public/assets/card-backgrounds/neutrality/Null%20Catalyst.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/Null Entropy.png](card-game-idle/public/assets/card-backgrounds/neutrality/Null%20Entropy.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/Null Convergence.png](card-game-idle/public/assets/card-backgrounds/neutrality/Null%20Convergence.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/Null Compass.png](card-game-idle/public/assets/card-backgrounds/neutrality/Null%20Compass.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/Null Catechism.png](card-game-idle/public/assets/card-backgrounds/neutrality/Null%20Catechism.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/Null Seek.png](card-game-idle/public/assets/card-backgrounds/neutrality/Null%20Seek.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/Null Fortification.png](card-game-idle/public/assets/card-backgrounds/neutrality/Null%20Fortification.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/Null Sentinel.png](card-game-idle/public/assets/card-backgrounds/neutrality/Null%20Sentinel.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/Null Seraphim.png](card-game-idle/public/assets/card-backgrounds/neutrality/Null%20Seraphim.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/Null Veil.png](card-game-idle/public/assets/card-backgrounds/neutrality/Null%20Veil.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/Null Sovereign.png](card-game-idle/public/assets/card-backgrounds/neutrality/Null%20Sovereign.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/Nullfall.png](card-game-idle/public/assets/card-backgrounds/neutrality/Nullfall.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/Nullfire Seraph.png](card-game-idle/public/assets/card-backgrounds/neutrality/Nullfire%20Seraph.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/The Absolute Null.png](card-game-idle/public/assets/card-backgrounds/neutrality/The%20Absolute%20Null.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/Starbound Null Archangel.png](card-game-idle/public/assets/card-backgrounds/neutrality/Starbound%20Null%20Archangel.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/The Eternal Null Boss Art.png](card-game-idle/public/assets/card-backgrounds/neutrality/The%20Eternal%20Null%20Boss%20Art.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/The Null Verdict.png](card-game-idle/public/assets/card-backgrounds/neutrality/The%20Null%20Verdict.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/The Null Verdict of Stars.png](card-game-idle/public/assets/card-backgrounds/neutrality/The%20Null%20Verdict%20of%20Stars.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/Verdant Null, Last Wish Executioner.png](card-game-idle/public/assets/card-backgrounds/neutrality/Verdant%20Null,%20Last%20Wish%20Executioner.png)
- [card-game-idle/public/assets/card-backgrounds/neutrality/The White Null.png](card-game-idle/public/assets/card-backgrounds/neutrality/The%20White%20Null.png)
- [card-game-idle/public/assets/card-backgrounds/infinite/Null Apex.png](card-game-idle/public/assets/card-backgrounds/infinite/Null%20Apex.png)

### Database / supabase legacy cluster

- [card-game-idle/supabase/migrations/0009_coop_raids.sql](card-game-idle/supabase/migrations/0009_coop_raids.sql)
- [card-game-idle/supabase/migrations/0022_coop_raids_party.sql](card-game-idle/supabase/migrations/0022_coop_raids_party.sql)

These are migration artifacts related to co-op raid infrastructure and should be considered in the dead-file cleanup only after app usage is removed.

## Phase 1 checklist

- [ ] Confirm the active Null Raid UI list above is the exact scope to remove in Phase 2.
- [ ] Confirm the store-level Null Raid functions are the exact scope to guard in Phase 3.
- [ ] Confirm the legacy save fields and migration code stay intact until Phase 3 completes.
- [ ] Confirm the asset list above remains a dead-file cut list and not an active art dependency list.
- [ ] Confirm Phase 4 is limited to deleting the dead legacy files only after the active references are gone.
- [ ] Confirm Phase 5 is the final validation pass and cleanup closure.

## Notes for next phase

Phase 2 should remove only the user-facing Null Raid exposure and the direct entry points, while leaving the legacy save schema and migration code in place. Once those UI references are gone, Phase 3 can begin the function guards and runtime no-ops. Only then should Phase 4 proceed with deleting the dead Null Raid files and associated art.
