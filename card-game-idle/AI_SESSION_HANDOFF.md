# AI Session Handoff

This file is the compact source of truth for the current project state. Use it for the next chat session instead of reconstructing the entire recent history.

## Verified status

Fresh validation was run on the current working tree:

- `npm run typecheck:tests` ✅
- `npm test -- --run` ✅ (27 test files / 166 tests passed)
- `npm run build` ✅

## Current design state

- The player-facing primary currency remains Divine Light.
- Causality is designed around a repeatable Limitless Cosmos loop: generate, convert, hold, and spend Cosmos for utility and Divine Light gain.
- The Causality deck should reward conversion from Limitless Light into useful Cosmos payoff lines rather than dead one-off effects.
- Card appearance is treated as a single source of truth across board, store, collection, rewards, deck builder, and pack views.
- `Shatter the Light` now wipes the board correctly when the finisher resolves, and the active window remains at 10 seconds with a slightly longer star lifetime.
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
- `src/ui/cardStatSummary.ts`

## Working rules for future chats

1. Do not restart from scratch: read this handoff, then the docs, then the exact files touched by the task.
2. Do not claim a fix as complete without fresh verification output.
3. Keep summaries short and file-backed rather than large threaded context.
4. Preserve the source-of-truth model: if a fact matters long-term, write it down in a file.
5. When a task crosses gameplay/UI boundaries, run focused tests first and then the full validation gate.

## Recommended next-chat prompt

"Read the current handoff and project rules, then continue from the verified state. Keep the scope narrow, preserve the source-of-truth rules, and confirm any new changes with relevant verification before claiming completion."
