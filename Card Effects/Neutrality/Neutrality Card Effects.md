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

## Light Cards

Light cards can be placed as Soph or Ain.

- Soph side: face-down, charges by +1 whenever a hand card is played.
- At 2+ charge, Soph can flip to Ain and bank its charge as Limitless Light Stacks, or sacrifice for Divine Light.
- Ain side: uses Ain Attack and Soph Attack.
- Ain Attack reads stacks without spending them.
- Soph Attack may spend stacks; payout uses the pre-spend stack pool.

All Light attacks use authored base Divine Light, cooldown, and scaling data. Triune scaling reads Limitless Light Stacks, front-row Ain Soph Aur count, and Collection Power.

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
- Persistent Enigmatic utility currently costs 1.
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
