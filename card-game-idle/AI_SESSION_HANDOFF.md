# AI Session Handoff

This file is the compact source of truth for the current project state. Use it for the next chat session instead of reconstructing the entire recent history.

## Verified status

Fresh validation was run on the current working tree:

- `npm run typecheck:tests` ✅
- `npm test -- --run` ✅ (29 test files / 174 tests passed)
- `npm run build` ✅

## Current design state

- The player-facing primary currency remains Divine Light.
- Causality is designed around a repeatable Limitless Cosmos loop: generate, convert, hold, and spend Cosmos for utility and Divine Light gain.
- The Causality deck should reward conversion from Limitless Light into useful Cosmos payoff lines rather than dead one-off effects.
- The three Causality abilities in `Card Effects/Causality/Causality Ability Drafts.md` are design-only. They are not registered, purchasable, equippable, or executable. Do not describe them as implemented until definitions, state, validation, UI, assets, saves, and tests are wired.
- Card appearance is a single source of truth. Live turn surfaces use `getLiveCardFaceBackgroundStyle` plus `getLiveCardShimmerClassName`; hand and board share the same composed art/foil layers. Live foils use one lightweight shimmer, and face-down Soph cards show only the card backing plus state badges, never front-face name/rules chrome.
- Ain, Soph, and Bridge attacks now resolve through `AttackSequence`: deterministic per-definition star layouts, delayed validated payout, paused encounter timers, and progressive end-of-timer screen wash. Ain uses three stars over 3 seconds for ×2–×4; Soph uses five stars over 4 seconds for ×1.5–×5.5 and floats the card at center; Bridge uses an ordered three-to-five-star inverted constellation with the Soph multiplier ladder.
- `Shatter the Infinite Light` uses a true 1.1-second fade to black before its detailed 10-second starfield. Each Limitless Infinity stack grants 1,000 base Divine Light before Collection Power. Resolution returns front-row Ain Soph Aur to the Extra Deck, returns back-row and discarded cards to the draw pile, preserves the hand, clears stacks/effects without advancing the turn, and staggers bosses while restoring their clock.
- Causality endgame content is implemented: five Eternity's Wake bosses and Eternal rewards, five playable Infinite cards with Causality-only recipes, and the four-encounter Rift of Causality dungeon with four dedicated materials.
- Final art filenames are wired for all new Causality cards, bosses, Rift cover, and materials. Temporary existing-art copies prevent missing assets; replace them in place with outputs from `Midjourney Art/Causality Endgame Expansion Prompts.md`.
- Board information and Card-born Stacks share one left-side vertical HUD rail with layout-driven spacing.
- Collection Power is `1 + Resonance / 1000`, applied once. Its natural maximum is derived from `CardRegistry.getAll().length * 320`, so adding registered cards raises the cap automatically. Card-light is per-card XP; Resonance changes only when a Card-born Tier is crossed.
- The main menu uses a responsive Command Deck with Play, Collection, and Progress sections. One contextual artwork banner is featured at a time; all destinations remain available through their category and locked destinations stay visible with requirements.
- Enigma tracking is condition-based and turn-scoped; false positives from generic board presence or lifetime counters are not allowed.
- Causality enigma reward copies are set to 3 per reward.
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
- `Card Effects/Causality/Causality Ability Drafts.md`
- `src/ui/cardStatSummary.ts`

## Working rules for future chats

1. Do not restart from scratch: read this handoff, then the docs, then the exact files touched by the task.
2. Do not claim a fix as complete without fresh verification output.
3. Keep summaries short and file-backed rather than large threaded context.
4. Preserve the source-of-truth model: if a fact matters long-term, write it down in a file.
5. When a task crosses gameplay/UI boundaries, run focused tests first and then the full validation gate.

## Recommended next-chat prompt

"Read the current handoff and project rules, then continue from the verified state. Keep the scope narrow, preserve the source-of-truth rules, and confirm any new changes with relevant verification before claiming completion."
