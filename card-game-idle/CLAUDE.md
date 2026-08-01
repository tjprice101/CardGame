# CLAUDE.md — Card Game Design Rules

This file governs how to approach all work on this project. It covers game design rules, balance philosophy, and UI/UX standards. Always read this before making design decisions or adding new content.

---

## Game Overview

A **turn-based card game**. Each turn the player draws a hand, plays cards to earn **Oblivion** (the primary currency), then ends the turn. The game loop is: play cards → earn Oblivion → spend Oblivion on card packs → open packs to expand collection → build a better deck → repeat.

There is **no idle tick loop**. Oblivion is earned exclusively by playing cards. Seraphim and Angels on the board also fire **attacks** periodically as cards are played, dealing additional Oblivion.

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
- Angel summon does **not** count as playing a card — it does not decrement Cherubim durability.
- Angels have `onSummonEffects`, an optional `activatedAbility` (fires after N cards played), and `primary`/`exalted` attack modes.

---

## Seraphim & Angel Attacks

Seraphim and Angels have attack stats that fire periodically as cards are played during the turn.

- **Seraphim attacks**: `unsynergized` and `synergized` modes. Synergized requires an Angel on board (or matching element Angel). `cooldownCards` sets how many cards must be played between attacks.
- **Angel attacks**: `primary` and `exalted` modes. Exalted typically has a cost (discard N cards) and higher output.
- Attack stats: `baseOblivion`, `cooldownCards`, `costs`, optional `requiresAngelOnBoard`.
- **Attack cooldown floor**: always at least 1 card after firing to prevent immediate re-fire loops.
- Seraphim unsynergized attacks always have an element-appropriate resource cost injected by `CardRegistry` (discard for Neutrality/Dark, resource spend for others).
- Discard-cost attacks require explicit `paymentSelection` — the store does not auto-pick.

---

## Oblivion

- **Oblivion** is the primary currency. Earned by playing cards and from Seraphim/Angel attacks. Spent in the Card Pack Store.
- Base Oblivion per card scales from card text, board bonuses, and attack windows.

---

## Naming Conventions

**Set name vs. element key** — these are distinct and must not be confused:

| Set Name | Element Key |
|---|---|
| Neutrality | `Neutrality` |

- **Set name** is what players see in the UI. **Element key** is the internal value stored on card definitions.
- Use `ELEMENT_SET_NAMES` from `src/data/elements.ts` to convert. Never display raw element keys to the player.

---

## Current Sets & Their Mechanics

Each set has a **distinct primary mechanic** that defines its strategic identity. Overlap is acceptable but the primary identity must remain clear.

### Neutrality — "Patience / Stasis"
- **Patience** is the core mechanic. Seraphim with `patienceThreshold` defined auto-accumulate +1 Patience per card played. Cherubim give additional Patience per card to adjacent front slots via the `cherubim_patience_per_card` passive.
- **On attack**: each accumulated Patience stack is consumed for +15 Oblivion. If total stacks ≥ `patienceThreshold`, also draws `patienceThresholdDraw` cards.
- Ophanim: draw/deck manipulation and Patience setup. Key effects: `patience_gain_all` (instant Patience burst for all Seraphim), `patience_double_all` (double all Patience).
- Angels: mass Patience injection on summon; `patience_double_all` in activated abilities.
- Beginner-friendly. Universal Synergy Angel activates all Seraphim regardless of element. Salvage loop enabled by Ophanim like Seraph Recall.
- **Patience thresholds by rarity**: Common/Rare 3–4, Epic 5, Eternal 6, Infinite 8+.
- **Patience per card by Cherubim rarity**: Common +1, Rare +2, Epic +3, Eternal +4–5, Infinite +6–8.
- **Live Neutrality-specific effect types** (Eternal/Infinite layer): `neutrality_equilibrium_sigil_gain`, `neutrality_equilibrium_starbound_cashout` (ascension Transcendent cards only — in `src/data/ascension/transcendentCards.ts`), `neutrality_equilibrium_tactical_spend`, `neutrality_patient_light_gain`, `neutrality_designate_vessel`, `neutrality_attack_preserve`.
- **Dead/removed effect types (do NOT re-add)**: `neutrality_equilibrium_sigil_cap_bonus`, `neutrality_vessel_copy_gain`, `neutrality_vessel_redistribute`, `neutrality_mark_hand`, `neutrality_attack_restore`, `neutrality_linked_mode`.

> **Note:** Only Neutrality is currently implemented. Additional sets will be introduced as the game expands.

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
  - `oblivion_per_card` / `ophanim_bonus` / `cherubim_extra_plays` / `seeker_bonus`
  - `cherubim_extra_plays` — extra Cherubim card plays per turn
  - `seeker_bonus` — (legacy alias, functionally `ophanim_bonus`)
- **Patience fields** (Neutrality Seraphim only):
  - `patienceThreshold?: number` — if set, Seraphim auto-accumulates Patience; triggers bonus draw on attack when threshold is reached
  - `patienceThresholdDraw?: number` — cards drawn when threshold is met on attack

