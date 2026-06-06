# Eternal Seas - Card Abilities (Phase 1 Draft)

## Engine Extensions (Additive Only)

1. **New condition: `eternal_seas_undertow_gte`**
   - Needed by: Blackwater Cant, Veilmargin Crossflow, Veilmargin Harbinger, Veleth Itself.
   - Why existing primitives are insufficient: There is no current condition primitive for direct Undertow threshold checks on Eternal Seas cards.
   - Non-breaking wiring: Add a new `EffectCondition` variant and evaluator branch in `CardEffectExecutor` reading `turn.eternalSeasUndertow`; no existing condition behavior changes.

2. **New condition: `eternal_seas_foam_gte`**
   - Needed by: Kethavar Helixhunter, Silver Shallow Attendant, Crowned One, Ruby Margin.
   - Why existing primitives are insufficient: There is no current condition primitive for direct Foam threshold checks.
   - Non-breaking wiring: Add a new `EffectCondition` variant and evaluator branch in `CardEffectExecutor` reading `turn.eternalSeasFoam`; additive only.

3. **New effect: `seas_foam_spend`**
   - Needed by: Veleth, Undying Water (Angel), Crown of Seven Margins, Seven Crowned Confluence.
   - Why existing primitives are insufficient: Eternal Seas can gain Foam but currently has no dedicated spend primitive for it.
   - Non-breaking wiring: Add new `CardEffect` variant and executor case that decrements `turn.eternalSeasFoam` with floor at zero; no signature changes.

4. **New reaction trigger type: `on_seas_undertow_release`**
   - Needed by: Aeveleth Trace, Null Leviathan Sign, Veilmargin Cathedral.
   - Why existing primitives are insufficient: Existing per-card-played hooks cannot uniquely capture "when Undertow is released" timing.
   - Non-breaking wiring: Add a scoped event dispatch from `seas_undertow_release` resolution and consume it in while-on-board reaction effects; no effect API removals.

5. **New condition: `eternal_seas_tide_balance`**
   - Needed by: Thyrvaan Oldlight Grid, Water That Was Always There.
   - Why existing primitives are insufficient: No condition currently compares Undertow/Foam balance state.
   - Non-breaking wiring: Add condition that checks `abs(turn.eternalSeasUndertow - turn.eternalSeasFoam)` against a configured threshold; additive evaluator branch only.

## Base Cards (30)

### Blackwater Cant (Ophanim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 3 Undertow, gain 1 Foam, gain +150 Oblivion.
- Conditional: If Undertow is 6 or more, draw 1 card.
- Synergy note: Feeds early thresholds for Veilmargin Harbinger and Veleth Itself Echo.
- [changed: effects]

### Crowncurrent Atlas (Ophanim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 4 Undertow, gain 2 Foam.
- Search your deck for 1 Base Eternal Seas Ophanim, reveal it, and add it to hand.
- Synergy note: Tutors Shallows Spiral Map or Thyrvaan Net Expansion to stabilize early setup.
- [changed: effects]

### Depthless Sounding (Ophanim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 5 Undertow.
- Release up to 3 Undertow (+120 Oblivion per Undertow spent, +1 Foam per Undertow spent).
- If 3 Undertow were released, salvage 1 Base Eternal Seas Cherubim from discard.
- Synergy note: Loops with Aeveleth Trace and Thyrvaan Breathframe through repeated release turns.
- [changed: effects]

### Neon Pressure Line (Ophanim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 4 Undertow.
- Release up to 2 Undertow (+105 Oblivion per Undertow spent, +1 Foam per Undertow spent).
- If exactly 2 Undertow were released, gain +2 additional Foam.
- Synergy note: Rapidly builds Foam for Kethavar Helixhunter and Crowned One, Ruby Margin.
- [changed: effects]

### Shallows Spiral Map (Ophanim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 2 Undertow.
- Look at the top 4 cards of your deck; take 1 Base Eternal Seas card, place the rest on the bottom.
- Synergy note: Digs for specific base Seraphim lines, especially Velthiri Bloomschool.
- [changed: effects]

### Thyrvaan Net Expansion (Ophanim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 3 Undertow.
- Look at the top 6 cards of your deck; take 2 Base Eternal Seas cards, place the rest on the bottom.
- If no Seraphim was taken, gain +2 Foam.
- Synergy note: Stabilizes board assembly for Seraphim pairs used by Neon Ocean Herald.
- [changed: effects]

