# Blazing Garden - Card Abilities (Phase 1 Draft)

## Engine Extensions
No new engine extensions are required for this draft.

Reason:
- Every retuned effect is expressible with existing Blazing Garden and core primitives already present in the repo (`set_garden_law`, `replay_last_burn_card`, `ignite_units_burn`, `garden_wild_pollen_seed`, `copy_garden_law_to_sky_law`, `gate_payoff`, `geometry_mode_on_new_lineage`, `choose_burn_cards`, existing draw/salvage/look/cherubim bonus primitives, and existing conditional checks).
- Phase 2 wiring impact is therefore additive-zero for the engine: no new keyword registration, no new trigger types, and no behavior changes to existing cards.

## Base Cards (19)

### Chordbearing Migration (Ophanim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Ignite up to 1 unit into Burn.
  - Draw 2 cards.
  - Gain 6 Bloom.
  - If you already have 1+ Burn card, gain 1 Echo.
- Synergy note: Feeds `Spiral Memory Bloom`, `Serevathi Cinder Spiral`, and `Noonproof Transit` by establishing Burn early.
- [changed: effects]

### Embergrove Cartographer (Ophanim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Salvage 1 Blazing Garden Ophanim from your discard (Base only).
  - Draw 1 card.
  - Gain 2 Bloom.
- Synergy note: Recovers `Sunvein Wayfinder`, `Petal Route Initiate`, or `Rootflare Transit` for `Aureveth Noon Petal` and `Aureveth Evernoon` triggers.
- [changed: effects]

### Petal Route Initiate (Ophanim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Draw 1 card.
  - Gain 3 Bloom.
  - While on board: The first time each turn you play another Ophanim, gain 1 Bloom.
- Synergy note: Sustains Bloom for `Golden Petal Vicar`, `Noonproof Transit`, and all Wild Pollen seed cards.
- [changed: effects]

### Rootflare Transit (Ophanim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Draw 2 cards.
  - Gain 1 Echo.
  - If you ignited this turn, draw 1 additional card.
- Synergy note: Bridges `Chordbearing Migration` into faster `Serevathi Proofflame` and `Proof Completed Sky` lines.
- [changed: effects]

### Spiral Memory Bloom (Ophanim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Replay the last Burn-phase card played this turn.
  - Gain 5 Bloom.
  - Gain 1 Echo.
- Synergy note: Doubles value from `Chordbearing Migration`, `Rootflare Transit`, and `Noonproof Transit` sequencing.
- [changed: effects]

### Sunvein Wayfinder (Ophanim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Look at the top 5 cards, take 2 cards, put the rest on the bottom.
  - If at least 1 taken card is Blazing Garden Cherubim, gain 2 Bloom.
- Synergy note: Digs for `Fibonacci Sexton`, `Thistleproof Chorister`, or `Vethkorath Seven-Crown Proof` setup pieces.
- [changed: effects]

### Violet Crown Drift (Ophanim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Set Garden Law to Thistle.
  - Gain 4 Bloom.
  - Gain 1 Echo.
  - Draw 1 card.
- Synergy note: Preloads Thistle branches for `Proof Completed Sky` and `Final Chord Incandescent` lineage play.
- [changed: effects]

### Auric Floret Keeper (Cherubim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Gain 7 Bloom.
  - While on board: Whenever you play `Petal Route Initiate` or `Sunvein Wayfinder`, gain 2 Bloom.
  - Buffs Seraphim and Angel attacks: base +30, cooldown +0, multiplier x1.00.
- Synergy note: Converts repeated Ophanim cycling into Bloom fuel for `Noonproof Transit` and all Wild Pollen seeders.
- [changed: effects]

### Charred Choir Reclaimer (Cherubim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Shuffle discard into deck.
  - Draw 1 card.
  - While on board: Adjacent active Seraphim gain +34 Oblivion whenever a Burn card resolves.
  - Buffs Seraphim attacks: base +34, cooldown +0, multiplier x1.00.
  - Buffs Angel attacks: base +26, cooldown -1, multiplier x1.00.
- Synergy note: Rewards Burn loops from `Chordbearing Migration`, `Spiral Memory Bloom`, and `Serevathi Proofflame`.
- [changed: effects]

### Embergrove Historian (Cherubim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Salvage 1 Blazing Garden Base card from discard.
  - While on board: Adjacent active Seraphim gain +28 Oblivion whenever you play an Ophanim.
  - Buffs Seraphim attacks: base +32, cooldown -1, multiplier x1.00.
  - Buffs Angel attacks: base +24, cooldown +0, multiplier x1.00.
- Synergy note: Rebuilds base engine by reclaiming `Spiral Memory Bloom` or `Sunvein Wayfinder` for Seraphim tempo.
- [changed: effects]

