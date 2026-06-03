# Card Set Mechanics Audit — Per-Set Mechanics Reference Documents

You are auditing every card set in a Vite + React + TypeScript card game at `card-game-idle/`. Your job is to produce **one Markdown reference document per card set**, written to a new top-level folder `Core Mechanics/`, that exhaustively documents the **mechanics** (not flavor) of every set as currently implemented in code.

## Output Location and File Naming

Create the folder `Core Mechanics/` at the workspace root (alongside `card-game-idle/` and `Midjourney Art/`). Inside it, create **one file per set** plus a small number of cross-cutting files:

Per-set files (one each, named exactly):
- `Black Glass Inferno.md`
- `Blazing Garden.md`
- `Age of the Butterfly.md`
- `Death-flamed Hell.md`
- `Eternal Seas.md`
- `Glass Absolute.md`
- `Heavenly Light.md`
- `Infinite Cards.md`
- `Mechanical Dreams.md`
- `Neutrality.md`
- `Prismatic Accord.md`
- `Pyroabyss.md`
- `Snowbound Voltage.md`
- `Thornbound Plains.md`
- `Wished Upon A Star.md`
- `Eternal (cross-set Eternal rarity).md`
- `Abyssal Forge.md` (if it is a standalone set; otherwise document as a subsection of the most appropriate set and note the decision in the README)

Cross-cutting files:
- `README.md` — index of all set docs, the legend of card types (Seraphim / Cherubim / Ophanim / Angel / Eternal / Infinite), the elements list, and a short "how to read these docs" note.
- `_Shared Mechanics.md` — engine-level mechanics shared across sets: turn structure, mulligan, hand draw, board layout (front/back slots), Oblivion, Aberrated Shards, Entropic Energy, Radiance, Patience system, Card-break / stagger, freeze, attack power, durability, discards, reshuffle, mastery (Card-light), artifacts, infinite trigger, boss fights vs Null Raids vs Eternity bosses vs Trials vs Gauntlet (mechanics only, not lore).
- `_Glossary.md` — every keyword/effect type/counter referenced by any card, with the canonical code-side name in backticks (e.g. `CardEffect.type = 'discard_draw'`, `turn.glassWhiteLedger`, `bg-inf-noon-that-never-sets`).

## Required Per-Set Document Structure

Each set file must use this exact H2 outline. Omit a section only if the set genuinely has nothing there, and explicitly write "None in current code." rather than dropping the heading.

```
# <Set Name>

## Set Identity
- Code source files (list every file in src/data/cards/ and src/systems/cards/ that contributes to this set, with workspace-relative links).
- Element(s) used (cite src/data/elements/ or src/data/elements.ts).
- Card type distribution (counts of Seraphim / Cherubim / Ophanim / Angel / Eternal / Infinite in this set).
- Associated boss(es), if any (cite src/data/bosses/bossDefinitions.ts).
- Associated pack(s) (cite src/data/packs/).
- Associated trial decks, if any (cite src/data/trialDecks.ts).

## Core Mechanic(s)
For each mechanic that defines the set's identity:
- Mechanic name (use the in-code name where one exists; otherwise propose one and mark **(naming: proposed)**).
- One-paragraph mechanical description.
- The state fields it reads/writes (e.g. `turn.burningGardenLineagesPlayed`, `turn.blackGlassWhiteFlame`).
- Trigger points (play, end-of-turn, on-discard, on-summon, on-damage, etc.).
- Interactions with other set mechanics, if any.
- Code citations: file + line range for the canonical implementation.

## Counters, Resources, and Persistent State
Table form. Columns: Name (code name) · Scope (turn/board/run) · Initial value · How it increases · How it decreases/resets · Read by which cards.

## Card Type Notes
For each card type present in the set, describe how this set uses that type differently from the default behavior described in _Shared Mechanics.md (e.g. "Cherubim in Burning Garden persist on board unless they char").

## Attack / Damage Profile
- Typical attack power band for this set's units.
- Any set-specific damage rules (multipliers, conversions, shared-damage broadcasts, etc.).
- Cite enforcement scripts if relevant (scripts/enforce-attack-power-constraints.mjs, rebalance-authored-attacks.mjs).

## Win/Loss & Boss Interactions
- How this set interacts with boss fights, Null Raids, Trials, Gauntlet, or Eternity co-op.
- Any cards that only function inside specific encounter modes.

## Card Catalog
Table with every card in this set. Columns: Card ID · Name · Type · Rarity · Element · One-line mechanical summary · Key state fields it touches · Code reference (file#Lstart-Lend).
Sort by rarity desc, then by ID.

## Notable Cards (Deep Dive)
3–8 cards that best exemplify the set, each with a short prose breakdown of their full effect resolution and corner cases.

## Open Questions / Inconsistencies
Bullet list of any contradictions between code and the Midjourney prompt files for this set (Midjourney Art/<Set Name> Set Prompts.md), unverified behaviors, or dead code paths. Mark each **UNVERIFIED** with what would resolve it.
```

