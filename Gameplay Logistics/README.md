# Gameplay Logistics

This folder explains how Card Game Idle is built and how to reason about the code as if implementing it by hand.

## Reading order

1. [01-architecture-and-foundations.md](01-architecture-and-foundations.md)
2. [02-project-structure.md](02-project-structure.md)
3. [03-card-data-and-types.md](03-card-data-and-types.md)
4. [04-effect-system.md](04-effect-system.md)
5. [05-card-registry.md](05-card-registry.md)
6. [06-state-and-store.md](06-state-and-store.md)
7. [07-card-play-lifecycle.md](07-card-play-lifecycle.md)
8. [08-turns-attacks-and-limitless-light.md](08-turns-attacks-and-limitless-light.md)
9. [09-save-and-migrations.md](09-save-and-migrations.md)
10. [10-ui-and-card-text.md](10-ui-and-card-text.md)
11. [11-progression-and-challenges.md](11-progression-and-challenges.md)
12. [12-netplay-and-desktop.md](12-netplay-and-desktop.md)
13. [13-testing-and-build-workflow.md](13-testing-and-build-workflow.md)

These are explanatory documents, not runtime source files. When behavior changes, update the relevant guide so future work has the same mental model.

## Latest Iteration Notes

- Causality is now treated as a coherent `Limitless Cosmos` engine: cards are authored to generate, convert, hold, and spend Cosmos in a beneficial loop, with the deck encouraging conversion from Limitless Light into stronger ongoing utility and Divine Light payoffs.
- Enigma tracking was corrected to use actual condition checks instead of generic board presence or lifetime counters. This applies to Neutrality and Causality enigmas alike.
- Ain, Soph, and Bridge attacks now use deterministic card-specific star sequences with delayed store-owned payout; Shatter uses its existing 10-second starfield. Their timers, multipliers, fades, and pause rules are documented in guides 07 and 08.
- Shatter now preserves the hand, returns front cards to the Extra Deck, and returns back-row/discard cards to the draw pile while retaining boss stagger and clock restoration.
- Causality endgame now includes five Wake bosses/Eternal rewards, five playable Infinite recipes, and Rift of Causality with four materials. Art prompts and final replacement filenames are in `Midjourney Art/Causality Endgame Expansion Prompts.md`.
- Live card appearance is unified through `getLiveCardFaceBackgroundStyle` and `getLiveCardShimmerClassName`: hand and board use identical art/foil composition, live foils use one lightweight shimmer, and face-down cards show only their backing plus state badges.
- Collection Power uses `1 + Resonance / 1000`, is applied once, and has a registry-derived natural maximum that rises automatically as cards are added.
- The main menu now uses a responsive Play / Collection / Progress Command Deck with a single contextual art banner instead of presenting every destination at once.
- Board statistics and Card-born Stacks share a flow-positioned left HUD rail so variable panel height cannot create overlap.
- The three abilities in `Card Effects/Causality/Causality Ability Drafts.md` remain design-only and are not part of the runtime ability registry.
- Reward copy counts for Causality enigma rewards were increased to 3.
- The most recent validation pass in the working tree completed with `npm run typecheck:tests`, `npm test -- --run`, and `npm run build` all succeeding.
