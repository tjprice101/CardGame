# Wished Upon a Star - Card Abilities (Phase 1 Draft)

## Engine Extensions (Phase 2 Additive Wiring Plan)

No new keyword, ability type, trigger type, or effect verb is required for this draft.

This draft is intentionally constrained to already-live Wished Upon a Star primitives and generalized engine primitives:
- starlight gain/spend
- dream lattice gain/spend
- Star Crown (eternal stack: wuas) gain/cashout/threshold
- Nova Wish Burst
- Constellation Lock Release
- Infinite Starbirth
- Existing on-play, after-N-cards, and while-on-board patterns

Non-breaking note:
- Because no new primitives are introduced, Phase 2 engine work is additive-only in formatting and data wiring, with no API signature change and no behavior change for existing non-WUAS cards.

## Base Cards (20)

### Aeolian Nova (Ophanim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - Gain 4 Starlight Charges.
  - Nova Wish Burst (Oblivion = Starlight x (1 + Dream x 0.40)).
- Synergy note: Converts Starlight from Skyrift Mote and Stargazer Token into immediate burst.
- [changed: effects]

### Celestine Cascade (Ophanim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - Gain 3 Dream Lattice stacks.
  - If you have 4+ Starlight Charges, draw 1 card.
- Synergy note: Pairs with Aeolian Nova and Draethos Eclipse Lord by front-loading Dream before burst turns.
- [changed: effects]

### Dream Shard (Ophanim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - Look at the top 3 cards, take 1 card, and put the rest on the bottom.
  - If the taken card is Wished Upon a Star, gain 1 Dream Lattice stack.
- Synergy note: Digs for Draethos Gravity or Nullspire Monolith while feeding Dream for Nova math.
- [changed: effects]

### Luna Glitch (Ophanim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - Gain 2 Starlight Charges.
  - If another Ophanim was played this turn, gain 2 Dream Lattice stacks.
- Synergy note: Rewards chaining after Dream Shard and Stargazer Token in Ophanim-heavy turns.
- [changed: effects]

### Skyrift Mote (Ophanim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - Gain Starlight Charges equal to your active Cherubim count (minimum 1).
- Synergy note: Scales hardest with Dreamvault Keeper and Solarvex Ward staying on board.
- [changed: effects]

### Stargazer Token (Ophanim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - Draw 1 card.
  - Gain 2 Starlight Charges.
  - If your hand has 7+ cards after drawing, gain 1 additional Starlight Charge.
- Synergy note: Fuels Wishwright's Pulse draw loops while building Starlight for Aeolian Nova.
- [changed: effects]

### Wishfire Surge (Ophanim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - Gain 1 Dream Lattice stack.
  - Gain Oblivion equal to 95 + (25 x Dream Lattice).
- Synergy note: Turns Celestine Cascade and Luna Glitch Dream stacks into immediate value.
- [changed: effects]

### Dreamvault Keeper (Cherubim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - On play: Gain 1 Starlight Charge and 1 Dream Lattice stack.
  - While on board: Every 3 cards played, draw 1 card.
- Synergy note: Sustains long sequences for Lune Refrain and Starwarden Selenira thresholds.
- [changed: effects]

### Solarvex Ward (Cherubim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - On play: Gain 2 Dream Lattice stacks.
  - While on board: At end of turn, preserve up to 2 Dream Lattice stacks.
- Synergy note: Stabilizes Dream totals for Aeolian Nova and Draethos Eclipse Lord burst timing.
- [changed: effects]

### Starlace Binding (Cherubim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - On play: Gain 2 Starlight Charges.
  - While on board: Wished Upon a Star Seraphim and Angel attacks gain +60 base damage.
  - While on board: If you have 5+ Starlight Charges when Nova Wish Burst resolves, gain 1 Dream Lattice stack.
- Synergy note: Anchors attack-focused lines with Draethos Gravity and Aethervex Triumphant.
- [changed: effects]

### Voidbane Doctrine (Cherubim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - On play: Gain 3 Starlight Charges and 1 Dream Lattice stack.
  - While on board: The first time each turn you play your 5th card, trigger Nova Wish Burst with coefficient 0.30.
