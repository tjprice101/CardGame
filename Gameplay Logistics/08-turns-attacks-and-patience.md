# Turns, Attacks, And Patience

## Board geometry

The board has five front slots and four staggered back slots:

```text
front: [0] [1] [2] [3] [4]
back:    [0] [1] [2] [3]
```

Back slot `i` is adjacent to front slots `i` and `i + 1`.

## Cooldowns

Attack cooldowns and set-ability cooldowns are measured in cards played from hand, not seconds or turns. `tickHandPlayCooldowns` is the canonical decrement point for set abilities. Each unit stores attack cooldowns by attack ID.

Both Seraphim and Angel attacks enforce a one-card minimum post-fire cooldown so reductions cannot create immediate infinite refire loops.

## Attack resolution

A Seraphim has unsynergized and synergized attacks. An Angel has primary and exalted attacks. The runtime checks:

1. Unit exists on the board.
2. Attack exists on its definition.
3. Cooldown is ready.
4. Required board condition is satisfied.
5. Costs are explicitly paid.
6. Base Divine Light and modifiers are calculated.
7. Boss damage, sequence effects, and Patience payoff are applied.
8. Cooldown is reset with the minimum floor.

Discard-cost attacks require an explicit payment selection. The store must not guess which cards to discard.

## Neutrality Patience

Patience is the live Neutrality core mechanic.

- Each qualifying front-row unit gains Patience as cards are played.
- Adjacent Neutrality Cherubim can add more per-card Patience.
- Attacks consume the unit's stored Patience.
- Each stack contributes Divine Light on attack according to the card's authored scaling.
- A threshold can also trigger bonus draws.
- Patience is hard-capped at 150 per unit.

The removed Patient Light, Equilibrium Sigils, Marked Cards, Linked Gain, Timer Pause, uncapped-gain, and Infinite signature systems must not be reintroduced as accidental dependencies.

## Derived state

Synergy and computed stats are recalculated after mutations that change the board or relevant resources. Derived values should not be treated as the canonical save source unless the save schema explicitly requires them; they can usually be recomputed from definitions and instances.
