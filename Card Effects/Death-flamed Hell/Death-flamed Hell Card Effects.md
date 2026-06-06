# Death-flamed Hell - Card Abilities (Phase 1 Draft)

## Engine Extensions (for Phase 2)

1. `dfh_veil_marks_attack_bonus` (new effect type)
- Needed by: `Skull-ceiling Garrison`, `Vakhresh Marches Out`.
- Why existing primitives are insufficient: current `dfh_veil_marks_cashout` is immediate only and cannot attach Veil-Mark consumption directly to Seraphim attack resolution.
- Wiring (additive): add union member in `src/types/effects.ts`, execute in Seraphim attack path in `src/state/store.ts`, and formatter text in `src/ui/cardStatSummary.ts`. No existing effect behavior changes.

2. `dfh_angel_resonant_cashout` (new effect type)
- Needed by: `Othrak's Eternal Communion`, `The Final Communion of Halos`.
- Why existing primitives are insufficient: current engine has no DFH-specific "while DFH Angel is on board, cash Veil Marks now" payoff shape.
- Wiring (additive): add union member in `src/types/effects.ts`, executor case in `src/systems/cards/CardEffectExecutor.ts`, formatter in `src/ui/cardStatSummary.ts`. Existing cards unaffected.

3. `dfh_veil_marks_gte` (new condition)
- Needed by: Eternal/Infinity Ophanim cashout gates.
- Why existing primitives are insufficient: current conditions do not include a direct DFH Veil-Mark threshold check.
- Wiring (additive): add condition union in `src/types/effects.ts`, condition evaluator in `src/systems/cards/CardEffectExecutor.ts`, condition formatter in `src/ui/cardStatSummary.ts`.

4. Remove `dfh_eternal_veil_rite` (rule-17 compliance)
- Needed by: all Eternal/Infinity DFH cards that currently say "your next base reveal...".
- Why existing primitive must be removed: it is an explicit next-card/future-play empowerment pattern and violates the no-next-card rule.
- Wiring (non-breaking): remove the type and executor branch, replace DFH card payloads with immediate/on-board/on-attack concrete effects, and delete obsolete `dfhVeilOblivionPerMark` save key via migration. Other sets unaffected.

## Base Cards (41)

### Ash-petal Strewer (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 3 Pyre Embers.
- If you control another DFH Ophanim, gain +1 Cinder Crown.
- Synergy note: Turns on quickly with `Bell-ringer of the Hollow` and `Empty-aisle Walker`.
- [changed: effects]

### Bell-ringer of the Hollow (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 1 Pyre Ember and 1 Cinder Crown.
- If you have at least 3 Pyre Embers, draw 1 card then discard 1 card.
- Synergy note: Sets up Ember thresholds for `Choirhouse Conductor` and `Pyrelung's Exhalation`.
- [changed: effects]

### Bridegroom's Outrider (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 2 Pyre Embers.
- Salvage 1 DFH Base Ophanim from your discard pile.
- Synergy note: Rebuys `Veil-stitcher` and `Procession-lantern Custodian` lines.
- [changed: effects]

### Choirhouse Conductor (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 5 Pyre Embers and 1 Cinder Crown.
- If you have at least 5 Cinder Crowns, gain +2 Pyre Embers.
- Synergy note: Crown battery for `Sablecrown's Letter-bearer` and `Hollow-throne Coronation`.
- [changed: effects]

### Empty-aisle Walker (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 2 Pyre Embers and 1 Cinder Crown.
- Look at the top 2 cards of your deck; keep 1 in hand and discard the other.
- Synergy note: Filters into `The Wedding Procession Into the Living World` or Seraphim pieces.
- [changed: effects]

### Faceless Bridesmaid Choir (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 4 Pyre Embers and 1 Cinder Crown.
- If a DFH Cherubim is on board, gain +1 Cinder Crown.
- Synergy note: Peaks with `Stigmata-flame Confessor` and `Cathedral Anchorite`.
- [changed: effects]

### Funeral-march Drummer (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 3 Pyre Embers.
- If you discarded a card this turn, gain +2 Pyre Embers.
- Synergy note: Converts discard setups from `Pale Bridegroom's Page` and `Veil-stitcher`.
- [changed: effects]

### Hollow-throne Coronation (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 4 Pyre Embers and 2 Cinder Crowns.
- Spend up to 2 Cinder Crowns: gain 2 Pyre Embers per crown spent.
- Synergy note: Crown-to-Ember conversion fuels `The Bridal Procession Reaches the Living World`.
- [changed: effects]

