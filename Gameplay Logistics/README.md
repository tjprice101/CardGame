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
- Enigma tracking is lock-on and scope-aware: the player chooses one unlocked manuscript to advance; one-turn, simultaneous-board, and end-turn requirements use their exact boundaries, while cumulative Causality card plays, Cosmos generated/consumed, Bridge attacks, and Twin-light summons use persisted counters displayed as live Enigma-panel trackers. Generic board presence, unrelated lifetime counters, and stale snapshots cannot complete steps.
- Amplifier of the Void is a persistent free Enigmatic Dark utility that draws 2 cards, grants 3 Limitless Light Stacks, and grants 1,500 Divine Light when the post-activation pool reaches 5 stacks.
- Ain, Soph, Bridge, and Shatter the Infinite Light use central cursor-orbit scoring with delayed store-owned payout. Only full, consistent circles score; vertical/straight/random movement does not. Attack timers, multipliers, fades, and pause rules are documented in guides 07 and 08.
- Shatter now preserves the hand, returns front cards to the Extra Deck, and returns back-row/discard cards to the draw pile while retaining boss stagger and clock restoration.
- Causality endgame now includes five Wake bosses/Eternal rewards, five playable Infinite recipes, and Rift of Causality with four materials. Art prompts and final replacement filenames are in `Midjourney Art/Causality Endgame Expansion Prompts.md`.
- Live card appearance is unified through `getLiveCardFaceBackgroundStyle` and `getLiveCardShimmerClassName`: hand, board, collection, deck builder, reward, pending-search, and profile surfaces use identical art/foil composition; holofoils use a full-card inverted metallic field; face-down cards show only their backing plus state badges.
- Base Causality and Transcendent card backs live in `public/assets/card-backgrounds/causality/Causality Card-backing.png` and `public/assets/card-backgrounds/infinite/Transcendant Card-backing.png`; `cardBackgrounds.ts` is the routing source of truth.
- Collection Power uses `1 + Resonance / 1000`, is applied once, and has a registry-derived natural maximum that rises automatically as cards are added.
- The main menu now uses a responsive Play / Collection / Progress Command Deck with a single contextual art banner instead of presenting every destination at once.
- Board statistics and Card-born Stacks share a flow-positioned left HUD rail so variable panel height cannot create overlap.
- Causality materialized abilities are implemented in the runtime ability registry and shop: two base-gated, two Eternal-gated, and two Infinite-gated abilities. Decks still equip only three total abilities.
- Two Super Weekly challenges are available after all weekly challenge rewards are claimed, consuming the weekly rotation into two deterministic Eternity's Wake boss objectives.
- The login reward is a persistent monthly calendar track with catch-up claims, base-card and holofoil card rewards, shards, and Card-light rewards for owned cards.
- Causality reward titles/achievements, profile pictures, reward themes, splash slots, and art prompts are implemented. Causality art prompts should follow the splotched illuminated-ink reference style unless a future set defines its own aesthetic.
- Enigma banner prompts follow the canonical `Midjourney Art/Splotched Ink Replacement Prompts.md` structure and style. Keep the shared high-contrast splotched ink treatment, but make each manuscript banner unique in subject, composition, symbol language, and controlled accent palette.
- Enigma and future Midjourney prompts must translate invented gameplay terms into recognizable visual language: winged celestial guardian for Ain Soph Aur, face-down charged sigil for Soph, radiant ivory energy for Light, and obsidian cosmic force for Dark.
- Reward copy counts for Causality enigma rewards were increased to 3.
- The most recent validation pass in the working tree completed with `npm run typecheck:tests`, `npm test -- --run`, and `npm run build` all succeeding.