### Veilmargin Crossflow (Ophanim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 2 Undertow, gain 2 Foam.
- Conditional: If Foam is 4 or more, gain +1 Undertow.
- Synergy note: Provides balanced resource setup for Thyrvaan Oldlight Grid tide-balance lines.
- [changed: effects]

### Whitewater Cant (Ophanim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 3 Undertow, gain 1 Foam, draw 1 card.
- If another Eternal Seas Ophanim is already on board, gain +2 Foam.
- Synergy note: Rewards Ophanim swarms with Blackwater Cant and Crowncurrent Atlas.
- [changed: effects]

### Aeveleth Trace (Cherubim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 5 Undertow, gain 1 Foam.
- While on board: The first time each turn you release Undertow, gain +90 Oblivion and draw 1 card.
- Synergy note: Best paired with Depthless Sounding and Null Leviathan Sign for release-trigger value.
- [changed: effects]

### Blackzone Lamplure (Cherubim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 2 Undertow.
- While on board: Whenever you play an Eternal Seas Ophanim, gain +10 Oblivion and +1 Undertow.
- Synergy note: Turns low-cost Ophanim chains into sustained Undertow scaling for angel turns.
- [changed: effects]

### Crowned Current Keeper (Cherubim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 4 Undertow, draw 1 card.
- While on board: Eternal Seas Seraphim unsynergized attacks gain +70 base damage.
- While on board: Each time a Seraphim attack resolves, gain +1 Foam.
- Synergy note: Supports Kethavar Helixhunter and Velthiri Bloomschool as frequent attackers.
- [changed: effects]

### Neon Cell Cantor (Cherubim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 3 Undertow, gain 2 Foam.
- While on board: Every 3 cards you play, gain +2 Undertow and draw 1 card.
- Synergy note: Sustains long turns for Crowned One, Azure Margin and Veilmargin Cartographer.
- [changed: effects]

### Silver Shallow Attendant (Cherubim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 2 Undertow, gain 1 Foam.
- While on board: The first Cherubim you play each turn gains +1 durability.
- While on board: If Foam is 5 or more when that Cherubim is played, gain +1 additional Foam.
- Synergy note: Extends value lines with Surevaan Pulse Reader and Thyrvaan Breathframe.
- [changed: effects]

### Surevaan Pulse Reader (Cherubim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 4 Undertow.
- Salvage 1 Base Eternal Seas Seraphim from discard.
- While on board: Eternal Seas Seraphim board bonuses are amplified by +0.10.
- Synergy note: Recovers key Seraphim pieces for Neon Ocean Herald and Aeveleth Remembered.
- [changed: effects]

### Thyrvaan Breathframe (Cherubim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 4 Undertow, gain 2 Foam.
- While on board: Eternal Seas Seraphim and Angel attacks gain +40 base damage.
- While on board: Whenever you gain Foam from Undertow release, gain +1 Undertow.
- Synergy note: Converts release loops into extra attack scaling for every higher tier.
- [changed: effects]

### Veilmargin Conductor (Cherubim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 3 Undertow.
- While on board: Eternal Seas Angel attacks gain +44 base damage.
- While on board: After you summon an Angel, gain +2 Foam.
- Synergy note: Improves all angel finishers, especially Veleth, Undying Water.
- [changed: effects]

### Kethavar Helixhunter (Seraphim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 2 Undertow, gain 1 Foam, gain +80 Oblivion.
- While on board: +12 Oblivion per card played while active.
- While on board: If Foam is 5 or more, this card's attacks gain +60 damage.
- Attack (Unsynergized): Helix Drill
  - damage 300 / discard 0 / cooldown 3 (round(300/100) - 0 = 3)
- Attack (Synergized): Abyss Helix Drill
  - damage 520 / discard 0 / cooldown 5 (round(520/100) - 0 = 5)
- Synergy note: Peaks with Neon Pressure Line and Crowned Current Keeper.
- [changed: effects | damage | cooldown]

### Null Leviathan Sign (Seraphim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 4 Undertow.
- Release up to 2 Undertow (+98 Oblivion per Undertow spent, +1 Foam per Undertow spent).
- While on board: +22 Oblivion per card played while active.
- While on board: The first Undertow release each turn gains +1 extra Foam.
- Attack (Unsynergized): Signal Deepcut
  - damage 460 / discard 0 / cooldown 5 (round(460/100) - 0 = 5)
- Attack (Synergized): Abyss Warning Verdict
  - damage 820 / discard 0 / cooldown 8 (round(820/100) - 0 = 8)
