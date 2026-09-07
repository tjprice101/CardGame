# State And Store

## The main store

`src/state/store.ts` is the main gameplay state machine. It owns the live deck, hand, discard pile, board, turn state, boss fight state, progression, and actions such as `playCard`, `summonAngel`, `activateSeraphimAttack`, and `resolvePending`.

The store is created with Zustand. Actions use Immer drafts:

```ts
set(state => {
  state.board.frontSlots[slot] = instance;
  state.turn.cardsPlayedThisTurn += 1;
});
```

Immer records the mutations and produces a new immutable snapshot for subscribers.

## Why one gameplay store

Board, hand, turn counters, passive effects, boss HP, and progression are coupled. A card play can change all of them. One authoritative store prevents half-applied transactions such as removing a card from hand without awarding its effect.

The social and multiplayer features use additional stores because chat, party membership, gifts, and invitations should not make the local board re-render.

## State categories

- **Deck state**: main deck, extra deck, hand, draw pile, discard pile.
- **Board state**: five front slots and four back slots.
- **Turn state**: phase, cards played, sequence multiplier, pending effect, cooldowns, Patience.
- **Progress state**: collection, mastery, quests, enigmas, boss statistics, unlock-derived progression.
- **Mode state**: normal play, boss fight, Null Raid, trial deck, PvP, or co-op context.

## Guard-first actions

A store action should reject invalid requests before mutation:

```ts
if (turn.phase !== 'playing') return;
const card = hand.find(...);
if (!card) return;
const definition = ScoreSystem.getDefinition(card.definitionId);
if (!definition) return;
```

This protects state invariants at the mutation boundary. UI controls may be disabled, but the store must still validate because actions can be called from hotkeys, tests, replay-like flows, or multiplayer messages.

## Selectors

React components should subscribe to the smallest useful slice of state. A board component should not subscribe to the entire store if it only needs board slots and one action. Stable fallback constants matter because returning a new array/object from a selector on every call can cause Zustand snapshot loops.