- Synergy note: Pays off Dreamvault Keeper draw chains and Dream Shard selection sequencing.
- [changed: effects]

### Wishwright's Pulse (Cherubim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - On play: Draw 1 card.
  - While on board: Every 2 cards played, gain 1 Starlight Charge and +35 Oblivion.
- Synergy note: Converts Stargazer Token hand growth into persistent Starlight and damage pressure.
- [changed: effects]

### Draethos Gravity (Seraphim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - On play: Gain 3 Starlight Charges and 1 Dream Lattice stack.
  - While on board: +60 Oblivion per card played while active.
- Attack (Unsynergized): Gravity Pull
  - damage 430 / discard 0 / cooldown 4 (round(430/100) - 0 = 4)
- Attack (Synergized): Draethos Descent
  - damage 760 / discard 1 / cooldown 7 (round(760/100) - 1 = 7)
- Synergy note: Wants Starlace Binding on board and Dream Shard selection support for high uptime.
- [changed: effects | damage | cooldown]

### Lune Refrain (Seraphim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - On play: Look at the top 3 cards, take 1 card, and put the rest on the bottom.
  - Gain 1 Dream Lattice stack.
  - While on board: +92 Oblivion per card played while active.
- Attack (Unsynergized): Lune Echo
  - damage 300 / discard 0 / cooldown 3 (round(300/100) - 0 = 3)
- Attack (Synergized): Choir Refrain
  - damage 520 / discard 0 / cooldown 5 (round(520/100) - 0 = 5)
- Synergy note: Smooths draws for Solarvex Fragment and Starwarden Selenira timing windows.
- [changed: effects | damage | cooldown]

### Nullspire Monolith (Seraphim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - On play: Gain 4 Starlight Charges and 2 Dream Lattice stacks.
  - While on board: Your board power is amplified by x1.35.
- Attack (Unsynergized): Null Spire
  - damage 560 / discard 0 / cooldown 6 (round(560/100) - 0 = 6)
- Attack (Synergized): Monolith Decree
  - damage 980 / discard 1 / cooldown 9 (round(980/100) - 1 = 9)
- Synergy note: Core summon material for Aethervex Triumphant and a power anchor for Angel turns.
- [changed: effects | damage | cooldown]

### Selenira's Vigil (Seraphim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - On play: Gain 2 Dream Lattice stacks.
  - If you have 4+ Starlight Charges, draw 1 card.
  - While on board: +42 Oblivion per card played while active.
- Attack (Unsynergized): Vigil Strike
  - damage 280 / discard 0 / cooldown 3 (round(280/100) - 0 = 3)
- Attack (Synergized): Selenira Watch
  - damage 490 / discard 0 / cooldown 5 (round(490/100) - 0 = 5)
- Synergy note: Bridges Starlight setup from Skyrift Mote into Starwarden Selenira summon lines.
- [changed: effects | damage | cooldown]

### Solarvex Fragment (Seraphim card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - On play: Gain 2 Starlight Charges.
  - While on board: Resource generation +1 while active.
- Attack (Unsynergized): Star Flicker
  - damage 210 / discard 0 / cooldown 2 (round(210/100) - 0 = 2)
- Attack (Synergized): Solarvex Pulse
  - damage 360 / discard 0 / cooldown 4 (round(360/100) - 0 = 4)
- Synergy note: Accelerates Starlight/Dream engines that feed Aeolian Nova and Draethos Eclipse Lord.
- [changed: effects | damage | cooldown]

### Aethervex, Triumphant (Angel card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - Summon materials: Nullspire Monolith, Solarvex Ward.
  - Extra summon materials: None.
  - On summon: Gain 6 Starlight Charges, gain 3 Dream Lattice stacks, draw 1 card.
  - After 3 cards played: Gain 4 Starlight Charges and gain 2 Dream Lattice stacks.
  - While on board: +68 Oblivion per card played while on board.
  - [Triumphant Wish] Gain 4 Starlight Charges; gain 2 Dream Lattice stacks; if Dream Lattice is 6+, trigger Nova Wish Burst (coefficient 0.60).