## Method Requirements

1. **Read first, then write.** Before writing any set doc, scan:
   - All files in `card-game-idle/src/data/cards/`.
   - `card-game-idle/src/systems/cards/` (especially `CardEffectExecutor.ts`, `TurnSystem.ts`, `SynergySystem.ts`, `DeckSystem.ts`, `ActionClass.ts`, `LateGameAttackIdentity.ts`).
   - `card-game-idle/src/cards/CardRegistry.ts`, `CardFactory.ts`, `RegistryBoot.ts`.
   - `card-game-idle/src/state/store.ts` for any `xxxSetName...` state fields, counters, and special end-turn / on-play branches (search for substrings like `burningGarden`, `blackGlass`, `glassAbsolute`, `pyroabyss`, `neutrality`, `thornbound`, `snowboundVoltage`, `mechanicalDreams`, `prismaticAccord`, `infinite`, `butterfly`, `wishedUponAStar`, `eternalSeas`, `deathFlamed`, `light`, `radiance`, `patience`, `embergrove`, etc.).
   - `card-game-idle/src/data/elements/` and `elements.ts`.
   - `card-game-idle/src/data/bosses/bossDefinitions.ts`.
   - `card-game-idle/src/data/packs/`.
   - `card-game-idle/src/data/trialDecks.ts`.
   - The corresponding `Midjourney Art/<Set Name> Set Prompts.md` only to cross-check **mechanics** (not lore). Code is the source of truth.

2. **Cite everything.** Every mechanical claim must include a workspace-relative file link with line range, e.g. `card-game-idle/src/state/store.ts#L1700-L1772`. Do not invent line numbers — re-read the file before citing.

3. **Discover, do not invent.**
   - Enumerate the actual set membership by tracing card definition arrays/exports in `src/data/cards/<set>Cards.ts` and the registry boot.
   - Discover keyword names from the code (`CardEffect.type` union, `turn.*` fields, function names). Use those exact names in backticks.
   - If a Midjourney prompt describes a mechanic that does not exist in code, list it under **Open Questions** rather than documenting it as real.

4. **No flavor, no lore, no marketing copy.** Mechanical descriptions only. Card names are fine; do not paraphrase flavor text.

5. **No code edits.** Read-only audit. Only create files inside the new `Core Mechanics/` folder.

6. **Tone.** Terse, technical, table-heavy. Prefer bullet points and tables over prose. Each set file should be self-contained but link to `_Shared Mechanics.md` and `_Glossary.md` for engine-wide concepts rather than redefining them.

7. **Cross-set mechanics.** If a mechanic spans multiple sets (e.g. global Eternal-rarity rules, Patience system used by Neutrality but also referenced elsewhere), document it in `_Shared Mechanics.md` and link from each set that consumes it. Do not duplicate full descriptions across set files.