- Synergy note: Drives Foam economy for Ruby and Veleth, Undying Water.
- [changed: effects | damage | cooldown]

### Ossiveth Naur Ridgebody (Seraphim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 5 Undertow.
- Release up to 3 Undertow (+126 Oblivion per Undertow spent, +1 Foam per Undertow spent).
- While on board: Each new Cherubim summoned while active gains +1 durability.
- Attack (Unsynergized): Ridgewake Crush
  - damage 700 / discard 0 / cooldown 7 (round(700/100) - 0 = 7)
- Attack (Synergized): World-Ocean Crush
  - damage 1240 / discard 0 / cooldown 12 (round(1240/100) - 0 = 12)
- Synergy note: Anchors durable Cherubim boards for all angel summons.
- [changed: effects | damage | cooldown]

### Surevaan Tiltborne (Seraphim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 3 Undertow.
- While on board: Whenever you play an Eternal Seas Ophanim, gain +20 Oblivion and +1 Undertow.
- Attack (Unsynergized): Diagonal Drift
  - damage 340 / discard 0 / cooldown 3 (round(340/100) - 0 = 3)
- Attack (Synergized): Marginlift Verdict
  - damage 600 / discard 0 / cooldown 6 (round(600/100) - 0 = 6)
- Synergy note: Turns Ophanim chains into Seraphim pressure for Neon Ocean Herald lines.
- [changed: effects | damage | cooldown]

### Thyrvaan Fractalbreath (Seraphim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 3 Undertow, gain 1 Foam, draw 1 card.
- While on board: The first card you draw each turn grants +1 Undertow.
- Attack (Unsynergized): Fractal Pulse
  - damage 360 / discard 0 / cooldown 4 (round(360/100) - 0 = 4)
- Attack (Synergized): Oldest Light Pulse
  - damage 640 / discard 0 / cooldown 6 (round(640/100) - 0 = 6)
- Synergy note: Combines with Whitewater Cant and Neon Cell Cantor for draw-driven ramp.
- [changed: effects | damage | cooldown]

### Veilmargin Harbinger (Seraphim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 4 Undertow, gain 2 Foam.
- While on board: +24 Oblivion per card played while active.
- While on board: If Undertow is 8 or more, this card's attacks gain +110 damage.
- Attack (Unsynergized): Margin Harrow
  - damage 500 / discard 0 / cooldown 5 (round(500/100) - 0 = 5)
- Attack (Synergized): Boundary Harrow
  - damage 900 / discard 0 / cooldown 9 (round(900/100) - 0 = 9)
- Synergy note: Converts heavy Undertow banking from Atlas/Sounding into burst attacks.
- [changed: effects | damage | cooldown]

### Veleth Itself Echo (Seraphim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 5 Undertow, gain 2 Foam, draw 2 cards.
- While on board: +34 Oblivion per card played while active.
- While on board: Whenever you gain Foam from any Eternal Seas effect, gain +10 Oblivion.
- Attack (Unsynergized): Basslight Rupture
  - damage 760 / discard 0 / cooldown 8 (round(760/100) - 0 = 8)
- Attack (Synergized): Undying Water Rupture
  - damage 1360 / discard 0 / cooldown 14 (round(1360/100) - 0 = 14)
- Synergy note: Core payoff engine for Foam-rich release and surge turns.
- [changed: effects | damage | cooldown]

### Velthiri Bloomschool (Seraphim card)
- Tier: Base
- Element/typing: EternalSeas
- On play: Gain 2 Undertow, gain 1 Foam, draw 1 card.
- While on board: +9 Oblivion per card played while active.
- While on board: If you played an Ophanim this turn, gain +1 Undertow.
- Attack (Unsynergized): School Cut
  - damage 260 / discard 0 / cooldown 3 (round(260/100) - 0 = 3)
- Attack (Synergized): Margin Bloom Cut
  - damage 430 / discard 0 / cooldown 4 (round(430/100) - 0 = 4)
- Synergy note: Efficient tempo striker with Crowncurrent Atlas and Shallows Spiral Map.
- [changed: effects | damage | cooldown]

### Aeveleth Remembered (Angel card)
- Tier: Base
- Element/typing: EternalSeas
- Summon materials: Ossiveth Naur Ridgebody, Null Leviathan Sign
- Extra summon materials: None
- On summon: Gain 7 Undertow, gain 1 Foam.
- After 4 cards played: Release up to 5 Undertow (+150 Oblivion per Undertow spent, +1 Foam per Undertow spent).
- While on board: +30 Oblivion for each Eternal Seas Seraphim on board.
- [Primordial Revision]: Salvage 1 Base Eternal Seas Ophanim from discard, then gain +2 Undertow.
- Attack (Primary): Revision Cut
  - damage 700 / discard 0 / cooldown 7 (round(700/100) - 0 = 7)