### Fibonacci Sexton (Cherubim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Look at the top 6 cards, take 2 cards, put the rest on the bottom.
  - While on board: Each adjacent active Seraphim draws 1 card the first time you play a second card in a turn.
  - Buffs Seraphim attacks: base +30, cooldown +0, multiplier x1.00.
  - Buffs Angel attacks: base +22, cooldown +0, multiplier x1.00.
- Synergy note: Supplies hand velocity for `Final Chord Herald` and `Final Chord Incandescent` multi-card turns.
- [changed: effects]

### Golden Petal Vicar (Cherubim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Draw 2 cards.
  - Gain 8 Bloom.
  - While on board: All Oblivion gain +42%.
- Synergy note: Scales every Seraphim attack and Wild Pollen conversion line, especially with `Noonproof Transit`.
- [changed: effects]

### Root Lantern Attendant (Cherubim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Draw 1 card.
  - Gain 1 Echo.
  - While on board: Adjacent active Seraphim gain +22 Oblivion whenever you play an Ophanim.
  - Buffs Angel attacks: base +20, cooldown +0, multiplier x1.00.
- Synergy note: Turns low-cost Ophanim chains (`Petal Route Initiate`, `Rootflare Transit`) into Seraphim pressure.
- [changed: effects]

### Thistleproof Chorister (Cherubim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Draw 1 card.
  - Gain 4 Bloom.
  - Set Garden Law to Thistle.
  - While on board: Seraphim bonuses are amplified by +0.08.
  - Buffs Seraphim attacks: base +38, cooldown -1, multiplier x1.00.
- Synergy note: Amplifies `Aureveth Noon Petal`/`Vethkorath Starspine` passives and aligns with Thistle branches in `Proof Completed Sky`.
- [changed: effects]

### Aureveth Noon Petal (Seraphim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Draw 1 card.
  - Gain 6 Bloom.
  - While on board: +24 Oblivion whenever you play an Ophanim while active.
- Attacks:
  - Unsynergized - Sunfloret Vector: damage 430 / discard 1 / cooldown 3 (`round(430/100) - 1 = 4 - 1 = 3`).
  - Synergized - Noon-That-Does-Not-End: damage 610 / discard 0 / cooldown 6 (`round(610/100) - 0 = 6`).
- Synergy note: Peaks with Ophanim density from `Petal Route Initiate`, `Sunvein Wayfinder`, and `Embergrove Cartographer`.
- [changed: effects | damage | cooldown]

### Embergrove Cantor (Seraphim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Salvage 1 Blazing Garden Base card from discard.
  - Gain 12 Bloom.
  - Draw 1 card.
  - While on board: Resource generation +12 while active.
- Attacks:
  - Unsynergized - Cinder Echo Rend: damage 600 / discard 1 / cooldown 5 (`round(600/100) - 1 = 6 - 1 = 5`).
  - Synergized - Echo Chord Rend: damage 840 / discard 0 / cooldown 8 (`round(840/100) - 0 = 8`).
- Synergy note: Recycles key base tools (`Spiral Memory Bloom`, `Chordbearing Migration`) then cashes Bloom/Echo scaling.
- [changed: effects | damage | cooldown]

### Final Chord Herald (Seraphim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Draw 2 cards.
  - Gain 220 Oblivion.
  - Gain 1 Echo.
  - While on board: +30 Oblivion per card played while active.
- Attacks:
  - Unsynergized - Choirline Sundering: damage 680 / discard 1 / cooldown 6 (`round(680/100) - 1 = 7 - 1 = 6`).
  - Synergized - Final Chord Sundering: damage 980 / discard 0 / cooldown 10 (`round(980/100) - 0 = 10`).
- Synergy note: Converts long action chains from `Fibonacci Sexton` and `Noonproof Transit` into concentrated finish damage.
- [changed: effects | damage | cooldown]

### Serevathi Cinder Spiral (Seraphim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Draw 1 card.
  - Gain 4 Bloom.
  - Ignite up to 1 unit into Burn.
  - While on board: Resource generation +4 while active.
- Attacks:
  - Unsynergized - Petal Circuit Slash: damage 320 / discard 1 / cooldown 2 (`round(320/100) - 1 = 3 - 1 = 2`).
  - Synergized - Blazing Choir Slash: damage 520 / discard 0 / cooldown 5 (`round(520/100) - 0 = 5`).
- Synergy note: Opens Burn lines for `Spiral Memory Bloom`, `Serevathi Proofflame`, and Burn-gated Infinity payoffs.
- [changed: effects | damage | cooldown]

### Vethkorath Starspine (Seraphim card)
- Rarity tier: Base
- Element/typing: BlazingGarden
- New effect text:
  - On play: Draw 2 cards.
  - Gain 5 Bloom.
  - Gain 1 Echo.
  - While on board: +22 Oblivion per card played while active.