- Attack (Primary): Aether Strike
  - damage 840 / discard 1 / cooldown 7 (round(840/100) - 1 = 7)
- Attack (Exalted): Wishwright Apex
  - damage 1450 / discard 2 / cooldown 13 (round(1450/100) - 2 = 13)
- Synergy note: Converts Nullspire Monolith power scaling and Solarvex Ward Dream retention into burst Angel turns.
- [changed: effects | damage | cooldown | summon-mats]

### Draethos, Eclipse Lord (Angel card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - Summon materials: Draethos Gravity, Lune Refrain.
  - Extra summon materials: None.
  - On summon: Gain 5 Starlight Charges and gain 3 Dream Lattice stacks.
  - After 3 cards played: Trigger Nova Wish Burst (coefficient 0.70), then gain 3 Starlight Charges.
  - While on board: +62 Oblivion per card played while on board.
  - [Eclipse Decree] Trigger Nova Wish Burst (coefficient 0.70); gain 3 Starlight Charges.
- Attack (Primary): Eclipse Strike
  - damage 790 / discard 0 / cooldown 8 (round(790/100) - 0 = 8)
- Attack (Exalted): Draethos Descent
  - damage 1360 / discard 1 / cooldown 13 (round(1360/100) - 1 = 13)
- Synergy note: Peaks when Celestine Cascade and Solarvex Ward pre-stack Dream before summon.
- [changed: effects | damage | cooldown]

### Starwarden Selenira (Angel card)
- Rarity tier: Base
- Element/typing: WishedUponAStar
- New effect text:
  - Summon materials: Solarvex Fragment, Selenira's Vigil.
  - Extra summon materials: None.
  - On summon: Gain 4 Starlight Charges, gain 2 Dream Lattice stacks, draw 1 card.
  - After 2 cards played: Gain 2 Dream Lattice stacks, then draw 1 card.
  - While on board: +66 Oblivion per card played while on board.
  - [Star Ward] Gain 3 Starlight Charges; look at the top 2 cards, take 1 card, and put the rest on the bottom.
- Attack (Primary): Warden Strike
  - damage 760 / discard 0 / cooldown 8 (round(760/100) - 0 = 8)
- Attack (Exalted): Selenira Verdict
  - damage 1310 / discard 1 / cooldown 12 (round(1310/100) - 1 = 12)
- Synergy note: Uses Selenira's Vigil and Dreamvault Keeper to maintain draw velocity through Angel cycles.
- [changed: effects | damage | cooldown]

## Eternal Cards (3)

### Selenira Voidbane (Ophanim card)
- Rarity tier: Eternal
- Element/typing: WishedUponAStar
- New effect text:
  - Gain 8 Starlight Charges.
  - Gain 4 Dream Lattice stacks.
  - Gain 8 Star Crowns.
  - Nova Wish Burst (Oblivion = Starlight x (1 + Dream x 1.20)).
  - Cash out up to 18 Star Crowns (+220 Oblivion per Crown).
  - Constellation Lock Release (consume up to 6 Dream Lattice for bonus burst).
- Synergy note: Feeds and empties the same Crown bank that Aethervex the Wishwright builds.
- [changed: effects]

### Aethervex, the Wishwright (Seraphim card)
- Rarity tier: Eternal
- Element/typing: WishedUponAStar
- New effect text:
  - On play: Gain 6 Starlight Charges and 5 Dream Lattice stacks.
  - Gain 12 Star Crowns.
  - If Dream Lattice is 6+, gain 4 Star Crowns.
  - While on board: +34 Oblivion per card played while active.
- Attack (Unsynergized): Wishwright Strike
  - damage 700 / discard 0 / cooldown 7 (round(700/100) - 0 = 7)
- Attack (Synergized): Galaxy-wing Decree
  - damage 1220 / discard 1 / cooldown 11 (round(1220/100) - 1 = 11)
