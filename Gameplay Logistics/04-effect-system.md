# Effect System

Effects are serializable tagged data from `src/types/effects.ts`. They are interpreted by `src/systems/cards/CardEffectExecutor.ts` and displayed by `src/ui/cardStatSummary.ts`.

## Why Effects Are Data

Effects must be save-safe, inspectable, testable, and readable. Do not put functions inside card definitions. A card definition should describe behavior; the executor and store perform behavior.

## Supported Effect Families

The executor currently handles:

- Divine Light effects: `oblivion_flat`, `score_flat`, `score_multiplier`.
- Draw/discard effects: `draw`, `discard_choice`, `discard_draw`.
- Deck manipulation: `shuffle_discard`, `look_top_take`, `look_top_take_drop`, `look_top_take_type`, `search_deck_by_type`, `search_deck_distinct_types`.
- Discard recovery: `salvage_by_type`, `salvage_by_type_count`, `salvage_any`, `salvage_by_id`.
- Branching: `conditional`.

The executor has an exhaustive switch. Adding an effect type without a handler should fail TypeScript.

## Pending Effects

Some effects require player selection. The executor returns pending-effect objects for the UI and store to resolve:

- `discard_choice`
- `look_top_take`
- `look_top_take_drop`
- `look_top_take_type`
- `search_deck`
- `salvage`
- `embrace_infinite`

`PendingEffectModal` renders the selection. `store.resolvePending(selected)` validates IDs, counts, filters, and distinct-type constraints before mutating state.

## Store Boundary

The store remains responsible for whole-game lifecycle work:

- Moving cards between hand, board, draw pile, discard pile, and Extra Deck.
- Spending Limitless Light Stacks.
- Applying cooldowns.
- Granting Divine Light through the central grant path.
- Queueing pending effects.
- Recomputing derived stats.
- Emitting quest and mastery progress.

Do not let UI components apply effect results directly.

## Atomicity Rules

Costs should not be paid unless the action can resolve. Dark activation now applies the proposed post-cost turn to the executor and commits only if the executor returns `canPlay: true`. Summoning also validates and executes against a proposed next state before consuming materials.

## Display Rules

Card text should describe mechanics in player language. Use Divine Light in UI and docs even when internal keys still use `oblivion`. Format effect tags through `cardStatSummary.ts`; never leak snake_case tags to players.