- Attacks:
  - Unsynergized - Thistle Proof Cut: damage 520 / discard 1 / cooldown 4 (`round(520/100) - 1 = 5 - 1 = 4`).
  - Synergized - Proof Completed Cut: damage 760 / discard 0 / cooldown 8 (`round(760/100) - 0 = 8`).
- Synergy note: Thrives in multi-play turns enabled by `Fibonacci Sexton` and `Vethkorath Seven-Crown Proof`.
- [changed: effects | damage | cooldown]

## Eternal Cards (5)

### Noonproof Transit (Ophanim card)
- Rarity tier: Eternal
- Element/typing: BlazingGarden
- New effect text:
  - Gain 14 Bloom.
  - Replay the last Burn-phase card played this turn.
  - Ignite up to 2 units into Burn.
  - Gain 2 Echo.
  - Gain 2 Wild Pollen.
  - Seed up to 2 Wild Pollen (+22.0 Oblivion per pollen, +0.05% score per Bloom).
  - Draw 2 cards.
- Synergy note: Central transit engine for `Serevathi Proofflame`, `Final Chord Incandescent`, and `Noon That Never Sets` gate fulfillment.
- [changed: effects]

### Embergrove Codex (Cherubim card)
- Rarity tier: Eternal
- Element/typing: BlazingGarden
- New effect text:
  - On play: Gain 1 Wild Pollen.
  - Seed up to 1 Wild Pollen (+24.0 Oblivion per pollen, +0.03% score per Bloom).
  - Replay the last Burn-phase card played this turn.
  - While on board: Seraphim bonuses are amplified by +0.16.
  - Buffs Seraphim and Angel attacks: base +54, cooldown -1, multiplier x1.00.
- Synergy note: Multiplies passive value from `Aureveth Evernoon` and `Final Chord Herald` while recycling Burn lines.
- [changed: effects]

### Vethkorath Seven-Crown Proof (Cherubim card)
- Rarity tier: Eternal
- Element/typing: BlazingGarden
- New effect text:
  - On play: Gain 4 Wild Pollen.
  - Draw 1 card.
  - While on board: Each adjacent active Seraphim draws 1 card after every third card you play this turn.
  - Buffs Seraphim and Angel attacks: base +66, cooldown -1, multiplier x1.00.
- Synergy note: Sustains long combo turns for `Final Chord Incandescent` and `Soleth Vair Worldflower`.
- [changed: effects]

### Aureveth Evernoon (Seraphim card)
- Rarity tier: Eternal
- Element/typing: BlazingGarden
- New effect text:
  - On play: Gain 2 Wild Pollen.
  - Seed up to 2 Wild Pollen (+18.0 Oblivion per pollen, +0.05% score per Bloom).
  - Draw 1 card.
  - While on board: +200 Oblivion whenever you play an Ophanim while active.
- Attacks:
  - Unsynergized - Evernoon Route: damage 760 / discard 1 / cooldown 7 (`round(760/100) - 1 = 8 - 1 = 7`).
  - Synergized - Sunflower Verdict Route: damage 920 / discard 0 / cooldown 9 (`round(920/100) - 0 = 9`).
- Synergy note: Converts Ophanim spam from `Noonproof Transit` and `Sunvein Wayfinder` into sustained Eternal pressure.
- [changed: effects | damage | cooldown]

### Serevathi Proofflame (Seraphim card)
- Rarity tier: Eternal
- Element/typing: BlazingGarden
- New effect text:
  - On play: Gain 3 Wild Pollen.
  - Gain 2 Echo.
  - Ignite up to 1 unit into Burn.
  - While on board: +28 Oblivion per card played while active.
- Attacks:
  - Unsynergized - Roseproof Spiral: damage 700 / discard 1 / cooldown 6 (`round(700/100) - 1 = 7 - 1 = 6`).
  - Synergized - Roseproof Chord: damage 880 / discard 0 / cooldown 9 (`round(880/100) - 0 = 9`).
- Synergy note: Bridges Burn ignition and Wild Pollen economy for `Noon That Never Sets` and `Proof Completed Sky`.
- [changed: effects | damage | cooldown]

## Infinity Cards (6)

### Noon That Never Sets (Ophanim card)
- Rarity tier: Infinity
- Element/typing: BlazingGarden
- New effect text:
  - For each fulfilled gate:
    - if you have played 4+ cards this turn, draw 2 cards.
    - if you have 2+ Burn-phase cards, gain 2 Echo.
    - if you have 1+ cards in the Grove, trigger 1 Burn-phase attack.
  - If all gates are fulfilled, apply Zenith for 1 turn: all Burn-phase effects gain +2.
  - Seed up to 2 Wild Pollen (+28.0 Oblivion per pollen, +0.12% score per Bloom).
  - Gain 4 Wild Pollen.
  - Draw 1 card.