- Attack (Exalted): Before-Water Verdict
  - damage 1260 / discard 0 / cooldown 13 (round(1260/100) - 0 = 13)
- Synergy note: Recycles Ophanim to keep release lines active while Seraphim remain online.
- [changed: effects | damage | cooldown]

### Crowned One, Azure Margin (Angel card)
- Tier: Base
- Element/typing: EternalSeas
- Summon materials: Ossiveth Naur Ridgebody, Veleth Itself Echo
- Extra summon materials: None
- On summon: Gain 5 Undertow, gain 2 Foam.
- After 3 cards played: Gain 2 Foam, then release up to 3 Undertow (+128 Oblivion per Undertow spent, +1 Foam per Undertow spent).
- While on board: +52 Oblivion per card played while on board.
- [Azure Convergence]: Look at the top 5 cards of your deck; take 1 Base Eternal Seas Seraphim or Ophanim.
- Attack (Primary): Azure Surge
  - damage 560 / discard 0 / cooldown 6 (round(560/100) - 0 = 6)
- Attack (Exalted): Abyss Crownbreak
  - damage 980 / discard 1 / cooldown 9 (round(980/100) - 1 = 9)
- Synergy note: Converts board velocity into card selection for repeat Seraphim pressure.
- [changed: effects | damage | cooldown]

### Crowned One, Ruby Margin (Angel card)
- Tier: Base
- Element/typing: EternalSeas
- Summon materials: Null Leviathan Sign, Veilmargin Harbinger
- Extra summon materials: None
- On summon: Gain 5 Undertow, gain 1 Foam, gain +160 Oblivion.
- After 3 cards played: Gain 1 Foam, then release up to 3 Undertow (+126 Oblivion per Undertow spent, +1 Foam per Undertow spent).
- While on board: +22 Oblivion per card played while on board.
- While on board: If Foam is 6 or more, gain +40 Oblivion whenever you play an Eternal Seas card.
- [Ruby Convergence]: Gain +2 Foam.
- Attack (Primary): Ruby Surge
  - damage 540 / discard 0 / cooldown 5 (round(540/100) - 0 = 5)
- Attack (Exalted): Crowned Tidebreak
  - damage 940 / discard 1 / cooldown 8 (round(940/100) - 1 = 8)
- Synergy note: Strong with Neon Pressure Line and Null Leviathan Sign for high-Foam upkeep.
- [changed: effects | damage | cooldown]

### Neon Ocean Herald (Angel card)
- Tier: Base
- Element/typing: EternalSeas
- Summon materials: Surevaan Tiltborne, Thyrvaan Fractalbreath
- Extra summon materials: None
- On summon: Gain 4 Undertow.
- After 2 cards played: Release up to 2 Undertow (+115 Oblivion per Undertow spent, +1 Foam per Undertow spent).
- While on board: +24 Oblivion for each Eternal Seas Seraphim on board.
- While on board: When an Eternal Seas Seraphim attack resolves, gain +1 Undertow.
- [Signal in Static]: Gain +2 Foam.
- Attack (Primary): Signal Arc
  - damage 460 / discard 0 / cooldown 5 (round(460/100) - 0 = 5)
- Attack (Exalted): Chromatic Edict
  - damage 800 / discard 1 / cooldown 7 (round(800/100) - 1 = 7)
- Synergy note: Supports frequent Seraphim attack loops with sustained Undertow income.
- [changed: effects | damage | cooldown]

### Veilmargin Cartographer (Angel card)
- Tier: Base
- Element/typing: EternalSeas
- Summon materials: Velthiri Bloomschool, Kethavar Helixhunter
- Extra summon materials: None
- On summon: Gain 4 Undertow, draw 1 card.
- After 2 cards played: Gain 2 Undertow and gain 2 Foam.
- While on board: +42 Oblivion per card played while on board.
- While on board: Whenever you play an Eternal Seas Ophanim, look at the top 2 cards; keep 1 and bottom 1.
- [Trace Margin]: Gain +1 Undertow.
- Attack (Primary): Boundary Cleave
  - damage 450 / discard 0 / cooldown 5 (round(450/100) - 0 = 5)
