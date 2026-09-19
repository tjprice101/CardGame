# AI Session Handoff

This file is the compact source of truth for the current project state. Use it for the next chat session instead of reconstructing the entire recent history.

## Verified status

Fresh validation was run on the current working tree:

- `npm run typecheck:tests` ✅
- `npm test -- --run` ✅ (full suite was last verified before the latest focused Enigma regression additions)
- `npm run build` ✅

## Current design state

- The player-facing primary currency remains Divine Light.
- Causality is designed around a repeatable Limitless Cosmos loop: generate, convert, hold, and spend Cosmos for utility and Divine Light gain.
- The Causality deck should reward conversion from Limitless Light into useful Cosmos payoff lines rather than dead one-off effects.
- Causality materialized abilities are implemented and live in the ability registry/shop: Author the First Cause, Causal Cartography, Pearlescent Mandate, Archive of Elsewhen, Final Cause, and Infinite Manuscript. They use the existing three-slot saved deck loadout, Causality ownership gates, Cosmos/Light Stack costs, cooldown timestamps, and focused runtime tests.
- Card appearance is a single source of truth. Live turn surfaces use `getLiveCardFaceBackgroundStyle` plus `getLiveCardShimmerClassName`; hand, board, collection, deck builder, rewards, pending-search modals, and profile cards share the same composed art/foil layers. Holofoil animation is a full-card inverted metallic field, never a basic white line. Face-down Soph cards show only the card backing plus state badges, never front-face name/rules chrome.
- Ain, Soph, and Bridge attacks resolve through `AttackSequence`: store-owned delayed payout, paused encounter timers, and central OSU-style cursor orbit scoring. Orbit power increases only from sustained circular pointer motion around the center, is uncapped, and contributes directly to the attack multiplier. Legacy deterministic star/constellation data remains as visual guidance and a compatibility path.
- `Shatter the Infinite Light` uses a true 1.1-second fade to black before its detailed 10-second event-horizon orbit field. Full consistent cursor circles around the core create Limitless Infinity stacks worth 1,000 base Divine Light before Collection Power; vertical, straight, and random movement do not score. Resolution returns front-row Ain Soph Aur to the Extra Deck, returns back-row and discarded cards to the draw pile, preserves the hand, clears stacks/effects without advancing the turn, and staggers bosses while restoring their clock.
- Causality endgame content is implemented: five Eternity's Wake bosses and Eternal rewards, five playable Infinite cards with Causality-only recipes, and the four-encounter Rift of Causality dungeon with four dedicated materials.
- Final art filenames are wired for all new Causality cards, bosses, Rift cover, materials, ability icons, profile pictures, and Causality splash slots. Loose generated Causality art has been moved into runtime folders when present.
- Causality art prompts should use the splotched black-and-white illuminated-manuscript ink look as the current norm: distressed parchment/black ink, cobalt/navy/violet/cyan/magenta accents, dry-brush/splatter texture, and circular celestial-mechanical forms. Keep Causality-specific event-horizon/manuscript ideas for Causality; future sets may define their own aesthetic.
- Board information and Card-born Stacks share one left-side vertical HUD rail with layout-driven spacing.
- Collection Power is `1 + Resonance / 1000`, applied once. Its natural maximum is derived from `CardRegistry.getAll().length * 320`, so adding registered cards raises the cap automatically. Card-light is per-card XP; Resonance changes only when a Card-born Tier is crossed.
- The main menu uses a responsive Command Deck with Play, Collection, and Progress sections. One contextual artwork banner is featured at a time; all destinations remain available through their category and locked destinations stay visible with requirements.
- Enigma tracking is condition-based. Explicit one-turn, simultaneous, and end-turn requirements use the correct runtime scope; cumulative requirements use persisted progress counters and display live trackers in `EnigmaModal`. Never complete a step from generic board presence, an unrelated lifetime counter, or a stale progress snapshot.
- `Amplifier of the Void` is a persistent free Enigmatic Dark utility: draw 2 cards, gain 3 Limitless Light Stacks, then gain 1,500 Divine Light if the post-activation stack pool is at least 5.
- Causality enigma reward copies are set to 3 per reward.
- Challenges include two Super Weeklies: after all four weekly challenges are completed and claimed, the rotation can be consumed into two deterministic Eternity's Wake boss objectives. Each target completes independently and awards extra shards plus an additional boss reward card copy. Daily rewards are a persistent monthly catch-up calendar with shard, card, holofoil, and owned-card Card-light rewards.
- Card-born thresholds are reduced by 65%: 9, 26, 140, 525, 1,050, 2,100, 5,250, and 10,500 Card-light.
- UI summary text must stay in natural language and must not leak internal tokens or snake_case fields.

## Important files to read first

- `card-game-idle/CLAUDE.md`
- `card-game-idle/.github/copilot-instructions.md`
- `Gameplay Logistics/README.md`
- `src/state/store.ts`
- `src/systems/progression/EnigmaSystem.ts`
- `src/data/cards/causalityCards.ts`
- `src/data/cards/causalityInfiniteCards.ts`
- `src/systems/cards/AttackSequence.ts`
- `src/data/dungeons/gardenDungeonDefinitions.ts`
- `src/systems/progression/cardMastery.ts`
- `src/ui/cardBackgrounds.ts`
- `src/ui/menu/MainMenuHub.tsx`
- `src/data/abilities/abilityDefinitions.ts`
- `src/ui/cardStatSummary.ts`
- `Midjourney Art/Causality Ability Icon Prompts.md`
- `Midjourney Art/Causality Progression Rewards Prompts.md`

## Working rules for future chats

1. Do not restart from scratch: read this handoff, then the docs, then the exact files touched by the task.
2. Do not claim a fix as complete without fresh verification output.
3. Keep summaries short and file-backed rather than large threaded context.
4. Preserve the source-of-truth model: if a fact matters long-term, write it down in a file.
5. When a task crosses gameplay/UI boundaries, run focused tests first and then the full validation gate.

## Recommended next-chat prompt

"Read the current handoff and project rules, then continue from the verified state. Keep the scope narrow, preserve the source-of-truth rules, and confirm any new changes with relevant verification before claiming completion."