### Hollowking's Vacant Page (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 3 Pyre Embers and 2 Cinder Crowns.
- If you control a DFH Seraphim, draw 1 card.
- Synergy note: Hand smoothing for `Soot-veiled Soldier` and `Ash-marrow Reaver` turns.
- [changed: effects]

### Pale Bridegroom's Page (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 1 Pyre Ember.
- Discard 1 card, then draw 2 cards.
- Synergy note: Enables discard-dependent payouts on `Funeral-march Drummer` and `Lullaby-Forgot Censer`.
- [changed: effects]

### Procession-lantern Custodian (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 2 Pyre Embers and 1 Cinder Crown.
- If you have at least 2 Cinder Crowns, salvage 1 DFH Base Cherubim from discard.
- Synergy note: Recurs `Marrow-Pilgrim` and `Penitent of Ash`.
- [changed: effects]

### Pyrelung's Exhalation (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 6 Pyre Embers.
- If you have at least 8 Pyre Embers after this resolves, gain 1 Cinder Crown.
- Synergy note: Fast Ember spike for `Pyrelung's Vassal` and `Pyrelung, The Breathless` lines.
- [changed: effects]

### Sablecrown's Letter-bearer (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 1 Pyre Ember and 3 Cinder Crowns.
- Spend 1 Cinder Crown: draw 1 card.
- Synergy note: Crown liquidity for `Sablecrown Herald` and `Sablecrown, The Unnamed`.
- [changed: effects]

### The Wedding Procession Into the Living World (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 8 Pyre Embers and 3 Cinder Crowns.
- If you have at least 10 Pyre Embers, cash out up to 3 Cinder Crowns (+110 Oblivion per crown).
- Synergy note: Converts wide Ember boards from `Choirhouse Conductor` and `Pyrelung's Exhalation`.
- [changed: effects]

### Veil-stitcher (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 2 Pyre Embers.
- Discard 1 card, then draw 2 cards.
- If a DFH Angel is on board, gain 1 Cinder Crown.
- Synergy note: Core cycler for `Mournshade, The Wickless` and `Veil-iorn, The Faceless Bride`.
- [changed: effects]

### Veiled Censer-bearer (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 3 Pyre Embers.
- If your hand has 5 or more cards, gain +1 Pyre Ember and +1 Cinder Crown.
- Synergy note: Rewards draw-heavy loops from `Pale Bridegroom's Page` and `Hollowking's Vacant Page`.
- [changed: effects]

### Wedding-that-wasn't Cantor (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 4 Pyre Embers and 3 Cinder Crowns.
- If you control a DFH Cherubim and DFH Seraphim, gain +1 Cinder Crown.
- Synergy note: Midgame bridge into `Council of the Seven Choirs` setup.
- [changed: effects]

### Wickless Litany (Base Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 1 Pyre Ember and 2 Cinder Crowns.
- If you have 4 or more Cinder Crowns, gain +2 Pyre Embers.
- Synergy note: Smooths both resources for `Mournshade, The Wickless` cadence turns.
- [changed: effects]

### Cathedral Anchorite (Base Cherubim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 3 Pyre Embers and 1 Cinder Crown.
- While on board: DFH Seraphim and Angel attacks gain +44 base Oblivion.
- If you have at least 4 Cinder Crowns, DFH Seraphim attack cooldowns are reduced by 1 (minimum 1).
- Synergy note: Cooldown support for `Soot-veiled Soldier` and `Last-breath Standard Bearer`.
- [changed: effects]

### Cinder-saint, Othrak (Base Cherubim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 4 Pyre Embers and 2 Cinder Crowns.
- While on board: DFH Seraphim and Angel attacks gain +60 base Oblivion.
- When a DFH Angel is summoned, gain 2 Cinder Crowns.
- Synergy note: Explodes with `Council of the Seven Choirs` and `Sablecrown, The Unnamed`.
- [changed: effects]

### Halo-cracked Novice (Base Cherubim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 1 Pyre Ember.
- While on board: DFH Seraphim and Angel attacks gain +18 base Oblivion.
- The first DFH Ophanim you play each turn gains +1 Pyre Ember on resolution.
- Synergy note: Early value with `Ash-petal Strewer` and `Bell-ringer of the Hollow`.
- [changed: effects]

