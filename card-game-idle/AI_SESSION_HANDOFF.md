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
- `Shatter the Infinite Light` uses a true 1.1-second fade to black before its detailed starfield appears. Its active click window lasts 10 seconds and each Limitless Infinity stack grants 1,000 base Divine Light before Collection Power. Resolution discards the field and hand, reshuffles discard, clears stacks/effects, does not draw or advance the turn, and staggers bosses while restoring their clock.
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
