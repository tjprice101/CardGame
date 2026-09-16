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

## Shatter The Infinite Light

Shatter the Infinite Light is the full-board finisher. It becomes available only when all four front slots contain Ain Soph Aur and all four support slots contain Light/Dark cards already flipped to their active Ain side.

- Priming fades the screen fully to black for 1.1 seconds before attack visuals begin.
- The active phase lasts 10 seconds. Each clicked glowing star adds one Limitless Infinity stack.
- Resolution grants `stacks * 1,000` base Divine Light through the normal Collection Power-scaled grant path.
- Board actions, cooldown ticks, and encounter timers pause for the whole sequence.
- Resolution sends the field and hand to discard, reshuffles discard into the draw pile, and clears Limitless Light Stacks and board effects.
- The current turn remains active, but no replacement hand is drawn and no mulligan begins.
- During a boss encounter, resolution also triggers a Card-Break stagger and restores the encounter clock to its full duration. Battleground time resets to 180 seconds.

The three phases and durations live in `src/systems/cards/ShatterTheInfiniteLight.ts`. Store actions and aftermath resolution live in `src/state/store.ts`; the cutscene and click targets live in `src/ui/hud/ShatterInfiniteLightOverlay.tsx`.

## Collection Power

All Divine Light grants flow through the central grant path, which scales by Collection Power. Do not add local ad hoc currency increments for card actions.
