# State And Store

`src/state/store.ts` is the authoritative gameplay state machine. It owns deck zones, board slots, turn state, boss/raid context, progression, settings, and gameplay actions.

## Store Actions

Key card actions include:

- `beginTurn()`
- `toggleMulliganCard(instanceId)`
- `confirmMulligan()`
- `playCard(instanceId, side)` where `side` is `'soph'` or `'ain'`
- `flipSoph(instanceId, 'flip' | 'sacrifice')`
- `activateLightAinAttack(instanceId)`
- `activateLightSophAttack(instanceId, spend?)`
- `activateDark(instanceId)`
- `summonAinSophAur(definitionId, materialInstanceIds, targetSlot)`
- `activateAsaBridge(instanceId, spend?)`
- `forceRemoveBoardCard(instanceId)`
- `resolvePending(selected)`

React components call these actions; they do not directly mutate gameplay state.

## State Categories

- Deck: `deckList`, `extraDeck`, `hand`, `drawPile`, `discardPile`.
- Board: four front slots for Ain Soph Aur, four support/back slots for Light/Dark.
- Turn: phase, cards played, Limitless Light Stacks, pending effects, cooldowns, mulligan state.
- Progress: collection, holo collection, mastery, quests, achievements, enigmas, boss stats.
- Settings: UI display preferences, controls, audio, accessibility.

## Guard-First Transactions

Every action validates phase, card existence, definition type, costs, cooldowns, and target slots before committing mutation. UI disabled states are convenience only; the store is the trust boundary.

Transactional examples:

- Dark activation commits stack spending only after the effect can resolve.
- Ain Soph Aur summoning validates materials, Extra Deck ownership, front-slot availability, and on-summon effects before consuming materials.
- Force-removal works only during the playing phase.

## Deck Invariants

Ain Soph Aur cards belong in `deck.extraDeck`. If they leak into hand/draw/discard through old saves or cleanup, `enforceAngelExtraDeckInvariant` moves them back to the Extra Deck and can refill hand gaps.

Main-deck Light/Dark cards cycle through hand, draw pile, discard pile, and support board slots.

## Derived State

Use `recompute(s)` after mutations that affect board or progression-derived stats. Collection Power comes from `computeGlobalResonanceScore(progress)` and scales all Divine Light grants through the central grant path.
