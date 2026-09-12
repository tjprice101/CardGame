# Turns, Attacks, And Limitless Light

Patience-era Seraphim/Angel mechanics are retired. Current Neutrality gameplay uses Soph charge, Ain activity, Limitless Light Stacks, and Ain Soph Aur Bridge attacks.

## Board Geometry

```text
front:   [0] [1] [2] [3]    Ain Soph Aur
support: [0] [1] [2] [3]    Light/Dark as Soph or Ain
```

Front slots are for Extra Deck summons only. Support slots are for main-deck Light/Dark cards.

## Turn Phases

- `idle`: no active turn.
- `mulligan`: starting hand can be swapped.
- `playing`: cards can be placed, flipped, attacked, activated, summoned, or force-removed.

## Soph Charge

Each hand play adds +1 Limitless Charge to every face-down Soph card in the support row. At `SOPH_FLIP_CHARGE_REQUIRED = 2`, a Soph card can flip to Ain or be sacrificed.

Flipping adds the stored charge to `turn.limitlessLightStacks`. Sacrificing grants Divine Light based on stored charge and the card's sacrifice rate.

## Attacks And Cooldowns

Cooldowns are measured in cards played from hand, not seconds or turns. `tickHandPlayCooldowns` is the canonical decrement point.

Light cards have:

- Ain Attack: reads stacks without consuming them.
- Soph Attack: may consume stacks, with payout computed from the pre-spend pool.

Ain Soph Aur cards have:

- On-summon stack gain: every successful summon grants +1 Limitless Light Stack.
- Bridge the Light: optional stack cost, triune scaling, and cooldown. The consumed stack cost is deducted and is not added back to the Divine Light payout.

Dark cards have utility activations rather than attacks. Persistent premium Dark cards use cooldowns; one-shot Dark cards leave the board after activation.

## Triune Scaling

Triune scaling reads three sources:

- Limitless Light Stacks.
- Number of front-row Ain Soph Aur cards.
- Collection Power.

UI previews and runtime grants should use the same `resolveCardScaling` inputs.

## Collection Power

All Divine Light grants flow through the central grant path, which scales by Collection Power. Do not add local ad hoc currency increments for card actions.
