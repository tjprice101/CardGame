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
- `Shatter the Light` now wipes the board correctly when the finisher resolves, and its active duration was lengthened to 10 seconds with slightly longer star persistence.
- The card appearance source of truth is now consistent across all display surfaces. Collections, deck builders, pack openings, board placement, and reward screens should all present the same card face and art treatment.
- Reward copy counts for Causality enigma rewards were increased to 3.
- The most recent validation pass in the working tree completed with `npm run typecheck:tests`, `npm test -- --run`, and `npm run build` all succeeding.