### Cherubim Cards
- Placed to the **back row** (up to 4 slots, staggered). `backSlots[i]` is adjacent to `frontSlots[i]` and `frontSlots[i+1]`.
- Have `maxDurability` (decrements by 1 per card played, including Cherubim placement). At 0 they expire to discard.
- **Three effect layers:**
  - `effects: CherubimPassiveEffect[]` — passive effects on adjacent front slots while active. Key types: `cherubim_adjacent_seraphim_bonus` (Oblivion boost to adjacent Seraphim attacks — used by non-Neutrality sets), `cherubim_patience_per_card` (Neutrality: adds Patience per card), `cherubim_resource_per_card`, `cherubim_draw_per_card`.
  - `onPlayEffects?: ImmediateEffect[]` — fires immediately when the card is played (draw, Oblivion, salvage, etc.). Runs through `CardEffectExecutor`.
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
- **Oblivion display**: centered top, 36px, gold with glow. Shows sequence multiplier during a turn.
- **Stat panel**: top-left, shows active synergies, Oblivion earned this turn, sequence multiplier, active Cherubim count.
- **Set Engine Display**: `src/ui/hud/SetEngineDisplay.tsx` — surfaces the live set-engine readout. Data comes from `src/ui/setEngineSummary.ts` (`buildEngineSnapshot`, `ENGINE_ROLE_TEXT`, `SET_ENGINE_GUIDES`).
- **Turn controls**: bottom-right, large buttons.
- **Deck status pills**: bottom-right, showing Deck / Discard / Hand counts.

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
| `src/data/cards/eternalCards.ts` | Neutrality Eternal cards; `expansionEternalCards` for Null Raid reward Eternals |
| `src/data/cards/infiniteCards.ts` | Neutrality Infinite cards + `InfiniteRecipe` definitions |
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
- **No `dominant_stack_gain` on Neutrality cards**. That effect type is legacy; Neutrality now uses `patience_gain_all`.
- **No `cherubim_adjacent_seraphim_bonus` on Neutrality Cherubim**. Neutrality Cherubim use `cherubim_patience_per_card` exclusively.
- Dynamic scaling uses the `value: 0` sentinel pattern — see `CardEffectExecutor.ts` for existing examples.
- Store mutations use Immer (`set(state => { state... })`). Always mutate draft state inside `set`.
- `openPack` must capture `preOpenCollection` **before** calling `set()` to correctly track new cards.
- **Search / Salvage / Look effects** produce `PendingEffect` variants (`search_deck`, `salvage`, `look_top_take_drop`, `look_top_take_type`) that require a **UI picker**. Resolved via store actions analogous to `discard_choice`. Always propagate `result.pendingEffect` in all card-play paths.
- **Extra deck init**: `STARTER_EXTRA_DECK` from `StarterDeck.ts` populates the player's extra deck on game start.
- **No `cardSubtype` field** exists on any card definition.
- **Sequence multiplier timing**: For Ophanim cards, capture `prePlayChain = s.turn.chainMultiplier` before calling the executor, then pass it as `chainOverride` to `awardOblivionForCardPlay`. The executor increments the sequence before returning.
- **`CherubimPassiveEffect`** is a separate union type from `CardEffect` and `ImmediateEffect`. Cherubim `effects` field is `CherubimPassiveEffect[]`, not `ImmediateEffect[]`.
- **`tickCherubimDurability`** must be called after awarding Oblivion in all card-play paths.
- **Attack cooldown floor**: Both Seraphim and Angel attack activations enforce a post-fire cooldown floor of 1 card minimum (before and after late-game identity reductions).
- **Seraphim discard-cost attacks**: require explicit `paymentSelection`; store does not auto-pick. `BoardDisplay` opens a Seraphim discard picker modal before calling `activateSeraphimAttack`.
- **Infinitude visibility**: recipe-driven via `INFINITE_RECIPES` in `infiniteCards.ts`. Eternity's Wake visibility: boss-data-driven via `BossCategory` + `mapPackToBossCategory` + `BOSS_DEFINITIONS`. Adding set cards alone will not surface them in those menus.
- **`Embrace the Infinite`** button: available when `hand` has 40+ cards, phase is `playing`, and no pending effect. Does not require an empty draw pile.
- **Card face art**: `public/assets/card-backgrounds/<element-folder>/`. `src/ui/cardBackgrounds.ts` resolves element-specific subfolders. Neutrality uses `neutrality/`. `CARD_BACKGROUND_FILE_OVERRIDES` handles special cases.
- **Materialized balance overrides** may append extra effects (including draw) after base card definitions; runtime audits must use `CardRegistry.getAll()`, not raw source text.


---

## Documentation Single Source of Truth

### Card Effect Text Pipeline

Card descriptions are **hand-authored** in source .ts files and kept in sync with canonical formatters via the regen script:

`
npx tsx scripts/regen-canonical-descriptions.mts
`

- Source files: src/data/cards/*.ts ? authoritative for card.description and ctivatedAbility.description.
- src/data/cards/materializedCardBalance.ts ? **auto-generated**. Contains attack description, aseOblivion, and cooldownCards overrides for Seraphim/Angel attacks. **Do not hand-edit.**
- src/data/cards/neutralityDocOverrides.ts ? intentional hand-authored overrides for Neutrality complex cards.
- Canonical formatters live in src/ui/cardStatSummary.ts ? getCanonicalCardDescription, getCanonicalAttackDescription, getCanonicalActivatedAbilityDescription.

### Root Markdown Docs

Human-readable card effect documents for Neutrality live at `Card Effects/Neutrality/Neutrality Card Effects.md` (workspace root).

### Tutorial / Resource Text

All tutorial copy lives in:
- src/data/tutorialContent.ts ? section metadata, set engine summaries, rarity tiers, card-born tier milestones.
- src/data/resourceExplanations.ts ? per-resource short/long descriptions used by TutorialModal.

src/ui/menus/TutorialModal.tsx is **pure presentation** — it imports from the data modules above and contains no hardcoded game text.