- Synergy note: Primary Crown battery for Selenira Voidbane and Draethos the Unforgotten cashouts.
- [changed: effects | damage | cooldown]

### Draethos, The Unforgotten (Angel card)
- Rarity tier: Eternal
- Element/typing: WishedUponAStar
- New effect text:
  - Summon materials: Aethervex, Triumphant; Draethos Gravity.
  - Extra summon materials: 2+ active Cherubim; 1+ Aethervex, the Wishwright on board.
  - On summon: Gain 4 Starlight Charges, gain 3 Dream Lattice stacks, gain 6 Star Crowns.
  - After 3 cards played: Gain 3 Starlight Charges, gain 2 Dream Lattice stacks, gain 6 Star Crowns.
  - Nova Wish Burst (Oblivion = Starlight x (1 + Dream x 0.80)).
  - Cash out up to 10 Star Crowns (+260 Oblivion per Crown).
  - While on board: +72 Oblivion per card played while on board.
  - [Unforgotten Verdict] Gain 3 Starlight Charges; gain 2 Dream Lattice stacks; gain 6 Star Crowns; Nova Wish Burst (coefficient 0.80); cash out up to 10 Star Crowns (+260 Oblivion per Crown).
- Attack (Primary): Draethos Strike
  - damage 900 / discard 1 / cooldown 8 (round(900/100) - 1 = 8)
- Attack (Exalted): Unforgotten Apex
  - damage 1680 / discard 2 / cooldown 15 (round(1680/100) - 2 = 15, clamped to 15)
- Synergy note: Converts Crown stockpiles from Aethervex the Wishwright into repeatable finisher windows.
- [changed: effects | damage | cooldown]

## Infinity Cards (3)

### Stellarborn Throne (Ophanim card)
- Rarity tier: Infinity
- Element/typing: WishedUponAStar
- New effect text:
  - Gain 8 Starlight Charges.
  - Gain 6 Dream Lattice stacks.
  - Gain 12 Star Crowns.
  - Infinite Starbirth (Oblivion = Seraphim count x Starlight x 140; draw 0.50 per Dream Lattice).
  - If you have 8+ Dream Lattice, gain 6 Star Crowns.
  - Constellation Lock Release (consume up to 8 Dream Lattice for bonus burst).
- Synergy note: Enables Wishwright Absolute by overfilling both Dream and Crown banks before Seraphim attack turns.
- [changed: effects]

### Lune Choir Ascension (Cherubim card)
- Rarity tier: Infinity
- Element/typing: WishedUponAStar
- New effect text:
  - On play: Gain 6 Starlight Charges, gain 6 Dream Lattice stacks, gain 6 Star Crowns.
  - While on board: Draw 0.25 cards per card played.
  - While on board: Wished Upon a Star Seraphim and Angel attacks gain +150 base damage when you have 8+ Star Crowns.
- Synergy note: Keeps Crown-threshold attack buffs online for Aethervex the Wishwright and Wishwright Absolute.
- [changed: effects]

### Wishwright Absolute (Seraphim card)
- Rarity tier: Infinity
- Element/typing: WishedUponAStar
- New effect text:
  - On play: Gain 10 Starlight Charges, gain 8 Dream Lattice stacks, gain 16 Star Crowns.
  - Nova Wish Burst (Oblivion = Starlight x (1 + Dream x 1.80)).
  - Cash out up to 24 Star Crowns (+280 Oblivion per Crown).
  - Infinite Starbirth (Oblivion = Seraphim count x Starlight x 190; draw 0.35 per Dream Lattice).
  - While on board: +52 Oblivion per card played while active.
- Attack (Unsynergized): Absolute Strike
  - damage 1020 / discard 1 / cooldown 9 (round(1020/100) - 1 = 9)
- Attack (Synergized): Wishwright Zenith
  - damage 1760 / discard 2 / cooldown 15 (round(1760/100) - 2 = 16, clamped to 15)
- Synergy note: Final conversion point for Stellarborn Throne setup and Lune Choir Ascension attack buffs.
- [changed: effects | damage | cooldown]
