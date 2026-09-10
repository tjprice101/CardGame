# Card Play Lifecycle

This guide describes the current Light/Dark/Ain Soph Aur runtime.

## Turn Start

`beginTurn()` prepares a turn, draws five cards, and enters mulligan unless a guided trial skips directly to play. `confirmMulligan()` swaps selected cards, refills the hand, and moves to `playing`.

## Main-Deck Placement

Hand controls are intentional:

- Left-click a Light or Dark card to place it face-down as Soph.
- Right-click a Light or Dark card to place it face-up as Ain.

Both sides occupy support/back slots. Playing from hand increments `cardsPlayedThisTurn`, ticks hand-play cooldowns, advances tutorial guide state, and recomputes board state.

## Soph Lifecycle

Soph cards are face-down and charge whenever cards are played from hand. The threshold is `SOPH_FLIP_CHARGE_REQUIRED = 2`.

At 2+ charge, `flipSoph` can:

- Flip to Ain, converting stored charge into Limitless Light Stacks.
- Sacrifice the card, granting Divine Light based on `sacrificeOblivionRate` and moving it to discard.

Light `onFlipEffects` are supported through the effect executor if future Light cards define them.

## Ain Lifecycle

Ain cards are face-up and active.

Light cards:

- `activateLightAinAttack` reads current Limitless Light Stacks, Ain Soph Aur count, and Collection Power for scaling.
- `activateLightSophAttack` can spend stacks, but scaling reads the pre-spend pool so paying the cost does not shrink the payout.

Dark cards:

- `activateDark` spends its activation cost only if the utility can resolve.
- One-shot Dark cards route to hand, draw deck, or discard based on `postActivationFate`.
- Persistent Dark cards remain in the support row and receive `cooldownCardsPlayed`.

## Ain Soph Aur Lifecycle

Ain Soph Aur cards live in the Extra Deck and summon to front slots.

Summoning requires:

1. Playing phase.
2. The card exists in the Extra Deck.
3. An empty front slot.
4. Exactly `summonMaterialCount` selected occupied back-row cards.
5. On-summon effects can resolve.

Materials are consumed only after validation succeeds. Every successful summon grants +1 Limitless Light Stack. On-summon effects grant Divine Light through the central grant path.

Bridge the Light uses `activateAsaBridge`, applies optional stack costs, computes triune scaling, grants Divine Light, and starts cooldown.

## Force Removal

Right-click a field card to open force removal:

- Main-deck Light/Dark cards go to discard.
- Ain Soph Aur cards return to the Extra Deck.

This is available only during playing phase and is blocked while choosing summon materials.

## Pending Choices

Effects that require selection create pending effects. `PendingEffectModal` collects choices, and `resolvePending` validates them before moving cards or executing resolution effects.
