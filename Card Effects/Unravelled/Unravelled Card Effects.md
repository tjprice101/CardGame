# Unravelled — Card Effects

> **Set**: Unravelled · **Element**: `Unravelled`
> **Visual Identity**: True black backgrounds. Every card has multicolored thread-signatures reflecting faction identity — Order cards glow in structured luminous colors (platinum, warm gold, ivory); Fray cards trail loose fraying edges in smoke-violet, blood-red, ashen white; Tangled cards are chaotic blends, every one different.
>
> **Core Mechanic — Thread Tension**: Playing cards generates Thread Tension (integer counter, cap 10). When Tension reaches 10 naturally, it **Snaps** automatically — dealing burst Oblivion + drawing 2 cards, then resetting to 0. Cards can also **Early Snap** manually (smaller effect). Different factions interact differently: Order cards build Tension slowly and spend it carefully; Fray cards push hard toward the snap; Tangled cards interact with the snap in chaotic, rewarding ways.
>
> **Eternal/Infinite Ancillary — Fate Knot**: Each time Tension Snaps (auto or early), gain 1 Fate Knot. Fate Knots are permanent this-match stacks that amplify all future Snap Oblivion. The more times the Loom breaks, the more devastating each break becomes.
>
> **Factions**: Woven Order (fate is sacred — every thread has its place) · The Fray (fate is a cage — come undone, grow stronger) · The Tangled (chaotic hybrids who feed on contradiction and become stranger with every paradox absorbed). All three factions are present in the base set. **Selvara the Irreducible** is aligned with none of them — she has been pulling the primordial thread at the Loom's center for ten thousand years and is both the most dangerous and the most isolated being on the battlefield.
>
> **Lore**: At the origin of causality, the Loom emerged from the first act of will in existence. The Threadborn are beings who dissolved themselves into its fibers willingly — gaining the ability to touch and alter fate, but sacrificing their physical form forever. They are now warriors made entirely of living thread, woven memory, knotted will. The war between the Woven Order and the Fray has been building for centuries; the Tangled are its monstrous consequence. And at the center of all of it, Selvara pulls at something that predates the Loom itself — one fiber at a time.

---

## Ophanim

### ◈ Order Fragment `unrav-oph-order-fragment`
**Rarity**: Common · **Type**: Ophanim · **Faction**: Woven Order

*A tightly wound spool of intention shed by a Woven Order warrior during a defensive weave. It pulses with preserved purpose — the preserved certainty that this thread belongs exactly where it was placed.*

Gain 2 Thread Tension; If Thread Tension is below 6, Draw 1 card

---

### ◆ Fray Tendril `unrav-oph-fray-tendril`
**Rarity**: Rare · **Type**: Ophanim · **Faction**: The Fray

*A trailing strand from a Fray warrior who dissolved an arm willingly mid-battle. The tendril still vibrates with the momentum of controlled dissolution — the electric feeling of choosing to come undone.*

Gain 4 Thread Tension; +80 Oblivion; If Thread Tension is 8+, Draw 1 card

---

### ✦ Selvara's Half-Knot `unrav-oph-selvaras-half-knot`
**Rarity**: Epic · **Type**: Ophanim · **Faction**: None (Ireducible)

*A knot that Selvara tied in herself ten thousand years ago to mark the halfway point of pulling the primordial thread. She never untied it. One side of it is perfectly wound Order thread. The other side is raw, fraying, and does not know what it is.*

Gain 3 Thread Tension; Early Snap if Tension ≥ 6 (Oblivion = Tension × 35 + Fate Knots × 50); Draw 1 card

---

### ◈ Tension Coil `unrav-oph-tension-coil`
**Rarity**: Common · **Type**: Ophanim · **Faction**: Woven Order

*A small coil of Order-thread wound to maximum density — a perfect spring of crystallized intention. When it releases, it does so in the most orderly way possible: one fiber at a time, in perfect sequence.*

Gain 2 Thread Tension; If Thread Tension is below 4, gain +70 Oblivion

---

### ◆ Fray Lash `unrav-oph-fray-lash`
**Rarity**: Rare · **Type**: Ophanim · **Faction**: The Fray

*A loose thread that has learned to strike. Not by being taut, but by being precisely at the right degree of dissolution — the exact point where a fraying fiber has just enough structure to hit and just enough chaos to hit everything.*

Gain 3 Thread Tension; +90 Oblivion; If Thread Tension is 8+, trigger an Early Snap (Oblivion = Tension × 20)

---

### ✦ Tangled Memory `unrav-oph-tangled-memory`
**Rarity**: Epic · **Type**: Ophanim · **Faction**: The Tangled

*A memory that has been knotted into the Loom so many times it no longer knows whether it is a memory of something real or a memory of the previous memory of itself. The Tangled find this perfectly normal.*

