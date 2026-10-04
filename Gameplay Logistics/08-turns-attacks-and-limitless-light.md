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

## Spectrum Level

Each turn begins at Spectrum Level 0. Cards may be played or summoned only when their authored `spectrumLevel` is at or below the current level. Raising a level costs `5 + currentLevel` Limitless Light Stacks and one player-chosen hand card sacrificed to the Light-bound Abyss; the maximum is level 5. This level-up does not count as a card play. The Abyss returns to the deck only on a deck-zone reset (new turn, Garden encounter, or new fight/match). Phantom Matrix free summons may reach one level above current.

## Soph Charge

Each hand play adds +1 Limitless Charge to every face-down Soph card in the support row. At `SOPH_FLIP_CHARGE_REQUIRED = 2`, a Soph card can flip to Ain or be sacrificed.

Flipping adds the stored charge to `turn.limitlessLightStacks`. Sacrificing grants Divine Light based on stored charge and the card's sacrifice rate.

## Attacks And Cooldowns

Cooldowns are measured in cards played from hand, not seconds or turns. `tickHandPlayCooldowns` is the canonical decrement point.

Light cards have:

- Ain Attack: reads stacks without consuming them.
- Soph Attack: may consume stacks, with payout computed from the pre-spend pool.

## Limitless Inferno

Intensity has a separate uncapped turn resource, `turn.limitlessInfernoStacks`. `IntensityRuntime.ts` centralizes generation, next-positive-gain amplification, attack-pool selection, and reset. Level 3+ Intensity **Light Soph attacks** pay Inferno instead of Light Stacks; this includes qualifying Eternal and Infinite Light cards. Lower-level Light Soph attacks retain Light costs. Dark activations still pay their authored Light costs, and ASA summons/attacks never spend Inferno.

Intensity materialized abilities are the intentional exception: they may spend or reshape Inferno. Spending increments `intensityInfernoSpentThisTurn` for rekindling but does not emit a Light Stack spend event.

Card effects bank embers for subsequent Intensity hand plays, cycle cards to the bottom of the deck, recall the oldest matching discards, kindle from board composition or distinct discard identities, forge charge, amplify the next positive gain, react to generated/spent history, and temper the next Inferno Soph attack. Tempering is added once when the attack starts; the displayed cost is never added to payout. All card effects mutate tentative state, preserving atomic failure behavior.

Inferno, generated/spent history, banked embers, gain amplification, and tempered attack bonus reset at turn end and with fresh encounter/turn state. Loading a valid active turn preserves them; migration normalizes missing or invalid values. Shatter remains within the same turn, so it does not discard Inferno preparation.

The new Intensity achievement records are separate, permanent progress fields. Resolved card/ability effects add only the positive delta in turn-local generation/spending; Level 3+ Soph attack initiation records its actual Inferno cost once. `intensityBestTurnInferno` records the largest generated total in one turn, not the current pool after spending. These lifetime records survive boss snapshot restoration and exclude trial decks.

Ain Soph Aur cards have:

- On-summon stack gain: every successful summon grants +1 Limitless Light Stack.
- Bridge the Light: optional stack cost, authored scaling inputs, and cooldown. The consumed stack cost is deducted and is not added back to the Divine Light payout.

Dark cards have utility activations rather than attacks. Persistent premium Dark cards use cooldowns; one-shot Dark cards leave the board after activation.

## Attack Scaling

Attack definitions declare their reads in `CardScalingExpr`, currently Limitless Light Stacks, front-row Ain Soph Aur count, or Collection Power. Previews and runtime use the same declared expression. Transcendent materialized abilities do not use Cosmos, Causality cooldowns, or set-specific scaling.

## Interactive Attack Sequences

- Ain, Soph, and Bridge attacks use a central OSU-style cursor orbit. Move the pointer in sustained circular motion around the center ring to build orbit power before the timer expires.
- Orbit power is uncapped and feeds directly into the final multiplier. Faster clean rotations can keep increasing payout; random movement, straight-line movement, jitter, and direction changes do not score.
- Ain and Soph use the dark attack field. Soph also floats the attacking card at center. Bridge uses the white inverted field with red-pink celestial guidance and keeps the result screen white.
- Deterministic star/constellation data remains as visual guidance and compatibility data, but the primary scoring action is circular pointer motion.
- Payouts resolve once through the store when the sequence reaches result. Board actions and encounter timers pause until resolution.

## Shatter The Infinite Light

Shatter the Infinite Light is the full-board finisher. It becomes available only when all four front slots contain Ain Soph Aur and all four support slots contain Light/Dark cards already flipped to their active Ain side.

- Priming fades the screen fully to black for 1.1 seconds before attack visuals begin.
- At activation, snapshot the sum of every on-board Light card's current Soph attack and every on-board ASA's Bridge attack, using the same base-payout helper as real attacks. Include printed stack/ASA/Collection Power scaling and current Intensity tempered bonuses; Dark utilities contribute no attack value. Cooldowns and affordability do not exclude cards, and no attack costs are consumed.
- The active phase lasts 10 seconds. Smooth circles build continuous orbit power; completed revolutions also update the displayed Limitless Infinity counter.
- Resolution grants `snapshot * (1 + orbitPower)` through the central grant path, which applies Collection Power exactly once and preserves the normal +1% per front-row ASA bonus. Zero orbit still pays the full board total. Legacy click-stack counts do not add another payout multiplier.
- The snapshot remains fixed throughout the attack and across save reloads; old active saves without it reconstruct the value from their saved board.
- Board actions, cooldown ticks, and encounter timers pause for the whole sequence.
- Resolution returns front-row Ain Soph Aur to the Extra Deck, returns back-row and discarded cards to the draw pile, preserves the hand, and clears Limitless Light Stacks and board effects.
- The current turn remains active and no mulligan begins.
- During a boss encounter, resolution also triggers a Card-Break stagger and restores the encounter clock to its full duration. Battleground time resets to 180 seconds.

The three phases and durations live in `src/systems/cards/ShatterTheInfiniteLight.ts`. Store actions and aftermath resolution live in `src/state/store.ts`; the cutscene and click targets live in `src/ui/hud/ShatterInfiniteLightOverlay.tsx`.

## Boss HP Baseline

Eternity's Wake HP starts from `calculateNeutralityBossBaseline()` in `src/systems/bossDifficulty.ts`. The baseline reads the strongest available base Neutrality Light and Ain Soph Aur attacks, estimates both no-input and perfect-execution three-minute output under the current attack system, and places the first boss between those envelopes. The set-anchored boss curve then scales from that starting point, with Causality retaining its endgame category multiplier.

## Collection Power

All Divine Light grants flow through the central grant path, which scales by Collection Power. Do not add local ad hoc currency increments for card actions.
