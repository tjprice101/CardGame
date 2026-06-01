# CLAUDE.md — Card Game Design Rules

This file governs how to approach all work on this project. It covers game design rules, balance philosophy, and UI/UX standards. Always read this before making design decisions or adding new content.

---

## Game Overview

A **turn-based card game**. Each turn the player draws a hand, plays cards to earn **Oblivion** (the primary currency), then ends the turn. The game loop is: play cards → earn Oblivion → spend Oblivion on card packs → open packs to expand collection → build a better deck → repeat.

There is **no idle tick loop**. Oblivion is earned exclusively by playing cards. A **chain multiplier** grows as more cards are played in a single turn, rewarding long chains. Seraphim and Angels on the board also fire **attacks** periodically as cards are played, dealing additional Oblivion.

---

## Game Modes

### Main Game
The core loop: play turns, earn Oblivion, open packs, build a collection and deck.

### Eternity's Wake
A **boss challenge** mode. The player fights one boss per session using their current deck. Bosses have HP that is depleted by Oblivion earned during the fight. Completing a boss drops an **Eternal** rarity card. Bosses are per-set and unlock based on progression. Accessed from the main menu.

### Infinitude
A **crafting** mode. **Infinite** rarity cards are forged by consuming specific combinations of Eternal cards, defined by `InfiniteRecipe` entries in `src/data/cards/infiniteCards.ts`. Visibility is recipe-driven — a set's Infinite cards only appear in Infinitude if the recipes exist.

---

## Board Layout

```
[ S0 ] [ S1 ] [ S2 ] [ S3 ] [ S4 ]   ← front row: 5 Seraphim/Angel slots
   [ C0 ]  [ C1 ]  [ C2 ]  [ C3 ]    ← back row: 4 Cherubim slots, staggered
```