### Marrow-Pilgrim (Base Cherubim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 1 Pyre Ember and 1 Cinder Crown.
- While on board: DFH Seraphim and Angel attacks gain +20 base Oblivion.
- If you discard a card, gain 1 Cinder Crown (once each turn).
- Synergy note: Converts `Veil-stitcher` and `Pale Bridegroom's Page` into Crown growth.
- [changed: effects]

### Othrak's Confessor (Base Cherubim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 4 Pyre Embers and 2 Cinder Crowns.
- While on board: DFH Seraphim and Angel attacks gain +42 base Oblivion.
- Spend 2 Cinder Crowns: gain 3 Pyre Embers (once each turn).
- Synergy note: Crown-to-Ember conversion for `Pyrelung's Exhalation` thresholds.
- [changed: effects]

### Penitent of Ash (Base Cherubim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 2 Pyre Embers.
- Discard 1 card, then draw 1 card.
- While on board: DFH Seraphim and Angel attacks gain +22 base Oblivion.
- Synergy note: Stabilizes discard engines feeding `Funeral-march Drummer`.
- [changed: effects]

### Reliquary of the Last Tongue (Base Cherubim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 5 Pyre Embers.
- While on board: DFH Seraphim and Angel attacks gain +30 base Oblivion.
- If you control 2 or more DFH Ophanim, gain 1 Cinder Crown at end of turn.
- Synergy note: Wants wide Ophanim boards from `Empty-aisle Walker` and `Wedding-that-wasn't Cantor`.
- [changed: effects]

### Severed-sanctity Hierophant (Base Cherubim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 2 Pyre Embers and 2 Cinder Crowns.
- While on board: DFH Seraphim and Angel attacks gain +32 base Oblivion.
- When you cash out Cinder Crowns, draw 1 card (once each turn).
- Synergy note: Pair with `Sablecrown, The Unnamed` and `Council of the Seven Choirs`.
- [changed: effects]

### Stigmata-flame Confessor (Base Cherubim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 2 Pyre Embers and 1 Cinder Crown.
- While on board: DFH Seraphim and Angel attacks gain +28 base Oblivion.
- If you gained Veil Marks this turn, gain 1 Pyre Ember.
- Synergy note: Bridges base into `Crimson Cinder-Rain` and `Skull-ceiling Garrison` turns.
- [changed: effects]

### The Flayed Halo (Base Cherubim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 4 Pyre Embers and 3 Cinder Crowns.
- Discard 1 card, then draw 2 cards.
- While on board: Your DFH card effects gain +60% Oblivion cashout value.
- Synergy note: Multiplies payoff from `Sablecrown, The Unnamed` and `The Death-flame Escaping Upward`.
- [changed: effects]

### Ash-marrow Reaver (Base Seraphim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 2 Pyre Embers and 1 Cinder Crown.
- While on board: +18 Oblivion per DFH card played while active.
- Attack (Unsynergized): Marrow Rend - damage 420 / discard 0 / cooldown 4 (`round(420/100) - 0 = 4`).
- Attack (Synergized): Ash-Marrow Verdict - damage 760 / discard 0 / cooldown 8 (`round(760/100) - 0 = 8`).
- Synergy note: Strong with `Cathedral Anchorite` and `Sablecrown's Letter-bearer`.
- [changed: effects | damage | cooldown]

### Choirhouse Cantor (Base Seraphim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 4 Pyre Embers.
- While on board: +34 Oblivion per DFH card played while active.
- If you control 2 or more DFH Ophanim, your unsynergized attack gains +80 base Oblivion.
- Attack (Unsynergized): Choir Note - damage 460 / discard 0 / cooldown 5 (`round(460/100) - 0 = 5`).
- Attack (Synergized): Cantor Verdict - damage 820 / discard 0 / cooldown 8 (`round(820/100) - 0 = 8`).
- Synergy note: Built for Ophanim swarms from `Faceless Bridesmaid Choir` and `Veiled Censer-bearer`.
- [changed: effects | damage | cooldown]

### Khorr-vael, The No-face (Base Seraphim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 5 Pyre Embers and 3 Cinder Crowns.
- While on board: +90 Oblivion per DFH card played while active.
- Spend up to 3 Cinder Crowns when declaring a synergized attack: +70 damage per crown spent.
- Attack (Unsynergized): No-face Strike - damage 760 / discard 0 / cooldown 8 (`round(760/100) - 0 = 8`).
- Attack (Synergized): Faceless Verdict - damage 1320 / discard 0 / cooldown 13 (`round(1320/100) - 0 = 13`).
- Synergy note: Crown sink for `Wedding-that-wasn't Cantor` and `Cinder-saint, Othrak`.
- [changed: effects | damage | cooldown]

