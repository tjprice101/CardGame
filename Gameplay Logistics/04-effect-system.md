# Effect System

## Effects are tagged data

`src/types/effects.ts` defines effect unions. An effect is a serializable object:

```ts
type ImmediateEffect =
  | { type: 'draw'; value: number }
  | { type: 'gain_oblivion'; value: number }
  | { type: 'patience_gain_all'; value: number };
```

The `type` property is the tag. A `switch (effect.type)` narrows the object to the correct fields.

## Why effects are not functions

A function stored inside a card definition would be difficult to serialize, inspect, test, and convert into readable rules text. Tagged data solves all four problems:

- Save systems can store it as JSON.
- The executor can interpret it consistently.
- Tests can construct effects without booting the UI.
- `src/ui/cardStatSummary.ts` can format the same data into English.

## The executor

`src/systems/cards/CardEffectExecutor.ts` is the interpreter. It receives a card and copies of the relevant turn, board, and deck state. It resolves each effect and returns a result such as:

```ts
{
  canPlay: true,
  turn,
  board,
  deck,
  oblivionBonus,
  pendingEffect,
}
```

The store adopts the result into the Immer draft and queues `pendingEffect` when the effect requires player input.

## Pending effects

Search, salvage, look-at-top, and discard-choice mechanics cannot finish in one synchronous function call. The executor returns a serializable pending-effect description. The UI opens a picker, then calls `resolvePending(selected)` in the store.

This is a continuation pattern: the state records what is waiting, the UI collects input, and the store resumes the rules with validated selections.

## Dynamic effects

A few cards depend on live state. The project uses a sentinel value such as `value: 0` and computes the real value in a definition-specific runtime path. This keeps ordinary cards declarative while allowing Collection Power, board totals, or Patience to affect outcomes.

When adding a dynamic card, update both the authored definition and the executor branch. Otherwise the card may display one value and execute another.

## Store boundary

The executor handles effect interpretation, but the store remains responsible for lifecycle operations that require the whole game context: removing the physical card, advancing play counters, ticking durability, ticking set-ability cooldowns, syncing enigmas, and checking boss defeat.