- Attack (Exalted): Veilmargin Verdict
  - damage 780 / discard 0 / cooldown 8 (round(780/100) - 0 = 8)
- Synergy note: Turns Ophanim-heavy builds into consistent card-quality filtering.
- [changed: effects | damage | cooldown]

### Veleth, Undying Water (Angel card)
- Tier: Base
- Element/typing: EternalSeas
- Summon materials: Veleth Itself Echo, Null Leviathan Sign
- Extra summon materials: None
- On summon: Gain 8 Undertow, gain 3 Foam.
- After 4 cards played: Release up to 7 Undertow (+170 Oblivion per Undertow spent, +1 Foam per Undertow spent).
- While on board: +18 attack power for each Eternal Seas Seraphim on board.
- [Undying Confluence]: Spend 4 Foam; draw 2 cards.
- Attack (Primary): Ocean Edict
  - damage 740 / discard 0 / cooldown 7 (round(740/100) - 0 = 7)
- Attack (Exalted): Undying Confluence
  - damage 1300 / discard 1 / cooldown 12 (round(1300/100) - 1 = 12)
- Synergy note: Uses Foam stockpiles from release turns to sustain late-cycle card flow.
- [changed: effects | damage | cooldown]

## Eternal Cards (5)

### Thyrvaan Oldlight Grid (Ophanim card)
- Tier: Eternal
- Element/typing: EternalSeas
- On play: Gain 4 Undertow, gain 1 Deepwake.
- Surge up to 1 Deepwake (+1 Undertow per Deepwake, then release up to 4 Undertow at +136 Oblivion per Undertow with +32 per Deepwake, +1 Foam per Deepwake).
- Conditional: If your tide is balanced (Undertow/Foam difference 2 or less), draw 1 card.
- Synergy note: Establishes Deepwake tempo for Aeveleth, First Drift and Crown of Seven Margins.
- [changed: effects]

### Veleth Abyss Sounding (Ophanim card)
- Tier: Eternal
- Element/typing: EternalSeas
- On play: Gain 6 Undertow, gain 1 Deepwake.
- Surge up to 2 Deepwake (+1 Undertow per Deepwake, then release up to 5 Undertow at +138 Oblivion per Undertow with +28 per Deepwake, +1 Foam per Deepwake).
- If Deepwake was spent, draw 1 card.
- Synergy note: Reliable Deepwake surge bridge into Crown of Seven Margins activated turns.
- [changed: effects]

### Surevaan Anomaly Log (Cherubim card)
- Tier: Eternal
- Element/typing: EternalSeas
- On play: Gain 7 Undertow, gain 2 Deepwake, gain 1 Foam.
- While on board: Eternal Seas Seraphim bonuses are amplified by +0.16.
- While on board: The first Deepwake surge each turn grants +2 Foam.
- Synergy note: Powers Deepwake-focused Seraphim and angel finish turns.
- [changed: effects]

### Aeveleth, First Drift (Seraphim card)
- Tier: Eternal
- Element/typing: EternalSeas
- On play: Gain 6 Undertow, gain 2 Deepwake, gain 1 Foam.
- While on board: +30 Oblivion per card played while active.
- While on board: Whenever you gain Deepwake, gain +2 Undertow.
- Attack (Unsynergized): First Drift Break
  - damage 1040 / discard 1 / cooldown 9 (round(1040/100) - 1 = 9)
- Attack (Synergized): Elder Margin Break
  - damage 1820 / discard 2 / cooldown 15 (round(1820/100) - 2 = 16, clamp to 15)
- Synergy note: Converts Deepwake gain from Oldlight Grid/Abyss Sounding into immediate Undertow pressure.
- [changed: effects | damage | cooldown]

### Crown of Seven Margins (Angel card)
- Tier: Eternal
- Element/typing: EternalSeas
- Summon materials: Veilmargin Harbinger, Ossiveth Naur Ridgebody
- Extra summon materials: special condition; 2+ Seraphim on board; 1+ active Cherubim
- On summon: Gain 7 Undertow, gain 3 Deepwake, gain 1 Foam.
- After 3 cards played: Surge up to 3 Deepwake (+2 Undertow per Deepwake, then release all Undertow at +150 Oblivion per Undertow with +38 per Deepwake, +2 Foam per Deepwake).
- While on board: +56 Oblivion for each Eternal Seas Seraphim on board.
- [Sevenfold Margin]: Spend 2 Deepwake and 2 Foam; release all Undertow at +160 Oblivion per Undertow.
- Attack (Primary): Crownline Slash
  - damage 980 / discard 1 / cooldown 9 (round(980/100) - 1 = 9)