### Last-breath Standard Bearer (Base Seraphim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 1 Pyre Ember and 1 Cinder Crown.
- While on board: +22 Oblivion per DFH card played while active.
- If you have exactly 0 cards in discard, gain +2 Cinder Crowns.
- Attack (Unsynergized): Standard Strike - damage 360 / discard 0 / cooldown 4 (`round(360/100) - 0 = 4`).
- Attack (Synergized): Last-breath Verdict - damage 620 / discard 0 / cooldown 6 (`round(620/100) - 0 = 6`).
- Synergy note: Clean-loop opener before discard lines from `Penitent of Ash`.
- [changed: effects | damage | cooldown]

### Lullaby-Forgot Censer (Base Seraphim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 2 Pyre Embers.
- Discard 1 card, then draw 1 card.
- While on board: +16 Oblivion per DFH card played while active.
- Attack (Unsynergized): Lullaby Cut - damage 340 / discard 1 / cooldown 2 (`round(340/100) - 1 = 2`).
- Attack (Synergized): Forgot Hymn - damage 610 / discard 1 / cooldown 5 (`round(610/100) - 1 = 5`).
- Synergy note: Discard-cost attacks align with `Marrow-Pilgrim` and `Funeral-march Drummer` triggers.
- [changed: effects | damage | cooldown]

### Pyrelung's Vassal (Base Seraphim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 2 Pyre Embers and 2 Cinder Crowns.
- While on board: +20 Oblivion per DFH card played while active.
- Spend 2 Pyre Embers: gain +120 damage to your next unsynergized attack this turn.
- Attack (Unsynergized): Vassal Lash - damage 500 / discard 0 / cooldown 5 (`round(500/100) - 0 = 5`).
- Attack (Synergized): Pyrelung Verdict - damage 900 / discard 0 / cooldown 9 (`round(900/100) - 0 = 9`).
- Synergy note: Ember-heavy spikes from `Pyrelung's Exhalation` and `Hollow-throne Coronation`.
- [changed: effects | damage | cooldown]

### Sablecrown Herald (Base Seraphim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 5 Pyre Embers and 2 Cinder Crowns.
- While on board: +24 Oblivion per DFH card played while active.
- When you cash out Cinder Crowns, gain +1 Pyre Ember per 2 crowns consumed.
- Attack (Unsynergized): Sable Edict - damage 620 / discard 0 / cooldown 6 (`round(620/100) - 0 = 6`).
- Attack (Synergized): Herald of the Crown - damage 1080 / discard 0 / cooldown 11 (`round(1080/100) - 0 = 11`).
- Synergy note: Directly feeds `Sablecrown, The Unnamed` and `Council of the Seven Choirs` cashouts.
- [changed: effects | damage | cooldown]

### Soot-veiled Soldier (Base Seraphim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 3 Pyre Embers.
- While on board: +12 Oblivion per DFH card played while active.
- If this is your first Seraphim on board, gain 1 Cinder Crown.
- Attack (Unsynergized): Soot Cut - damage 320 / discard 0 / cooldown 3 (`round(320/100) - 0 = 3`).
- Attack (Synergized): Veiled March - damage 540 / discard 0 / cooldown 5 (`round(540/100) - 0 = 5`).
- Synergy note: Smooth early bridge into `Mournshade, The Wickless` summoning.
- [changed: effects | damage | cooldown]

### Council of the Seven Choirs (Base Angel)
- Element/typing: `DeathFlamedHell`
- Summon materials: `Khorr-vael, The No-face`, `Pyrelung's Vassal`
- On summon: Gain 8 Pyre Embers and 6 Cinder Crowns.
- After 4 DFH cards played this turn: cash out up to 12 Cinder Crowns (+170 Oblivion per crown).
- While on board: DFH cards gain +0.14 Oblivion per card played while active.
- [Seven-Choir Verdict]: cash out up to 12 Cinder Crowns (+170 Oblivion per crown).
- Attack (Primary): Council Edict - damage 980 / discard 1 / cooldown 9 (`round(980/100) - 1 = 9`).
- Attack (Exalted): Seven-Choir Apex - damage 1620 / discard 2 / cooldown 14 (`round(1620/100) - 2 = 14`).
- Synergy note: Apex crown finisher with `Sablecrown Herald` and `Severed-sanctity Hierophant`.
- [changed: effects | damage | cooldown]

