# Neutrality Card Effects

This is the live Neutrality card model. Older Seraphim, Cherubim, Ophanim, Angel, and Patience-era card text is retired.

## Base Set Counts

The Neutrality pack pool contains 52 live base cards:

- 24 Light cards.
- 24 Dark cards.
- 4 Ain Soph Aur cards.

Premium Neutrality cards are awarded outside packs:

- Enigmatic: Enigma rewards.
- Eternal: Eternity's Wake rewards.
- Transcendent: Null Raid progression.
- Infinite: Infinitude crafts.

Valley of Null is the Neutrality Garden expedition. Nullified Lattice, Null-seared Light, and Nullified Oblivion-matter are Neutrality crafting materials, not universal currencies for future card sets.

## Light Cards

Light cards can be placed as Soph or Ain.

- Soph side: face-down, charges by +1 whenever a hand card is played.
- At 2+ charge, Soph can flip to Ain and bank its charge as Limitless Light Stacks, or sacrifice to convert a percentage of its stored charge into Limitless Light Stacks.
- Each Light card has a distinct Soph-placement effect that resolves when it is placed face-down.
- Ain side: uses Ain Attack and Soph Attack.
- Ain Attack reads stacks without spending them.
- Soph Attack may spend stacks; payout uses the pre-spend stack pool.

All Light attacks use authored base Divine Light, cooldown, and scaling data. Triune scaling reads Limitless Light Stacks, front-row Ain Soph Aur count, and Collection Power.

## Ability System

Ability Materialization contains seven Neutrality abilities with authored purchase costs and ownership gates. A deck may equip three across slots 1-3. Ability Amplification displays and activates the equipped abilities during a turn.

- Neutralizing Inferno discards one main-deck card and grants Divine Light equal to current Limitless Light Stacks multiplied by 500. It has a 30-second cooldown.
- Nullified Barricade spends 5 Limitless Light Stacks to grant Divine Field for 60 seconds. Each card played during the field grants 50 Divine Light.
- Phantom Matrix spends 10 Limitless Light Stacks and opens a player-selected free ASA summon from the Extra Deck.
- Null Horizon spends 15 Limitless Light Stacks to reduce every active card cooldown by 2.
- Axiomatic Reversal discards 2 cards to grant 50,000 Divine Light and draw 1 card.
- Whiteout Domain spends 20 Limitless Light Stacks to grant its 45-second card-play bonus.
- Infinite Accord spends 30 Limitless Light Stacks to restore Light attack cooldowns and grant 10,000 Divine Light.

## Dark Cards

Dark cards can be placed as Soph or Ain.

- Soph side: charges like any main-deck card and can flip or sacrifice at 2+ charge.
- Ain side: activates utility effects.
- One-shot Dark cards leave after activation and return to hand, deck, or discard according to `postActivationFate`.
- Persistent Dark cards remain on the board and use cooldowns.

Activation-cost policy:

- Most base one-shot Dark utilities cost 0 Limitless Light Stacks.
- Strong base Legendary utilities may cost 1.
- Eternal Dark cards currently cost 2.
- Persistent Enigmatic utilities are authored individually; Amplifier of the Void costs 0 and remains on the board with cooldown.

Amplifier of the Void draws 2 cards and grants 3 Limitless Light Stacks. If the post-activation pool reaches 5 stacks, it grants an additional 1,500 Divine Light.
- Persistent Transcendent utilities currently cost 3-4.

Dark activations are atomic: if a target-dependent effect cannot resolve, stacks are not spent and the card stays in place.

## Ain Soph Aur Cards

Ain Soph Aur cards live in the Extra Deck and summon to front slots.

- They require `summonMaterialCount` occupied back-row cards.
- Materials can be Light or Dark, Soph or Ain.
- Every successful summon grants +1 Limitless Light Stack.
- Summoning grants `onSummonEffects` such as Divine Light.
- Bridge the Light is the canonical attack field: `bridgeAttack`.
- Bridge can consume stacks, grants Divine Light, and applies cooldown.

The White Null requires any one back-row card. It does not require a specific card ID.

## UI Requirements

- Hand left-click: place Soph.
- Hand right-click: place Ain.
- Extra Deck click: begin summon-material selection.
- Ready Ain Soph Aur cards glow white in Extra Deck view.
- Eligible summon materials glow white; selected materials glow green.
- Field card right-click opens force removal.
- Hover details appear in the right-rail Card Inspector.
- Card faces use shared art, top ribbon, and bottom rules panel unless `cardArtDisplay` changes that.