- **Front slots (5)**: hold Seraphim and Angels. Both go away at turn end — Seraphim to the discard pile, Angels simply cleared (they're extra-deck cards, not discarded). Angels must be re-summoned each turn.
- **Back slots (4)**: hold Cherubim cards. Each Cherubim card has a **durability** counter; it expires to the discard when durability reaches 0. All Cherubim also go to discard at turn end.
- `backSlots[i]` is adjacent to `frontSlots[i]` and `frontSlots[i+1]`.

---

## Card Types

| Type | Zone | Behavior |
|---|---|---|
| **Angel** | Extra deck | Summoned from extra deck when conditions met. Stays on board. Has attacks. |
| **Seraphim** | Main deck | Placed to front row. On-play effect fires. Passive bonus + attack while on board. Discarded at turn end. |
| **Cherubim** | Main deck | Placed to back row. Passive effect applies to adjacent front slots. Has durability. |
| **Ophanim** | Main deck | Played from hand. Immediate effect. No board presence. |

There are **no `cardSubtype` fields** on any card definition. There is **no `HeavenlyRetribution` type**. The four types above are the only valid `type` values.

---

## Rarity Tiers

| Rarity | Source | Notes |
|---|---|---|
| Common | Card packs | Weak and simple |
| Rare | Card packs | Noticeably stronger |
| Epic | Card packs | Impactful and interesting |
| Legendary | Card packs | Rare and dramatic |
| Eternal | Eternity's Wake boss rewards | Much more powerful; Seraphim get higher patience thresholds and draws; Cherubim give more Patience per card |
| Infinite | Crafted via Infinitude (consuming specific Eternals) | Apex power level; Seraphim get patienceThreshold 8+; Angels have `patience_double_all` in activated abilities |

Rarity is **feel-based**, not rule-based. No strict effect-type restrictions per tier (except Eternal/Infinite scale values appropriately).

---

## Angel / Extra Deck System

- Angels are **not in the main deck**. They are held in a separate **extra deck** (up to 5 Angels, max 2 copies per definition).
- Angels can be **summoned at any point during your turn** when summon conditions are met — no card draw required.
- **Summon cost:** Each Angel lists specific Seraphim that must be on the board. When summoned, those Seraphim are sent to the discard pile. Seraphim recovered via salvage can be replayed and used again.
- Multiple Angels can be active simultaneously (no hard cap beyond available front slots).
- Angel summon does **not** count as playing a card — it does not decrement Cherubim durability or advance the chain.
- Angels have `onSummonEffects`, an optional `activatedAbility` (fires after N cards played), and `primary`/`exalted` attack modes.

---

## Seraphim & Angel Attacks

Seraphim and Angels have attack stats that fire periodically as cards are played during the turn.

- **Seraphim attacks**: `unsynergized` and `synergized` modes. Synergized requires an Angel on board (or matching element Angel). `cooldownCards` sets how many cards must be played between attacks.
- **Angel attacks**: `primary` and `exalted` modes. Exalted typically has a cost (discard N cards) and higher output.
- Attack stats: `baseOblivion`, `cooldownCards`, `chainScaling`, `costs`, optional `requiresAngelOnBoard`.
- **Attack cooldown floor**: always at least 1 card after firing to prevent immediate re-fire loops.
- Seraphim unsynergized attacks always have an element-appropriate resource cost injected by `CardRegistry` (discard for Neutrality/Dark, resource spend for others).
- Discard-cost attacks require explicit `paymentSelection` — the store does not auto-pick.

---

## Oblivion & Chain Multiplier

- **Oblivion** is the primary currency. Earned by playing cards and from Seraphim/Angel attacks. Spent in the Card Pack Store.
- **Chain multiplier** = `1.0 + cardsPlayedThisTurn × 0.1`. Each card played earns more Oblivion than the last.
- Base Oblivion per card = `5 × chainMultiplier + Seraphim bonuses + Cherubim adjacency bonuses + card-specific bonuses`.
- Some Seraphim have `chain_bonus`: adds to chain growth rate while on board.
- Chain resets to 1.0 at turn end.

### Chain Terminology Rule
- `chain floor` is deprecated and must not be introduced in new cards, effects, descriptions, UI copy, scripts, or tests.
- Use `chain gain` language instead (for example: `Gain +1.6 chain`).
- Use `chain_gain` effect entries for additive chain effects.

---

## Naming Conventions

**Set name vs. element key** — these are distinct and must not be confused:

| Set Name | Element Key |
|---|---|
| Neutrality | `Neutrality` |
| Heavenly Light | `Light` |
| Pyroabyss | `Fire` |
| Thornbound Plains | `Thornbound` |
| Snowbound Voltage | `Snowbound` |
| Mechanical Dreams | `Mechanical` |
| Prismatic Accord | `Prismatic` |
| Black Glass Inferno | `Dark` |
| Glass Absolute | `Glass` |
| Blazing Garden | `BlazeGarden` (or `BurningGarden`) |

- **Set name** is what players see in the UI. **Element key** is the internal value stored on card definitions.
- Use `ELEMENT_SET_NAMES` from `src/data/elements.ts` to convert. Never display raw element keys to the player.

---

## Current Sets & Their Mechanics

Each set has a **distinct primary mechanic** that defines its strategic identity. Overlap is acceptable but the primary identity must remain clear.

### Neutrality — "Patience / Stasis"
- **Patience** is the core mechanic. Seraphim with `patienceThreshold` defined auto-accumulate +1 Patience per card played. Cherubim give additional Patience per card to adjacent front slots via the `cherubim_patience_per_card` passive.
- **On attack**: each accumulated Patience stack is consumed for +15 Oblivion. If total stacks ≥ `patienceThreshold`, also draws `patienceThresholdDraw` cards.
- Ophanim: draw/deck manipulation, chain gain setup. Key effects: `patience_gain_all` (instant Patience burst for all Seraphim), `patience_double_all` (double all Patience).
- Angels: mass Patience injection on summon; `patience_double_all` in activated abilities.
- Beginner-friendly. Universal Synergy Angel activates all Seraphim regardless of element. Salvage loop enabled by Ophanim like Seraph Recall.
- **Patience thresholds by rarity**: Common/Rare 3–4, Epic 5, Eternal 6, Infinite 8+.
- **Patience per card by Cherubim rarity**: Common +1, Rare +2, Epic +3, Eternal +4–5, Infinite +6–8.

### Heavenly Light — "Radiance"
- **Cadence** tracks the current note sequence and rewards variety.
- **Radiance** is a per-turn fuel counter that resets at turn end.
- Cards generate Radiance, spend Radiance, or scale off current Radiance.
- Radiance is **exclusive to Heavenly Light**. No other element may use `radiance_gain`, `radiance_spend`, `radiance_double`, or any Radiance effect.
- **Halo** is the Eternity/Infinity-only ancillary: Eternal and Infinite Light cards stack Halo via `eternal_stack_gain stack:'light'` and spend/cash it via threshold and cashout effects.
- Heavenly Light should read as a two-resource engine: build Cadence cleanly, then spend Radiance and Halo to convert into a focused burst.

### Pyroabyss — "Embers"
- **Inferno Tiers** are the core Fire stack. Base Fire cards primarily build Inferno Tiers, and Fire Seraphim/Angel attacks scale from them (`+2.5%` per Inferno Tier, max `+75%`).
- **Chroma Embers** are the higher-rarity cashout layer. Eternal and Infinite Fire cards explicitly generate and spend Chroma Embers through their own effects.
- **Ignite** converts Chroma Embers into burst Oblivion; it is the main Fire cashout action rather than a reset of the Inferno engine.
- **Higher-rarity Fire attacks** also consume Chroma Embers for bonus scaling: Eternal Fire attacks gain `+4%` per Chroma Ember (max `+16%`), Infinite Fire attacks gain `+5%` per Chroma Ember (max `+25%`).
- Pyroabyss should read as a two-layer engine: build Inferno first, seed Chroma second, then choose between ignite payoffs and Chroma-fueled higher-rarity attacks.

### Thornbound Plains — "Trail / Scar"
- **Trail** is the base resource. Accumulated via card plays, spent on high-power effects and attack costs.
- **Scar** is built only by the manual Trail→Scar HUD orb (1 Trail → 1 Scar). Base cards check Scar thresholds (`scar_count_gte`) for riders.
- **Briar Spiral** (`set_secondary_*` kind:'thorn', `thorn_briar_spiral_bloom`) is the sole Eternal/Infinity ancillary — generators stack it, bloom cards spend it for Trail + Oblivion bursts.
- Extra Cherubim plays per turn (`cherubim_extra_plays` bonusType) is a Thornbound Seraphim trait.

### Snowbound Voltage — "Frost / Voltage / Arctic Charge"
- **Arctic Charge** is the core Snowbound resource.
- Frost cards build Arctic Charge; Voltage cards cash it out into Oblivion output.

### Mechanical Dreams — "Strain / Reactor Core"
- **Strain** is the core resource. Most Mechanical cards `strain_gain`/`strain_vent`; `spend_strain` is a real attack cost; `overclock` consumes Strain to unlock an inline effect block. Strain in the 6–12 band amplifies all Mechanical oblivion.
- **Reactor Core** (`eternal_stack_*` stack:'mech') is the sole Eternal/Infinity ancillary. Eternal/Infinite cards gain, spend, or cash out Reactor Cores for burst payoffs.

### Prismatic Accord — "Prism Charge / Channels"
- **Core mechanic — Prism Charge (Node Charges):** every channel switch grants +1 Prism Charge (capped at 3) and is spent via `prismatic_charge_spend`. Tracked on `turn.prismaticNodeCharges`.
- **Ancillary 1 — Distinct Channels:** unique channels played this turn (`prismaticDistinctChannels`), gated via `prismatic_distinct_channels_gte`.
- **Ancillary 2 — Refraction Depth:** switching channels increases `prismaticRefractionDepth` by 1 (or 2 with multiplier), capped at 9; gated via `prismatic_refraction_depth_gte`.
- **Ancillary 3 — Resonance Charge:** Eternal/Infinite overlay. Prismatic Eternity and Infinite cards build/spend Resonance Charge via `resonance_charge_gain` / `resonance_charge_spend`, gated via `resonance_charge_gte`.
- **Removed/deprecated (do not re-introduce):** channel locks, memory shards, storm memories, switch-depth marks, accord channel, refraction echoes, echo cascade, chord scoring, refraction spikes, sentencing chains, lattice resonance. Save migration silently strips these legacy fields.
- **Board fields kept:** `prismaticDepth` and `spectrumTokens` on card instances remain live for Glass Absolute formations and `refractSpectrumTokens`. They no longer contribute a chord bonus inside `ScoreSystem`.

### Black Glass Inferno — "Twin Flames / Fracture / Eclipse"
- **Core (base loop):** every base Seraphim/Cherubim/Ophanim seeds **Monochromatic Shards** (gated by `shards_gte`, spent via `monochromatic_shards_spend`) and **Twin Flames** — `black_glass_white_flame_gain` / `black_glass_black_flame_gain`. Both flames cap at 30; tracked on TurnState as `blackGlassWhiteFlame`/`blackGlassBlackFlame`, with `blackGlassLastPolarity` updated by `applyBlackGlassPlayState`. Conditions: `black_glass_white_flame_gte`, `black_glass_black_flame_gte`, `black_glass_flames_equal`.
- **Ancillary 1 (Eternal/Infinite): Fracture.** Built when flames are balanced via `black_glass_fracture_gain` (`blackGlassFracture`, caps 18). Gated by `black_glass_fracture_gte`; collapsed for payoff via `black_glass_fracture_collapse`. Scales Eclipse bursts (`fractureBonusPerEclipse`). Setup-ready = fracture ≥ 2; engines-ready = `min(white,black) ≥ 6 && |white-black| ≤ 2` (see `getDarkFullFireMultiplier`).
- **Ancillary 2 (Eternal/Infinite): Eclipse.** Uses `eternal_stack_gain`/`eternal_stack_consume` with `stack: 'glass'`, cashed via `black_glass_eclipse_burst` (per-Eclipse Oblivion plus `balanceBonusPerEclipse` × `max(0, 3 - |W-B|)` and `fractureBonusPerEclipse` × Fracture). `black_glass_flames_swap` (1 Infinite card) inverts White/Black for control plays.
- Dark element; uses `cherubim_adjacent_seraphim_bonus` passives (Oblivion/chain to adjacent Seraphim attacks).
- `blackGlassLastPayoff` is HUD-only (auto-written by store on burst, displayed in `setEngineSummary`).
- **Deprecated/removed (Nov 2025 audit):** `blackGlassGriefOaths`, `blackGlassCollapsePending` TurnState fields; `black_glass_register_state` effect (all 3 keys); `black_glass_flame_delta_gte` / `black_glass_flame_delta_lte` conditions. Two cards (`btei-bgi-elegy-of-veth-serath`, `inf-bgi-midplace-apocalypse`) had `register_state` lines stripped from their effect arrays + descriptions.

### Glass Absolute — "Fragments & Formation"
- Base loop is fragments-first: fill the board with Glass cards and cash tiered formation bonuses (3/5/7 fragments).
- Eternal and Infinite cards share one ancillary overlay: Refraction Charge. Eternal lines build/spend charge for conversion windows, and Infinite lines use stronger charge thresholds with queue/floor/ledger riders.

### Blazing Garden — "Burn / Ember Grove / Echo / Wild Pollen"
- **Ember Grove** is persistent board state (survives across turns, unlike per-turn resources).
- Base loop: maintain **Burn uptime**, branch Rose/Sunflower/Thistle lineages, then convert Grove seeds into Echo turns.
- One-per-turn **echo** remains, with additional free-echo gain from specific card effects.
- End-turn: char converts to Ember Grove. Seraphim have dedicated BlazeGarden instance initialization.
- **Wild Pollen** is the higher-rarity ancillary mechanic: Eternal cards generate it, and Eternal/Infinite seed effects spend it for amplified Oblivion and score payout.

### Eternal Seas — "Undertow / Foam / Deepwake"
- **Undertow** is the base same-turn setup pool. Base cards build Undertow and cash it through `seas_undertow_release` for direct Oblivion.
- **Foam** is the support layer. Base release lines often skim Foam, and the HUD action spends 5 Foam to draw 1 card.
- **Deepwake** is the shared higher-rarity overlay (Eternal and Infinite). Deepwake surge effects (`seas_deepwake_surge`) amplify Undertow conversion and optional Foam return.
- Legacy **Current/Polarity/Tide Echo** fields may still exist for compatibility, but they are no longer the primary Eternal Seas base loop.

---

## Card Design Rules

### Descriptions
- Describe **only what the card does mechanically**. No strategic advice, tips, or flavor commentary.
- **Do include** parenthetical clarifiers for ambiguous mechanics (e.g., "(including this one)" for self-counting effects).
- **Do not include** phrases like: "Best played as…", "Save it for last", "Scales with…", "Requires board presence", "Better late/early in your turn", or any other play guidance.
- Card descriptions are canonical display text. The `scripts/rewrite-card-source-descriptions.mts` script can regenerate them from `cardStatSummary.ts` helpers; keep `CardSourceTextAudit.test.ts` green.

### Uniqueness
- Every card in a set should feel **mechanically distinct**. Before adding a card, verify that no other card in the set does the same thing. Audit the full set card list, not just the rarity tier.

### Seraphim Cards
- Placed to the **front row** (up to 5 slots). Discarded at turn end.
- Have an **on-play effect** (`onPlayEffects: ImmediateEffect[]`) and a **passive stat** while on board.
- Have `unsynergized` and `synergized` attack blocks.
- Valid `baseStats.bonusType` values:
  - `oblivion_per_card` — flat Oblivion per card played while active
  - `ophanim_bonus` — Oblivion whenever an Ophanim is played while active
  - `chain_bonus` — adds to chain multiplier growth per card
  - `cherubim_extra_plays` — extra Cherubim card plays per turn
  - `seeker_bonus` — (legacy alias, functionally `ophanim_bonus`)
- **Patience fields** (Neutrality Seraphim only):
  - `patienceThreshold?: number` — if set, Seraphim auto-accumulates Patience; triggers bonus draw on attack when threshold is reached
  - `patienceThresholdDraw?: number` — cards drawn when threshold is met on attack

### Cherubim Cards
- Placed to the **back row** (up to 4 slots, staggered). `backSlots[i]` is adjacent to `frontSlots[i]` and `frontSlots[i+1]`.
- Have `maxDurability` (decrements by 1 per card played, including Cherubim placement). At 0 they expire to discard.
- **Three effect layers:**
  - `effects: CherubimPassiveEffect[]` — passive effects on adjacent front slots while active. Key types: `cherubim_adjacent_seraphim_bonus` (Oblivion/chain boost to adjacent Seraphim attacks — used by non-Neutrality sets), `cherubim_patience_per_card` (Neutrality: adds Patience per card), `cherubim_resource_per_card`, `cherubim_draw_per_card`.
  - `onPlayEffects?: ImmediateEffect[]` — fires immediately when the card is played (draw, Oblivion, chain gain, salvage, etc.). Runs through `CardEffectExecutor`.
  - `enthalpy?: CherubimRitualEffect[]` — **Enthalpic Ritual**: fires when placed. Handled by `fireCherubimRitual` in the store.
  - `entropy?: CherubimRitualEffect[]` — **Entropic Ritual**: fires when durability reaches 0. Same handler.
- **Ritual-specific effect types** (only valid in enthalpy/entropy):
  - `search_adjacent_seraphim` — PendingEffect to search for Seraphim matching adjacent front slots.
  - `cherubim_sacrifice_oblivion: { value }` — removes card from back slot immediately; optionally grants Oblivion.
- Sacrifice cards: set `maxDurability: 1` and `effects: []`.
- Cherubim on-play effects that create pending choices (`search_deck_by_type`, `salvage_any`, `look_top_take`, etc.) must explicitly propagate `result.pendingEffect` in both Cherubim play paths in `store.ts`.

### Ophanim Cards
- Played from hand. Immediate effect only. No board presence.
- `type: 'Ophanim'` on all definitions. No `cardSubtype` field.
- Effects via `effects: ImmediateEffect[]`. Processed by `CardEffectExecutor`.
- **`patience_gain_all` and `patience_double_all`** are valid in Ophanim `effects` — the `playCard` handler in `store.ts` scans for them after the executor runs and applies them via `applyPatienceGainAll`/`applyPatienceDoubleAll`.

### Dynamic Cards (Sentinel Pattern)
Cards that scale dynamically use `value: 0` as a sentinel in their effect definition, and the actual computation lives in `CardEffectExecutor.ts` keyed by `definitionId`. When adding a new dynamic card, both files must be updated together.

---

## Patience Mechanic (Neutrality)

All patience logic lives in `src/state/store.ts`. The types are in `src/types/cards.ts` and `src/types/effects.ts`.

### How It Works
1. **Accumulation**: Every time a card is played, `applyCherubimPassiveEffects` fires. For each Seraphim with `patienceThreshold !== undefined`, it increments `patienceStacks` by 1. Adjacent Cherubim with `cherubim_patience_per_card` give additional stacks (so total = 1 + Cherubim bonus per card).
2. **Attack payoff**: When a Seraphim or Angel fires an attack, all `patienceStacks` are consumed: `+patienceStacks × 15` Oblivion is added. If `patienceStacks >= patienceThreshold`, also draw `patienceThresholdDraw` cards. Stacks reset to 0 after attack.
3. **Burst effects**: `patience_gain_all: N` — immediately adds N Patience to all active board units. `patience_double_all` — doubles all current Patience on the board.
4. **Where handled**:
   - `applyPatienceGainAll` and `applyPatienceDoubleAll` helpers in `store.ts`
   - `applyCherubimPassiveEffects`: auto-accumulates +1 per card + Cherubim bonus
   - `activateSeraphimAttack`: adds captured Patience × 15 Oblivion, resets stacks, triggers threshold draw
   - `summonAngel` / `activateAngel`: call patience helpers after board update
   - `playCard` (Seraphim branch): scans `def.onPlayEffects` for patience effects after executor runs
   - `playCard` (Ophanim branch): scans `getDefinitionOnPlayEffects(def)` for patience effects after executor runs

### Instance Fields
- `SeraphimInstance.patienceStacks?: number`
- `AngelInstance.patienceStacks?: number`

### Definition Fields (SeraphimDefinition only)
- `patienceThreshold?: number` — enables patience accumulation; threshold for bonus draw on attack
- `patienceThresholdDraw?: number` — cards drawn when threshold is met

---

## Balance Philosophy

- Balance is **feel-based and emergent**. No fixed time targets.
- The early game (Neutrality starter deck) should feel **slow and humble**. Earning 1000 Oblivion should feel like a milestone.
- Cards should feel increasingly impactful as the player builds their collection and deck — not from the very start.
- **Never make starter cards feel overpowered.** Rares and Epics should be meaningfully stronger than Commons and feel like genuine upgrades.
- Pack prices should feel **meaningful but achievable** — not a grind, not trivial.
- **Eternal cards** are dramatically more powerful than Legendaries. **Infinite cards** are the apex — each one should feel like a culminating reward.

### Current Economy Reference
- Neutrality Pack: 200 Oblivion, 5 cards
- Heavenly Light Pack: 600 Oblivion, 5 cards
- Deck Builder unlocks at 15 unique collected cards
- Deck size: exactly **50** main deck cards (max **4** copies per definition) + up to **5** Angels in the extra deck (max **2** copies per Angel definition)

---

## UI/UX Standards

### General
- The visual theme is dark, mystical, and gold-accented. Background is near-black; text and borders use `#FFD700` (gold) as the primary highlight color.
- Font family throughout: `Georgia, serif`.
- All interactive elements must have visible hover/active feedback.

### Card Display (Hand)
- Cards in hand: **148×210px**. Name: 14px bold gold. Description: 11px, high-contrast white (`rgba(255,255,255,0.80)`). Type label: 10px, uppercase.
- Hovering a card shows a **tooltip panel** (270px wide) above the hand with larger name (16px), full description (13px), and footer showing Element · Synergy stat (for Seraphim).
- Card rules digest flows through `getCardSummarySections`/`getCardPreviewLines` in `src/ui/cardStatSummary.ts` and `src/ui/components/CardRulesDigest.tsx`. Prefer these over raw `description` in hover/menu UIs.
- Do not show strategic tips or advice anywhere in the UI.

### HUD Elements
- **Oblivion display**: centered top, 36px, gold with glow. Shows chain multiplier during a turn.
- **Stat panel**: top-left, shows active synergies, Oblivion earned this turn, chain multiplier, active Cherubim count.
- **Set Engine Display**: `src/ui/hud/SetEngineDisplay.tsx` — surfaces the live set-engine readout. Data comes from `src/ui/setEngineSummary.ts` (`buildEngineSnapshot`, `ENGINE_ROLE_TEXT`, `SET_ENGINE_GUIDES`).
- **Turn controls**: bottom-right, large buttons.
- **Deck status pills**: bottom-right, showing Deck / Discard / Hand counts.
- **Radiance orb**: bottom-left, gold orb showing current Radiance (only visible during a turn, Light element only).

### Board Display
- Front row: 5 slots. Empty slots show "Place Seraphim" prompt when a Seraphim is in hand.
- Back row: 4 slots, staggered. Empty slots show "Place Cherubim" prompt when a Cherubim is in hand.
- Cherubim slots display: card name + durability counter (color: purple >50%, orange >25%, red ≤25%).
- Clicking an occupied Seraphim slot removes it to discard. Clicking an occupied Cherubim slot removes it to discard.

### Card Store
- Packs show name, element color dot, description, rarity distribution chips, cost, and card count.
- Locked packs are visible but greyed out with a lock label — they signal future content.
- Pack opening uses a click-to-reveal animation. All cards revealed → "Collect" button to close.
- New cards (not previously in collection) are marked with a "✦ New!" badge.

### Deck Builder
- Locked until 15 unique cards are collected. Lock overlay explains the requirement with current progress.
- Has two zones: **Main Deck** (50 cards, max 4 copies per definition, non-Angel cards only) and **Extra Deck** (up to 5 Angels, max 2 per definition).
- Sections in main deck pool: **Seraphim**, **Ophanim**, **Cherubim** (no cardSubtype groupings).
- Valid deck: exactly 50 main deck cards, max 4 copies of any definition. Extra deck: 0–5 Angels.
- Does **not** allow fewer than 50 main deck cards.
- Main-deck size clamping lives in `DeckSystem.addDeckEntry`; DeckBuilder enforces the 50-card cap through that helper.
- Boss fights (Eternity's Wake) load decks from `progress.savedDecks`; `saveCurrentDeck` must receive the edited `deckList` and `extraDeck` snapshot.

---

## Key File Map

| File | Purpose |
|---|---|
| `src/types/cards.ts` | Card definition and instance interfaces (SeraphimDefinition, CherubimDefinition, OphanimDefinition, AngelDefinition) |
| `src/types/effects.ts` | ImmediateEffect, CherubimPassiveEffect, AngelEffect union types |
| `src/state/store.ts` | All game state mutations: playCard, summonAngel, activateAngel, activateSeraphimAttack, patience helpers, set mechanics |
| `src/systems/cards/CardEffectExecutor.ts` | Executes ImmediateEffect arrays for Ophanim, Seraphim onPlayEffects, and Angel effects |
| `src/data/cards/neutralityCards.ts` | Base Neutrality Ophanim + Seraphim |
| `src/data/cards/neutralityCherubimCards.ts` | Neutrality Cherubim |
| `src/data/cards/neutralityAngel.ts` | Neutrality Angels |
| `src/data/cards/eternalCards.ts` | All Eternal cards (all sets); includes `expansionEternalCards` for cross-set Eternals |
| `src/data/cards/infiniteCards.ts` | All Infinite cards + `InfiniteRecipe` definitions |
| `src/ui/setEngineSummary.ts` | ENGINE_ROLE_TEXT, buildEngineSnapshot, SET_ENGINE_GUIDES per set |
| `src/ui/cardBackgrounds.ts` | Card art resolution; `CARD_BACKGROUND_FILE_OVERRIDES` for special cases |
| `src/ui/eternitysWake/EternitysWake.tsx` | Eternity's Wake boss fight UI; `BOSS_ART_FILES` map |
| `src/data/bosses/` | Boss definitions (`BossDefinition`, `BossCategory`, `BOSS_DEFINITIONS`) |
| `src/cards/CardRegistry.ts` | Card lookup + alias resolution; `CardRegistry.getAll()` for runtime audits |
| `src/save/SaveManager.ts` | Persistence; `progress.savedDecks` for boss fight deck snapshots |

---

## Technical Constraints

- **TypeScript strict mode**. No `any` types without justification.
- **No new effect types** without updating `src/types/effects.ts`. New immediate effects that the `CardEffectExecutor` doesn't handle must also be wired into `store.ts` (see how `patience_gain_all`/`patience_double_all` are handled post-executor in all `playCard` branches and in `summonAngel`/`activateAngel`).
- **No Radiance effects on non-Light cards**. Hard constraint.
- **No `dominant_stack_gain` on Neutrality cards**. That effect type is legacy; Neutrality now uses `patience_gain_all`. `dominant_stack_gain` remains valid for other sets.
- **No `cherubim_adjacent_seraphim_bonus` on Neutrality Cherubim**. Neutrality Cherubim use `cherubim_patience_per_card` exclusively.
- Dynamic scaling uses the `value: 0` sentinel pattern — see `CardEffectExecutor.ts` for existing examples.
- Store mutations use Immer (`set(state => { state... })`). Always mutate draft state inside `set`.
- `openPack` must capture `preOpenCollection` **before** calling `set()` to correctly track new cards.
- **Search / Salvage / Look effects** produce `PendingEffect` variants (`search_deck`, `salvage`, `look_top_take_drop`, `look_top_take_type`) that require a **UI picker**. Resolved via store actions analogous to `discard_choice`. Always propagate `result.pendingEffect` in all card-play paths.
- **Extra deck init**: `STARTER_EXTRA_DECK` from `StarterDeck.ts` populates the player's extra deck on game start.
- **No `cardSubtype` field** exists on any card definition.
- **Chain multiplier timing**: For Ophanim cards, capture `prePlayChain = s.turn.chainMultiplier` before calling the executor, then pass it as `chainOverride` to `awardOblivionForCardPlay`. The executor increments the chain before returning.
- **`CherubimPassiveEffect`** is a separate union type from `CardEffect` and `ImmediateEffect`. Cherubim `effects` field is `CherubimPassiveEffect[]`, not `ImmediateEffect[]`.
- **`tickCherubimDurability`** must be called after awarding Oblivion in all card-play paths.
- **Attack cooldown floor**: Both Seraphim and Angel attack activations enforce a post-fire cooldown floor of 1 card minimum (before and after late-game identity reductions).
- **Seraphim discard-cost attacks**: require explicit `paymentSelection`; store does not auto-pick. `BoardDisplay` opens a Seraphim discard picker modal before calling `activateSeraphimAttack`.
- **Infinitude visibility**: recipe-driven via `INFINITE_RECIPES` in `infiniteCards.ts`. Eternity's Wake visibility: boss-data-driven via `BossCategory` + `mapPackToBossCategory` + `BOSS_DEFINITIONS`. Adding set cards alone will not surface them in those menus.
- **`Embrace the Infinite`** button: available when `hand` has 40+ cards, phase is `playing`, and no pending effect. Does not require an empty draw pile.
- **Glass Absolute**: base loop is fragments-first; Eternal/Infinite overlays are Refraction Charge-first. Runtime still tracks depth/token board data, but player-facing higher-rarity conversion is now charge/queue/ledger driven.
- **Burning Garden**: uses persistent `emberGrove` board state; one-per-turn echo; Burn ignition; end-turn char-to-Ember-Grove conversion. `initializeBurningGardenInstance` must be called when placing a Burning Garden Seraphim.
- **Balance override scripts**: `scripts/add-explicit-attacks.mjs`, `scripts/enforce-attack-power-constraints.mjs`, etc. Attack regex must use word boundaries (`\bsynergized`) because bare `synergized:` also matches inside `unsynergized:`.
- **Card face art**: `public/assets/card-backgrounds/<element-folder>/`. `src/ui/cardBackgrounds.ts` resolves element-specific subfolders. Neutrality uses `neutrality/`. `CARD_BACKGROUND_FILE_OVERRIDES` handles special cases. Infinite BGI cards route to `black-glass-inferno/` not `infinite/`.
- **UI set ordering**: sourced from `PACK_DEFINITIONS`. Collection/Eternity tabs stay aligned with the Card Store menu.
- **Materialized balance overrides** may append extra effects (including draw) after base card definitions; runtime audits must use `CardRegistry.getAll()`, not raw source text.