Gain Thread Tension equal to the number of Snaps you've had this turn (minimum 2, maximum 5); Draw 1 card

---

### ★ The Knot That Predates `unrav-oph-the-knot-that-predates`
**Rarity**: Legendary · **Type**: Ophanim · **Faction**: None (Pre-Loom)

*Not a Threadborn's knot. A knot that exists in the Loom that preexists the Loom — a contradiction the Loom has been quietly trying to explain away for as long as it has existed. When pulled, it snaps with the force of something that was never meant to hold.*

Gain 5 Thread Tension; Snap (full snap regardless of current Tension: Oblivion = Tension × 50 + Fate Knots × 80); Draw 2 cards

---

## Cherubim

### ◈ Loom-Anchor Spool `unrav-cher-loom-anchor-spool`
**Rarity**: Common · **Type**: Cherubim · **Faction**: Woven Order

*A structural element of the Loom itself, carried as armor by Woven Order warriors. It does not fight. It simply holds — and in the Loom, something that holds in exactly the right place becomes unbreakable.*

**Passive**: Snaps deal +30 Oblivion per Tension released at the moment of Snap

**Discard Condition**: When Tension Snaps (auto or early)

---

### ◆ Fray Dissolution Shell `unrav-cher-fray-dissolution-shell`
**Rarity**: Rare · **Type**: Cherubim · **Faction**: The Fray

*A Fray warrior who has dissolved to the point where their shell is all that remains — the last membrane between being and not-being. They hold this state deliberately, using the membrane's vibration to accelerate everything around them.*

**Passive**: Each card you play generates +1 additional Thread Tension

**Discard Condition**: When Thread Tension reaches 7 or higher

---

### ✦ Tangled Paradox Node `unrav-cher-tangled-paradox-node`
**Rarity**: Epic · **Type**: Cherubim · **Faction**: The Tangled

*A Tangled warrior so thoroughly remade by battle damage that they have become a stable contradiction — a knot that is simultaneously tighter and looser than anything around it. They cannot be further tangled. They are already every possible tangle at once.*

**Passive**: When Tension Snaps, also Draw 1 card

**Passive**: Each Snap resets Tension to 3 instead of 0 (you begin the next cycle already wound)

**Discard Condition**: When you have triggered 3+ Snaps this turn

---

### ◈ Order Binding Thread `unrav-cher-order-binding-thread`
**Rarity**: Common · **Type**: Cherubim · **Faction**: Woven Order

*A thread used by the Woven Order to maintain the Loom's structural integrity — a binding thread that does not allow the fabric to become too loose before snapping. It accelerates the Snap not out of aggression, but out of tidiness.*

**Passive**: Thread Tension auto-Snaps at 8 instead of 10 while this is on board

**Discard Condition**: When Tension Snaps 2+ times in a turn

---

### ◆ Fraying Membrane `unrav-cher-fraying-membrane`
**Rarity**: Rare · **Type**: Cherubim · **Faction**: The Fray

*A Fray warrior dissolved to the state of a single vibrating membrane — the boundary between being and not-being held perfectly at the dissolution threshold. At this state, every vibration of the Loom passes through them and becomes something sharp.*

**Passive**: Each card you play deals Oblivion equal to the current Thread Tension (flat)

**Discard Condition**: When you play a card while at 9+ Thread Tension

---

### ✦ Tangled War-Weave `unrav-cher-tangled-war-weave`
**Rarity**: Epic · **Type**: Cherubim · **Faction**: The Tangled

*A Tangled warrior who has mastered one thing: every time the Loom tears open, they are already inside the new loop before it closes. They do not fight. They simply ensure the next Snap has already started before this one finishes.*

**Passive**: After each Snap, immediately gain 5 Thread Tension

**Passive**: Snaps deal +(Fate Knots × 20) bonus Oblivion

**Discard Condition**: When you trigger 4+ Snaps this turn

---