- Attack (Exalted): Sevenfold Verdict
  - damage 1860 / discard 3 / cooldown 15 (round(1860/100) - 3 = 16, clamp to 15)
- Synergy note: Endgame payoff for stacked Seraphim boards and multi-surge setup turns.
- [changed: effects | damage | cooldown]

## Infinity Cards (5)

### Aeveleth, Undying Revision (Ophanim card)
- Tier: Infinity
- Element/typing: EternalSeas
- On play: Gain 7 Undertow, gain 2 Deepwake.
- Surge up to 3 Deepwake (+1 Undertow per Deepwake, then release up to 6 Undertow at +176 Oblivion per Undertow with +40 per Deepwake, +1 Foam per Deepwake).
- Gain 2 Foam.
- If 3 Deepwake were surged, draw 1 card.
- Synergy note: High-ceiling setup piece for Seven Crowned Confluence kill turns.
- [changed: effects]

### Water That Was Always There (Ophanim card)
- Tier: Infinity
- Element/typing: EternalSeas
- On play: Gain 12 Undertow, gain 5 Deepwake, draw 1 card.
- Conditional: If tide is imbalanced by 6 or more, gain +3 Foam.
- Synergy note: Massive stockpile card for Crowned Confluence and Veleth Itself.
- [changed: effects]

### Veilmargin Cathedral (Cherubim card)
- Tier: Infinity
- Element/typing: EternalSeas
- On play: Gain 6 Undertow, gain 2 Deepwake.
- Surge up to 1 Deepwake (+2 Undertow per Deepwake, then release up to 2 Undertow at +150 Oblivion per Undertow with +44 per Deepwake, +2 Foam per Deepwake).
- While on board: Eternal Seas Seraphim and Angel attacks gain +122 base damage.
- While on board: Eternal Seas Seraphim bonuses are amplified by +0.22.
- While on board: After each Undertow release, gain +2 Undertow.
- Synergy note: Universal amplifier for all high-tier Eternal Seas attack lines.
- [changed: effects]

### Veleth Itself (Seraphim card)
- Tier: Infinity
- Element/typing: EternalSeas
- On play: Gain 9 Undertow, gain 4 Deepwake, gain 2 Foam.
- Surge up to 2 Deepwake (+1 Undertow per Deepwake, then release up to 7 Undertow at +172 Oblivion per Undertow with +36 per Deepwake, +1 Foam per Deepwake).
- While on board: +92 Oblivion per card played while active.
- While on board: If Undertow is 10 or more when you play a card, gain +1 Foam.
- Attack (Unsynergized): Total Depth Strike
  - damage 2100 / discard 2 / cooldown 15 (round(2100/100) - 2 = 19, clamp to 15)
- Attack (Synergized): World-Ocean Verdict
  - damage 3700 / discard 4 / cooldown 15 (round(3700/100) - 4 = 33, clamp to 15)
- Synergy note: Converts very high Undertow states into sustained Foam and capped heavy attacks.
- [changed: effects | damage | cooldown]

### Seven Crowned Confluence (Angel card)
- Tier: Infinity
- Element/typing: EternalSeas
- Summon materials: Crown of Seven Margins, Veleth Itself Echo
- Extra summon materials: special condition; 2+ Seraphim on board; 1+ active Cherubim
- On summon: Gain 8 Undertow, gain 4 Deepwake, gain 3 Foam.
- After 4 cards played: Surge up to 4 Deepwake (+3 Undertow per Deepwake, then release all Undertow at +184 Oblivion per Undertow with +46 per Deepwake, +2 Foam per Deepwake).
- While on board: +30 attack power for each Eternal Seas Seraphim on board.
- While on board: The first time each turn you spend Deepwake, draw 1 card.
- [Crownwave Collapse]: Spend 3 Deepwake and 3 Foam; release all Undertow at +200 Oblivion per Undertow, then gain +2 Foam.
- Attack (Primary): Crowned Torrent
  - damage 2040 / discard 3 / cooldown 15 (round(2040/100) - 3 = 17, clamp to 15)
- Attack (Exalted): Confluence Collapse
  - damage 3920 / discard 6 / cooldown 15 (round(3920/100) - 6 = 33, clamp to 15)
- Synergy note: Final finisher that cashes Deepwake+Foam banks built by Infinity Ophanim/Cherubim.
- [changed: effects | damage | cooldown]