- Synergy note: Reads full board state built by `Soleth Vair Worldflower`, `Spiral Memory Bloom`, and `Noonproof Transit`.
- [changed: effects]

### Proof Completed Sky (Ophanim card)
- Rarity tier: Infinity
- Element/typing: BlazingGarden
- New effect text:
  - Replay the last Burn-phase card played this turn.
  - Gain 2 Echo.
  - Salvage 1 Blazing Garden Burn card from discard.
  - Copy Garden Law to Sky Law:
    - Rose: Echo effects are doubled for 1 turn.
    - Sunflower: Burn cards return to hand as Echoes for 1 turn.
    - Thistle: Burn cards gain 2 cooldown reduction for 1 turn.
  - Seed up to 4 Wild Pollen (+34.0 Oblivion per pollen, +0.08% score per Bloom).
  - Gain 3 Wild Pollen.
  - Draw 1 card.
- Synergy note: Converts `Violet Crown Drift`/`Thistleproof Chorister` law setup into tailored payoff windows.
- [changed: effects]

### Choir of Rekindled Geometry (Cherubim card)
- Rarity tier: Infinity
- Element/typing: BlazingGarden
- New effect text:
  - On play: Seed up to 2 Wild Pollen (+27.0 Oblivion per pollen, +0.10% score per Bloom).
  - While on board: On new lineage, Geometry Mode applies: all Burn-phase effects gain +1 and cooldown reduction 1.
  - If 3 lineages are played, Geometry Mode also applies next turn.
  - Buffs Seraphim attacks: base +72, cooldown -1, multiplier x1.00.
  - Buffs Angel attacks: base +56, cooldown -1, multiplier x1.00.
- Synergy note: Rewards diversified lineage sequencing with `Final Chord Incandescent` snapshots and `Noon That Never Sets` gates.
- [changed: effects]

### Embergrove Resurrection Array (Cherubim card)
- Rarity tier: Infinity
- Element/typing: BlazingGarden
- New effect text:
  - On play: Replay the last Burn-phase card played this turn.
  - Draw 2 cards.
  - Seed up to 3 Wild Pollen (+30.0 Oblivion per pollen, +0.09% score per Bloom).
  - While on board: Choose up to 2 Burn cards, then on char revive them as Echoes with doubled effects for 1 turn.
  - Echoes persist for 2 turns.
  - Buffs Seraphim and Angel attacks: base +76, cooldown -1, multiplier x1.00.
- Synergy note: Best with `Soleth Vair Worldflower` (char volume) and `Proof Completed Sky` (Burn retrieval).
- [changed: effects]

### Final Chord Incandescent (Seraphim card)
- Rarity tier: Infinity
- Element/typing: BlazingGarden
- New effect text:
  - On play: Snapshot current Burn-phase lineages.
  - On new lineage: Burn cards of that lineage gain +1 Echo and 1 cooldown reduction.
  - If all lineages are present at end of turn: Bloom all lineages at 100% effect.
  - Seed all Wild Pollen (+32.0 Oblivion per pollen, +0.10% score per Bloom).
  - While on board: +36 Oblivion per card played while active.
- Attacks:
  - Unsynergized - Incandescent Rift: damage 980 / discard 1 / cooldown 9 (`round(980/100) - 1 = 10 - 1 = 9`).
  - Synergized - Final Chord Rift: damage 1450 / discard 0 / cooldown 15 (`round(1450/100) - 0 = 15`).
- Synergy note: Apex payoff for lineage diversity built by `Choir of Rekindled Geometry` and `Noon That Never Sets`.
- [changed: effects | damage | cooldown]

### Soleth Vair Worldflower (Seraphim card)
- Rarity tier: Infinity
- Element/typing: BlazingGarden
- New effect text:
  - On play: Seed Grove with 1 Worldflower token per Burn card.
  - Worldflower tokens become Echoes on char for 1 turn.
  - If 3 Worldflowers are played this turn, all Burn effects gain +1.
  - Seed up to 4 Wild Pollen (+36.0 Oblivion per pollen, +0.08% score per Bloom).
  - While on board: Each new Cherubim summoned while active gains +2 durability.
- Attacks:
  - Unsynergized - Rootfire Dominion: damage 920 / discard 1 / cooldown 8 (`round(920/100) - 1 = 9 - 1 = 8`).
  - Synergized - Worldflower Dominion: damage 1500 / discard 0 / cooldown 15 (`round(1500/100) - 0 = 15`).
- Synergy note: Converts char density from `Embergrove Resurrection Array` into long Echo chains and Wild Pollen scaling.
- [changed: effects | damage | cooldown]
