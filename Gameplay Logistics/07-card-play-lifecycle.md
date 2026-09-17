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
- Sacrifice the card, converting a percentage of stored charge into Limitless Light Stacks based on `sacrificeStackRate`, then moving it to discard.

Light `onFlipEffects` are supported through the effect executor if future Light cards define them.

Light `sophPlacementEffects` resolve when a Light card is placed face-down as Soph. Eternal and Infinite Light cards use these effects for stronger, card-specific placement identities.

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

Bridge the Light uses `activateAsaBridge` to validate and reserve optional stack costs and compute triune scaling. The resulting `attackSequence` grants Divine Light and starts cooldown only after the ordered constellation resolves.

Attack actions now reserve costs and create `turn.attackSequence`; payout and cooldown are committed only when the sequence reaches result. `AttackSequenceOverlay` owns presentation while `registerAttackSequenceStarHit` and `tickAttackSequence` revalidate star IDs/order and resolve the award once.

## Shatter The Infinite Light Lifecycle

`canActivateShatterTheInfiniteLight` unlocks the finisher only when all four front slots contain Ain Soph Aur and all four back slots contain Light/Dark cards already flipped to `side: 'ain'` and `faceState: 'front'`.

`activateShatterTheInfiniteLight` starts a three-phase sequence:

1. `priming`: the arena fades completely to black for 1.1 seconds; attack visuals remain hidden.
2. `active`: a 10-second starfield window accepts clicks. Each successful click adds one Limitless Infinity stack.
3. `result`: each stack grants 1,000 base Divine Light through the central Collection Power-scaled grant path, followed by a 2.6-second result reveal.

All gameplay mutations and encounter timers pause while the sequence is active. Resolution returns front-row Ain Soph Aur to the Extra Deck, returns back-row and discarded cards to the shuffled draw pile, preserves the hand, clears Light Stacks and board effects, and resets cards played this turn. It does not advance the turn or open a mulligan. In boss encounters it also triggers a stagger and restores the full encounter duration; in Battleground it restores the timer to 180 seconds.

## Force Removal

Right-click a field card to open force removal:

- Main-deck Light/Dark cards go to discard.
- Ain Soph Aur cards return to the Extra Deck.

This is available only during playing phase and is blocked while choosing summon materials.

## Pending Choices

Effects that require selection create pending effects. `PendingEffectModal` collects choices, and `resolvePending` validates them before moving cards or executing resolution effects.
