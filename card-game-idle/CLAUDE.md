# CLAUDE.md — Card Game Design Rules

This file governs how I should approach all work on this project. It covers game design rules, balance philosophy, and UI/UX standards. Always read this before making design decisions or adding new content.

---

## Game Overview

A **turn-based card game**. Each turn the player draws a hand, plays cards to earn **Oblivion** (the primary currency), then ends the turn. The game loop is: play cards → earn Oblivion → spend Oblivion on card packs → open packs to expand collection → build a better deck → repeat.

There is **no idle tick loop**. Oblivion is earned exclusively by playing cards. A **chain multiplier** grows as more cards are played in a single turn, rewarding long chains.

---

## Board Layout

```
[ S0 ] [ S1 ] [ S2 ] [ S3 ] [ S4 ]   ← front row: 5 Seraphim/Angel slots
   [ C0 ]  [ C1 ]  [ C2 ]  [ C3 ]    ← back row: 4 Chaos slots, staggered
```

- **Front slots (5)**: hold Seraphim and Angels. Both go away at turn end — Seraphim to the discard pile, Angels simply cleared (they're extra-deck cards, not discarded). Angels must be re-summoned each turn.
- **Back slots (4)**: hold Chaos cards. Each Chaos card has a **durability** counter; it expires to the discard when durability reaches 0. All Chaos cards also go to discard at turn end.

---

## Card Types

| Type | Zone | Behavior |
|---|---|---|
| **Angel** | Extra deck | Summoned from extra deck when conditions met. Stays on board. |
| **Seraphim** | Main deck | Placed to front row. On-play effect fires. In-synergy passive while on board. Discarded at turn end. |
| **Chaos** | Main deck | Placed to back row. Passive effect applies to adjacent front slots. Durability decrements per card played. |
| **Seeker** | Main deck | Played from hand. Immediate effect. No board presence. |

### Card Subtypes Removed
There are **no `cardSubtype` fields** on any card definition. The `HeavenlyRetribution` type no longer exists. All former HR cards are now `Seeker`.

---

## Angel / Extra Deck System

- Angels are **not in the main deck**. They are held in a separate **extra deck** (up to 5 Angels, max 2 copies per definition).
- Angels can be **summoned at any point during your turn** when summon conditions are met — no card draw required.
- **Summon cost:** Each Angel lists specific Seraphim that must be on the board. When summoned, those Seraphim are sent to the discard pile. Seraphim recovered via salvage can be replayed and used again.
- Multiple Angels can be active simultaneously (no hard cap beyond available front slots).
- Angel summon does **not** count as playing a card — it does not decrement Chaos durability or advance the chain.

---

## Oblivion & Chain Multiplier

- **Oblivion** is the primary currency (replaces Score). Earned by playing cards. Spent in the Card Pack Store.
- **Chain multiplier** = `1.0 + cardsPlayedThisTurn × 0.1`. Each card played this turn earns more Oblivion than the last.
- Base Oblivion per card = `5 × chainMultiplier + synergy bonuses + Chaos adjacency bonuses + card-specific bonuses`.
- Some Seraphim have `chain_bonus` synergy: adds +0.05 to chain growth rate per card while in synergy.
- Chain resets to 1.0 at turn end.

---

## Naming Conventions

**Set name vs. element key** — these are distinct and must not be confused:

| Set Name | Element Key (stored on cards) |
|---|---|
| Neutrality | `Neutrality` |
| Heavenly Light | `Light` |

- **Set name** is what players see in the UI (filter tabs, pack store, tooltips, etc.).
- **Element key** is the internal value stored on card definitions and used in game logic.
- Always display the **set name** to players. Use `ELEMENT_SET_NAMES` from `src/data/elements.ts` to convert.
- Never display the raw element key `"Light"` to the player — always map it to `"Heavenly Light"`.

---

## Current Elements

- **Neutrality** — the starter element. All cards are accessible early.
- **Light (Heavenly Light)** — second element. Locked until the player reaches an Oblivion milestone.
- Future elements (Dark, Fire, Water, Earth, Wind) — not yet designed. Do not define their mechanics.

### Element Identity Rules
- Each element must have a **distinct primary mechanic** that defines its strategic identity.
- **Overlap is acceptable** as long as the primary identity remains clear.
- **Never assign another element's core mechanic** to a different element without approval. Radiance is the core mechanic of Heavenly Light — no other element may use `radiance_gain`, `radiance_spend`, `radiance_double`, or any Radiance-related effect.

### Established Element Identities

**Neutrality — "Equilibrium"**
- **Momentum (Chaos)**: Chaos cards sit on the back row and boost adjacent Seraphim synergies.
- **Chain growth**: Seraphim and Seeker cards that increase the chain multiplier or chain floor.
- **Cycle**: draw/deck manipulation as resource engine, including search, salvage, and look effects.
- **Presence**: cards scale with active Seraphim count (`seraphim_active_gte` conditionals).
- No Radiance. Universal Synergy angel activates all Seraphim regardless of element.
- Beginner-friendly. Cards are simple, reliable, and readable.
- **Salvage loop**: Seraphim go to discard when consumed for Angel summons. Seeker cards like Seraph Recall recover them, enabling repeat summons.

**Heavenly Light — "Radiance"**
- **Radiance** is a per-turn counter that resets at turn end.
- Cards generate Radiance, spend Radiance, or scale off current Radiance.
- Radiance is **exclusive to Heavenly Light**. No other element touches it.
- Higher risk/reward than Neutrality. More complex combos.

---

## Card Design Rules

### Descriptions
- Describe **only what the card does mechanically**. No strategic advice, tips, or flavor commentary.
- **Do include** parenthetical clarifiers for ambiguous mechanics (e.g., "(including this one)" for self-counting effects).
- **Do not include** phrases like: "Best played as...", "Save it for last", "Scales with...", "Requires board presence", "Better late/early in your turn", or any other play guidance.

### Rarity
- Rarity is **feel-based**, not rule-based. Commons are weak and simple; Epics are impactful and interesting; Legendaries are rare and dramatic. No strict effect-type restrictions per rarity tier.

### Seraphim Cards
- Seraphim are placed to the **front row** (up to 5 slots).
- They have an **on-play effect** (fires when placed) and an **in-synergy passive** (active while on board and a matching Angel is present, or when Universal Synergy is active).
- Valid `bonusType` values: `oblivion_per_card`, `seeker_bonus`, `chaos_extra_plays`, `chain_bonus`, `chaos_expire_bonus`, `power_amplifier` (Light compat, no-op until Light rework).

### Chaos Cards
- Chaos cards are placed to the **back row** (up to 4 slots, staggered between front slots).
- `backSlots[i]` is adjacent to `frontSlots[i]` and `frontSlots[i+1]`.
- Chaos cards have `maxDurability` (decrements by 1 per card played, including Chaos placement). At 0 they expire to discard.
- **Three effect layers:**
  - `effects: ChaosPassiveEffect[]` — passive bonuses to adjacent front-slot Seraphim while active. Valid types: `chaos_oblivion_per_card`, `chaos_seeker_bonus`, `chaos_chain_bonus`, `chaos_seraphim_amp`, `chaos_ember_gain`.
  - `enthalpy?: ChaosRitualEffect[]` — **Enthalpic Ritual**: fires immediately when the card is placed. Typed as `ChaosRitualEffect` (superset of `CardEffect` plus `search_adjacent_seraphim` and `chaos_sacrifice_oblivion`). Handled by `fireChaosRitual` in the store, not CardEffectExecutor.
  - `entropy?: ChaosRitualEffect[]` — **Entropic Ritual**: fires when durability reaches 0, before the card is sent to discard. Handled by the same `fireChaosRitual`.
- **Chaos-specific ritual effect types** (only valid in enthalpy/entropy):
  - `search_adjacent_seraphim` — creates a `search_deck` PendingEffect filtered to Seraphim matching adjacent front slots (falls back to any Seraphim if slots are empty).
  - `chaos_sacrifice_oblivion: { value }` — removes the card from its back slot immediately (before passive or entropy apply) and optionally grants Oblivion. Use `value: 0` for pure self-removal.
- Sacrifice cards: set `maxDurability: 1` and make `effects: []` since the passive and entropy never fire.

### Seeker Cards
- Played from hand. Immediate effect only. No board presence. Formerly called "HeavenlyRetribution".
- `type: 'Seeker'` on all definitions. No `cardSubtype` field.

### Dynamic Cards (Sentinel Pattern)
Cards that scale dynamically use `value: 0` as a sentinel in their effect definition, and the actual computation lives in `CardEffectExecutor.ts` keyed by `definitionId`. When adding a new dynamic card, both files must be updated together.

---

## Balance Philosophy

- Balance is **feel-based and emergent**. No fixed time targets.
- The early game (Neutrality starter deck) should feel **slow and humble**. Earning 1000 Oblivion should feel like a milestone.
- Cards should feel increasingly impactful as the player builds their collection and deck — not from the very start.
- **Never make starter cards feel overpowered.** Rares and Epics should be meaningfully stronger than Commons and feel like genuine upgrades.
- Pack prices should feel **meaningful but achievable** — not a grind, not trivial.

### Current Economy Reference
- Neutrality Pack: 200 Oblivion, 5 cards
- Heavenly Light Pack: 600 Oblivion, 5 cards (locked)
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
- Do not show strategic tips or advice anywhere in the UI.

### HUD Elements
- **Oblivion display**: centered top, 36px, gold with glow. Shows chain multiplier during a turn.
- **Stat panel**: top-left, shows active synergies, Oblivion earned this turn, chain multiplier, active Chaos count.
- **Turn controls**: bottom-right, large buttons.
- **Deck status pills**: bottom-right, showing Deck / Discard / Hand counts.
- **Radiance orb**: bottom-left, gold orb showing current Radiance (only visible during a turn, Light element only).

### Board Display
- Front row: 5 slots. Empty slots show "Place Seraphim" prompt when a Seraphim is in hand.
- Back row: 4 slots, staggered. Empty slots show "Place Chaos" prompt when a Chaos card is in hand.
- Chaos slots display: card name + durability counter (color: purple >50%, orange >25%, red ≤25%).
- Clicking an occupied Seraphim slot removes it to discard. Clicking an occupied Chaos slot removes it to discard.

### Card Store
- Packs show name, element color dot, description, rarity distribution chips, cost, and card count.
- Locked packs are visible but greyed out with a lock label — they signal future content.
- Pack opening uses a click-to-reveal animation. All cards revealed → "Collect" button to close.
- New cards (not previously in collection) are marked with a "✦ New!" badge.

### Deck Builder
- Locked until 15 unique cards are collected. Lock overlay explains the requirement with current progress.
- Has two zones: **Main Deck** (50 cards, max 4 copies per definition, non-Angel cards only) and **Extra Deck** (up to 5 Angels, max 2 per definition).
- Sections in main deck pool: **Seraphim**, **Chaos**, **Seeker** (no cardSubtype groupings).
- Valid deck: exactly 50 main deck cards, max 4 copies of any definition. Extra deck: 0–5 Angels.
- Does **not** allow fewer than 50 main deck cards.

---

## Technical Constraints

- **TypeScript strict mode**. No `any` types without justification.
- **No new effect types** without updating `src/types/effects.ts` and `CardEffectExecutor.ts`.
- **No Radiance effects on non-Light cards**. This is a hard constraint.
- Dynamic scaling uses the `value: 0` sentinel pattern — see `CardEffectExecutor.ts` for existing examples.
- Store mutations use Immer (`set(state => { state... })`). Always mutate draft state inside `set`, never return a new object unless replacing the whole state.
- `openPack` must capture `preOpenCollection` **before** calling `set()` to correctly track new cards.
- **Search / Salvage / Look effects** produce `PendingEffect` variants (`search_deck`, `salvage`, `look_top_take_drop`, `look_top_take_type`) that require a **UI picker** for the player to select a card. These are resolved via store actions analogous to how `discard_choice` is resolved.
- **Extra deck init**: On game start, `STARTER_EXTRA_DECK` from `StarterDeck.ts` populates the player's extra deck zone (not the draw pile).
- **No `cardSubtype` field** exists on any card definition. All subtype-based UI groupings use `def.type` instead.
- **Chain multiplier timing**: For Seeker cards, capture `prePlayChain = s.turn.chainMultiplier` before calling the executor, then pass it as `chainOverride` to `awardOblivionForCardPlay`. The executor increments the chain before returning.
- **`ChaosPassiveEffect`** is a separate union type from `CardEffect` — Chaos card definitions use `effects: ChaosPassiveEffect[]`, not `CardEffect[]`.
- **`tickChaosDurability`** must be called after awarding Oblivion in all card-play paths. Still Seraphim's `chaos_expire_bonus` is handled directly in `tickChaosDurability`.