### Mournshade, The Wickless (Base Angel)
- Element/typing: `DeathFlamedHell`
- Summon materials: `Soot-veiled Soldier`, `Ash-marrow Reaver`
- On summon: Gain 4 Pyre Embers and 2 Cinder Crowns.
- After 2 DFH cards played this turn: gain 2 Pyre Embers and draw 1 card.
- While on board: DFH cards gain +0.09 Oblivion per card played while active.
- [Wickless Pulse]: gain 3 Pyre Embers; if you discarded this turn, gain 1 Cinder Crown.
- Attack (Primary): Wickless Cut - damage 860 / discard 1 / cooldown 8 (`round(860/100) - 1 = 8`).
- Attack (Exalted): Mournshade Verdict - damage 1460 / discard 2 / cooldown 13 (`round(1460/100) - 2 = 13`).
- Synergy note: Draw-discard sequencing with `Veil-stitcher` and `Penitent of Ash`.
- [changed: effects | damage | cooldown]

### Pyrelung, The Breathless (Base Angel)
- Element/typing: `DeathFlamedHell`
- Summon materials: `Pyrelung's Vassal`, `Choirhouse Cantor`
- On summon: Gain 5 Pyre Embers and 3 Cinder Crowns.
- After 3 DFH cards played this turn: gain 4 Pyre Embers and 1 Veil Mark.
- While on board: +62 Oblivion per DFH card played while active.
- [Breathless Exhale]: gain 4 Pyre Embers; if you have 8+ Pyre Embers, gain +1 Veil Mark.
- Attack (Primary): Breathless Strike - damage 900 / discard 1 / cooldown 8 (`round(900/100) - 1 = 8`).
- Attack (Exalted): Pyrelung Verdict - damage 1520 / discard 2 / cooldown 13 (`round(1520/100) - 2 = 13`).
- Synergy note: First Angel that can seed Veil Marks for `Crimson Cinder-Rain`.
- [changed: effects | damage | cooldown]

### Sablecrown, The Unnamed (Base Angel)
- Element/typing: `DeathFlamedHell`
- Summon materials: `Sablecrown Herald`, `Ash-marrow Reaver`
- On summon: Gain 6 Pyre Embers and 5 Cinder Crowns.
- After 3 DFH cards played this turn: cash out up to 8 Cinder Crowns (+130 Oblivion per crown).
- While on board: DFH cards gain +0.11 Oblivion per card played while active.
- [Unnamed Coronation]: cash out up to 8 Cinder Crowns (+130 Oblivion per crown).
- Attack (Primary): Sable Edict - damage 940 / discard 1 / cooldown 8 (`round(940/100) - 1 = 8`).
- Attack (Exalted): Unnamed Verdict - damage 1580 / discard 2 / cooldown 14 (`round(1580/100) - 2 = 14`).
- Synergy note: Crown conversion endpoint for `Sablecrown's Letter-bearer` and `Wedding-that-wasn't Cantor`.
- [changed: effects | damage | cooldown]

### Veil-iorn, The Faceless Bride (Base Angel)
- Element/typing: `DeathFlamedHell`
- Summon materials: `Khorr-vael, The No-face`, `Sablecrown Herald`
- On summon: Gain 6 Pyre Embers, 4 Cinder Crowns, and 2 Veil Marks.
- After 4 DFH cards played this turn: gain 2 Veil Marks and 2 Cinder Crowns.
- While on board: +72 Oblivion per DFH card played while active.
- [Bridal Veil]: gain 3 Veil Marks; then cash out up to 3 Veil Marks (+210 Oblivion per mark).
- Attack (Primary): Faceless Cut - damage 960 / discard 1 / cooldown 9 (`round(960/100) - 1 = 9`).
- Attack (Exalted): Veil-iorn Verdict - damage 1600 / discard 2 / cooldown 14 (`round(1600/100) - 2 = 14`).
- Synergy note: Base-tier Veil-Mark bridge into Eternal/Infinity payoff cards.
- [changed: effects | damage | cooldown]

## Eternal Cards (4)

