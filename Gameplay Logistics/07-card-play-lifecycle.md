# Card Play Lifecycle

This is the most important hand-written workflow in the game.

## General sequence

A valid play generally follows:

```text
guard phase and card
  -> resolve definition
  -> place or execute card
  -> recompute board relationships
  -> award ordinary play Oblivion
  -> apply passives
  -> tick durability and hand-play cooldowns
  -> execute card-specific effects
  -> queue pending choices
  -> remove card / record play
  -> sync progression and enigmas
  -> check boss defeat
  -> recompute derived state
```

The exact order varies by card type because a Seraphim must exist on the board before adjacency and synergy can be calculated, while an Ophanim never enters a board slot.

## Seraphim path

In `playCard`:

1. Find an empty front slot.
2. Construct a `SeraphimInstance` from the hand card.
3. Place it in `frontSlots`.
4. Recompute active synergy.
5. Award ordinary play Oblivion.
6. Apply Cherubim passives.
7. Tick Cherubim durability.
8. Tick set-ability cooldowns.
9. Execute `onPlayEffects`.
10. Adopt executor results and queue pending choices.
11. Remove the physical card from hand.
12. Record mastery/play statistics.
13. Sync Enigma progress.
14. Check the boss defeat condition.

Placement precedes passives because a newly placed Seraphim may be adjacent to a Cherubim.

## Cherubim path

A Cherubim is placed in a back slot, its durability is initialized, and its immediate effects execute. It counts as a card play for turn counters and cooldowns. The resulting pending effect must be propagated because searching or salvage can require a picker.

## Ophanim path

An Ophanim has no board instance. The executor runs its immediate effects, then the store awards play Oblivion, applies passives, ticks durability and cooldowns, removes the card, records the play, and checks progression.

## Why helpers are shared

`tickCherubimDurability` and `tickHandPlayCooldowns` are called at every hand-play site. They are functions rather than duplicated inline code so a new play path cannot quietly diverge from the others.

Forgetting either call causes subtle bugs: Cherubim last too long, or hotkey set abilities never become ready.