### ★ Loom's Edge Sentinel `unrav-cher-looms-edge-sentinel`
**Rarity**: Legendary · **Type**: Cherubim · **Faction**: None (The Loom's Own)

*Some believe the Loom has no preference about what happens to it. The Loom's Edge Sentinel suggests otherwise — a guardian-thread at the Loom's structural perimeter that amplifies every Snap as though urging the combatants toward the conclusion the Loom itself wants.*

**Passive**: All Snaps deal +(Fate Knots × 50) bonus Oblivion

**Passive**: When Thread Tension reaches exactly 10, draw 1 card before the Snap resolves

**Discard Condition**: When Fate Knots reach 5+

---

## Seraphim

### ◈ Woven Order Vanguard `unrav-ser-woven-order-vanguard`
**Rarity**: Common · **Type**: Seraphim · **Faction**: Woven Order

*An entry-rank warrior of the Woven Order. Their thread-form is impeccable — every fiber in its correct position, humming with the dignity of things that belong where they are. They are not particularly fearsome. They are, however, exactly what they are supposed to be.*

**Passive**: Gain 1 Thread Tension when placed; If Thread Tension is below 5, Draw 1 card

**Attack**: Unsynergized — 160 dmg · Synergized — 300 + (Thread Tension × 15) dmg

---

### ◆ Fray Disintegrator `unrav-ser-fray-disintegrator`
**Rarity**: Rare · **Type**: Seraphim · **Faction**: The Fray

*A Fray warrior who has discovered that the closer they are to complete dissolution, the more concentrated their will becomes. Their thread-form is barely held together — a suggestion of a warrior rather than one — but every loose strand is a razor.*

**Passive**: Gain 2 Thread Tension when placed; If Tension ≥ 7, gain +150 Oblivion

**Attack**: Unsynergized — 240 dmg · Synergized — 450 dmg; +200 bonus if Thread Tension Snapped this turn

---

### ✦ Tangle-Born Hybrid `unrav-ser-tangle-born-hybrid`
**Rarity**: Epic · **Type**: Seraphim · **Faction**: The Tangled

*Born from a Woven Order warrior and a Fray Disintegrator who were physically fused during a Snap overload at the Loom's center. The result carries both philosophies simultaneously, constantly at war with itself — and the internal war generates power that neither parent could have reached alone.*

**Passive**: Gain 2 Thread Tension when placed; When Tension Snaps, gain 1 additional Fate Knot

**Attack**: Unsynergized — 360 dmg · Synergized — 650 + (Fate Knots × 40) dmg

---

### ★ Selvara the Irreducible `unrav-ser-selvara-the-irreducible`
**Rarity**: Legendary · **Type**: Seraphim · **Faction**: None (Irreducible)

*Ten thousand years of pulling at a thread that predates causality has not made Selvara patient. It has made her precise. Her left side is woven so tightly it bends light. Her right side trails loose threads like smoke. She has not decided which side she is. She suspects she never will. She suspects this is the answer.*

**Passive**: Gain 3 Thread Tension when placed; When Tension Snaps, Draw 2 cards and gain +200 Oblivion

**Attack**: Unsynergized — 500 dmg · Synergized — 900 + (Thread Tension × 25) dmg; Early Snap if Tension ≥ 5

---

### ◈ Order Thread-Keeper `unrav-ser-order-thread-keeper`
**Rarity**: Common · **Type**: Seraphim · **Faction**: Woven Order

*A Woven Order warrior whose role is the unglamorous one: keeping track of the Loom's loose ends. They carry a catalogue of every thread that should not be loose, and they spend each battle putting things back where they belong.*

**Passive**: Gain 1 Thread Tension when placed; If Thread Tension is below 3, Draw 1 card

**Attack**: Unsynergized — 150 dmg · Synergized — 270 + (Thread Tension × 12) dmg

---

### ◆ Fray Unraveler `unrav-ser-fray-unraveler`
**Rarity**: Rare · **Type**: Seraphim · **Faction**: The Fray

*A Fray warrior who has dissolved past the point most Fray would consider the limit and found something on the other side — not nothing, but a heightened state of dissolution where every remaining thread-fiber carries the will of everything they gave up.*

**Passive**: Gain 3 Thread Tension when placed; If Tension Snapped this turn, gain +200 Oblivion

**Attack**: Unsynergized — 200 dmg · Synergized — 380 dmg; +250 bonus if Fate Knots ≥ 2

---

### ✦ Tangled Wire Golem `unrav-ser-tangled-wire-golem`
**Rarity**: Epic · **Type**: Seraphim · **Faction**: The Tangled

*A Tangled warrior whose thread-form has so thoroughly incorporated wire, cable, and conductive fiber alongside traditional thread that they have become something different: a being that carries electricity between their knots. Each Snap charges them further. The charge has nowhere to go except outward.*

**Passive**: Gain 2 Thread Tension when placed; Each time Tension Snaps while this is on board, gain 2 Fate Knots instead of 1

**Attack**: Unsynergized — 320 dmg · Synergized — 580 + (Fate Knots × 50) dmg

---

### ★ The Severed Weaver `unrav-ser-the-severed-weaver`
**Rarity**: Legendary · **Type**: Seraphim · **Faction**: None (Loom-Severed)

*A Threadborn severed from the Loom — not by death or dissolution, but by the Loom itself cutting them loose. They remain a thread-form: alive, woven, capable. But no longer connected to fate. They are the only Threadborn who can act without consequence to the Loom's structure. The Loom finds this outcome disturbing. It did not intend to cut them loose.*

**Passive**: Gain 3 Thread Tension when placed; Gain 1 Fate Knot immediately when placed

**Attack**: Unsynergized — 460 dmg · Synergized — 820 + (Fate Knots × 60) dmg; If Fate Knots ≥ 4, trigger an Early Snap after attacking

---

## Angels

### ◆ The Loom's First Thread `unrav-ang-the-looms-first-thread`
**Rarity**: Rare · **Type**: Angel · **Faction**: None (The Loom Itself)

*Not a warrior. Not a Threadborn. The literal first fiber woven by the first act of will in the universe, finally detached from the Loom's structure and moving on its own for the first time. It is older than any faction. It remembers nothing before itself. It does not know what it wants.*

**Summon Requirements**: 1 Seraphim + 1 Cherubim from hand

**Passive**: Each Snap generates +1 Fate Knot

**Activated Ability** (after 4 cards): Early Snap (Oblivion = Thread Tension × 50 + Fate Knots × 60)

---

### ✦ Threadwarden Incarnate `unrav-ang-threadwarden-incarnate`
**Rarity**: Epic · **Type**: Angel · **Faction**: Woven Order

*The Woven Order's apex warrior — a being who has maintained a single unbroken thread-form for eight hundred years without a single fiber out of place. They do not snap. They do not fray. They watch the Snaps of others and absorb the released Tension into controlled purpose.*

**Summon Requirements**: 2 Seraphim from hand

**Passive**: All Snaps deal +(Fate Knots × 30) additional Oblivion

**Activated Ability** (after 5 cards): Force a full Snap regardless of current Tension; Attack for 700 damage

---

### ★ The Unravelling Itself `unrav-ang-the-unravelling-itself`
**Rarity**: Legendary · **Type**: Angel · **Faction**: None (The Loom at Breaking Point)

*There are moments — rare, catastrophic, sacred — when the Loom gives way. Not at one point. All at once. Not because of a warrior or a Snap or a faction winning. But because something that was never supposed to exist has been pulled at long enough that the structure can no longer claim it was inevitable. This is that moment, given form.*

**Summon Requirements**: 1 Legendary Seraphim + 1 Epic Seraphim from hand

**Passive**: Gain 2 Thread Tension when any card is played; Each Snap resets Tension to 2 instead of 0

**Activated Ability** (after 7 cards): Full Snap (Oblivion = Thread Tension × 80 + Fate Knots × 100); Attack for 1600 damage; Draw 2 cards

---

### ✦ Selvara's Severed Half `unrav-ang-selvaras-severed-half`
**Rarity**: Epic · **Type**: Angel · **Faction**: None (Irreducible)

*Not Selvara herself — something that split from her during the ten-thousandth year of pulling the primordial thread. Her Order side and her Fray side had been in tension for so long that a fragment of the tension itself achieved independence. This is that fragment. It carries half of Selvara's memories — but not the same half as Selvara does.*

**Summon Requirements**: 1 Seraphim + 1 Epic card from hand

**Passive**: All Snaps generate +1 additional Fate Knot; Thread Tension cap increases to 12

**Activated Ability** (after 5 cards): Snap (Oblivion = Thread Tension × 60 + Fate Knots × 70); Draw 2 cards

---

### ★ The Primordial Fiber `unrav-ang-the-primordial-fiber`
**Rarity**: Legendary · **Type**: Angel · **Faction**: None (Pre-Loom)

*Selvara has been pulling at it for ten thousand years. It is not yet free. But it has begun to notice her.*

*The Primordial Fiber predates the Loom, predates the Threadborn, predates the concept of fate having a structure. It does not have a faction. It has only the vast, unhurried patience of something that has never needed to be anywhere quickly and is now being asked to move.*

**Summon Requirements**: 1 Legendary Seraphim + 1 Epic Cherubim from hand

**Passive**: All cards you play generate +2 Thread Tension; All Snaps deal +(Fate Knots × 80) bonus Oblivion

**Activated Ability** (after 8 cards): Snap (Oblivion = Thread Tension × 100 + Fate Knots × 120); Attack for 1800 damage; Gain 5 Thread Tension

---

## Mechanic Summary

| Resource | How Generated | How Spent |
|----------|---------------|-----------|
| **Thread Tension** | Playing cards (+1 base; Cherubim/Seraphim passives add more) | Auto-Snap at 10 (Oblivion + draw 2) · Early Snap (manual, partial effect) · Some Order cards spend Tension for draw |
| **Fate Knot** *(Eternal/Infinite only)* | +1 each time Tension Snaps (auto or early) | Passive amplifier — each stack increases Snap Oblivion coefficient |

**Snap Base Formula**: Oblivion burst on Snap = (Tension at time of Snap) × coefficient, modified by Cherubim passives and Fate Knots

**Full Fire Gate (Eternal/Infinite)**: Active Seraphim present + Tension has Snapped 2+ times this turn + Fate Knots ≥ 2