### Crimson Cinder-Rain (Eternal Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 6 Veil Marks.
- If you have at least 4 Cinder Crowns, cash out up to 6 Veil Marks (+205 Oblivion per mark).
- Otherwise, amplify current Veil Marks by x1.25.
- Draw 1 card.
- Synergy note: Splits between immediate payout and setup with `The Eternal Procession of the Veiled`.
- [changed: effects]

### The Eternal Procession of the Veiled (Eternal Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 8 Veil Marks.
- Amplify current Veil Marks by x1.5.
- If `dfh_veil_marks_gte 12`, cash out up to 4 Veil Marks (+220 Oblivion per mark).
- Synergy note: Main Veil-Marks scaler for `Vakhresh Marches Out` and `The Death-flame Escaping Upward`.
- [changed: effects]

### Othrak's Eternal Communion (Eternal Cherubim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 7 Veil Marks and 3 Cinder Crowns.
- While on board: Buff DFH Seraphim and Angel attacks by +80 base Oblivion and cooldown -1.
- While a DFH Angel is on board, trigger `dfh_angel_resonant_cashout` once each turn: cash out up to 5 Veil Marks (+180 Oblivion per mark).
- Synergy note: Converts Angel board states from `Pyrelung, The Breathless` and `Council of the Seven Choirs`.
- [changed: effects]

### Skull-ceiling Garrison (Eternal Seraphim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 6 Veil Marks and 3 Pyre Embers.
- While on board: +0.13 Oblivion per DFH card played while active.
- Synergized attack gains `dfh_veil_marks_attack_bonus`: consume up to 8 Veil Marks for +95 Oblivion per mark consumed.
- Attack (Unsynergized): Garrison Strike - damage 980 / discard 1 / cooldown 9 (`round(980/100) - 1 = 9`).
- Attack (Synergized): Skull-ceiling Verdict - damage 1580 / discard 2 / cooldown 14 (`round(1580/100) - 2 = 14`).
- Synergy note: Veil conversion finisher with `Crimson Cinder-Rain` and `Veil-iorn, The Faceless Bride`.
- [changed: effects | damage | cooldown]

## Infinity Cards (4)

### The Bridal Procession Reaches the Living World (Infinity Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 10 Pyre Embers and 4 Veil Marks.
- Transmute up to 10 Pyre Embers into Veil Marks (1.5 marks each).
- If `dfh_veil_marks_gte 10`, cash out up to 10 Veil Marks (+230 Oblivion per mark).
- Synergy note: Ember-to-Mark closer with `Pyrelung's Exhalation` and `Hollow-throne Coronation`.
- [changed: effects]

### The Death-flame Escaping Upward (Infinity Ophanim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 10 Cinder Crowns and 5 Veil Marks.
- Transmute all Cinder Crowns into Veil Marks (2.0 marks each).
- Cash out up to 12 Veil Marks (+300 Oblivion per mark).
- Synergy note: Crown apex paired with `Sablecrown, The Unnamed` and `Council of the Seven Choirs`.
- [changed: effects]

### The Final Communion of Halos (Infinity Cherubim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 10 Veil Marks and amplify current Veil Marks by x2.0.
- While on board: DFH Seraphim and Angel attacks gain +200 base Oblivion.
- While a DFH Angel is on board, trigger `dfh_angel_resonant_cashout` once each turn: cash out up to 8 Veil Marks (+235 Oblivion per mark).
- Synergy note: High-ceiling payoff with `Veil-iorn, The Faceless Bride` and `Council of the Seven Choirs`.
- [changed: effects]

### Vakhresh Marches Out (Infinity Seraphim)
- Element/typing: `DeathFlamedHell`
- On play: Gain 14 Veil Marks and 6 Pyre Embers.
- Cash out up to 8 Veil Marks (+260 Oblivion per mark).
- While on board: +0.30 Oblivion per DFH card played while active.
- Synergized attack gains `dfh_veil_marks_attack_bonus`: consume up to 10 Veil Marks for +120 Oblivion per mark consumed.
- Attack (Unsynergized): Vakhresh Marches - damage 1480 / discard 2 / cooldown 13 (`round(1480/100) - 2 = 13`).
- Attack (Synergized): March of the Dead-flame - damage 2260 / discard 4 / cooldown 15 (`round(2260/100) - 4 = 19`, clamp to 15).
- Synergy note: Final Veil-Marks sink after setup from `The Eternal Procession of the Veiled` and `The Final Communion of Halos`.
- [changed: effects | damage | cooldown]