8. **Validation pass before finalizing each file.**
   - Confirm every Card ID listed in the catalog actually exists in the registry.
   - Confirm every state field cited exists in `store.ts` / `types/`.
   - Confirm every code reference resolves to real lines.
   - At the bottom of each set file, add a single line: `<!-- audit: cards=<N> mechanics=<M> citations=<C> unverified=<U> -->`.

## Set-to-File Mapping (use this exact mapping)

| Set file | Primary code file(s) | Midjourney reference |
|---|---|---|
| Black Glass Inferno.md | src/data/cards/blackGlassInfernoCards.ts, blackGlassInfernoAngels.ts | Midjourney Art/Black Glass Inferno Set Prompts.md |
| Blazing Garden.md | src/data/cards/blazingGardenCards.ts | Midjourney Art/Blazing Garden Set Prompts.md |
| Age of the Butterfly.md | src/data/cards/butterflySetCards.ts | Midjourney Art/Age of the Butterfly Set Prompts.md |
| Death-flamed Hell.md | src/data/cards/deathFlamedHellCards.ts | Midjourney Art/Death-flamed Hell Set Prompts.md |
| Eternal Seas.md | src/data/cards/eternalSeasCards.ts | Midjourney Art/Eternal Seas Set Prompts.md |
| Glass Absolute.md | src/data/cards/glassAbsoluteCards.ts | Midjourney Art/Glass Absolute Set Prompts.md |
| Heavenly Light.md | src/data/cards/lightHRCards.ts, lightSeraphims.ts, lightAngels.ts | Midjourney Art/Heavenly Light Set Prompts.md |
| Infinite Cards.md | src/data/cards/infiniteCards.ts | Midjourney Art/Infinite Cards Set Prompts.md |
| Mechanical Dreams.md | src/data/cards/mechanicalDreamsCards.ts, mechanicalDreamsAngels.ts | Midjourney Art/Mechanical Dreams Set Prompts.md |
| Neutrality.md | src/data/cards/neutralityCards.ts, neutralityCherubimCards.ts, neutralityChaosCards.ts, neutralityAngel.ts | Midjourney Art/Neutrality Set Prompts.md |
| Prismatic Accord.md | src/data/cards/prismaticAccordCards.ts, prismaticAccordAngels.ts | Midjourney Art/Prismatic Accord Set Prompts.md |
| Pyroabyss.md | src/data/cards/pyroabyssCards.ts, pyroabyssCherubimCards.ts, pyroabyssAngels.ts | Midjourney Art/Pyroabyss Set Prompts.md |
| Snowbound Voltage.md | src/data/cards/snowboundVoltageCards.ts | Midjourney Art/Snowbound Voltage Set Prompts.md |
| Thornbound Plains.md | src/data/cards/thornboundCards.ts, thornboundAngels.ts | Midjourney Art/Thornbound Plains Set Prompts.md |
| Wished Upon A Star.md | src/data/cards/wishedUponAStarCards.ts | Midjourney Art/Wished Upon A Star Set Prompts.md |
| Eternal (cross-set Eternal rarity).md | src/data/cards/eternalCards.ts | (no single prompt file — pull mechanics from code only) |
| Abyssal Forge.md | src/data/cards/abyssalForgeCards.ts | (no prompt file — pull from code; if it is a subset of another set, note that and consolidate) |

## Final Deliverable Checklist

Before declaring done, verify:
- [ ] `Core Mechanics/` exists at workspace root.
- [ ] All per-set files above are present and follow the H2 outline.
- [ ] `README.md`, `_Shared Mechanics.md`, `_Glossary.md` are present.
- [ ] Every card in `src/data/cards/*Cards.ts` appears in exactly one set catalog (no card unaccounted for).
- [ ] No citation points to a line range that no longer exists.
- [ ] No flavor text or speculative mechanics; everything is sourced from code or flagged **UNVERIFIED**.

Begin by indexing the registry and producing `README.md` + `_Glossary.md` first, then `_Shared Mechanics.md`, then write set files in alphabetical order of the file names above.
