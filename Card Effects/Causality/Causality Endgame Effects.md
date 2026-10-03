# Causality Endgame Effects

This file summarizes implemented Causality endgame content. Causality materialized abilities are live in `src/data/abilities/abilityDefinitions.ts`; `Causality Ability Drafts.md` now preserves the design direction and runtime mapping.

## Eternity's Wake Rewards

- **The First Cause Unwritten** — Eternal Light. Soph placement gains 5 Cosmos, exchanges the top and bottom cards of the deck, then draws 2 cards.
- **The Last Horizon Remembered** — Eternal Light. Soph placement searches for a Dark card; if you hold at least 4 Cosmos, gain 10 Limitless Light Stacks and 4,000 Divine Light.
- **Sovereign Ink of the Black Sun** — persistent Eternal Dark. Inspects the top 5 and keeps 2; if 2 Cosmos are available, consumes them to draw 3 and gain 8 Light Stacks. Returns to hand on a four-card cooldown.
- **Chromatic Verdict of Elsewhen** — Eternal Dark. Recovers Light/Dark cards; if 3 Cosmos are available, consumes them for 7,500 base Divine Light and shuffles discard into the deck.
- **Pearlescent Engine Beyond Sequence** — Eternal Ain Soph Aur. Requires The First Cause Unwritten and Sovereign Ink of the Black Sun; on summon it generates 5 Cosmos and searches for one Light and one Dark card. Its Bridge value is derived from its registered Spectrum scaling.

## Infinite Cards

- **Origin Script of Every Tomorrow** — Infinite Light; Soph placement gains 8 Cosmos, searches for up to 2 Light and 2 Dark cards, and gains 6 Limitless Light Stacks. It has two authored attacks.
- **Chromatic Horizon Without End** — Infinite Light; inspects the top 7 and keeps 3, then converts 4 Light into 9 Cosmos when prepared.
- **Law-Eater of the Pearl Void** — persistent Infinite Dark; searches for one Light and one Dark card. If at least 4 Cosmos are available, it consumes them for 14,000 base Divine Light, 3 cards, and 10 Limitless Light Stacks.
- **Archive Reborn in Chromatic Ink** — persistent Infinite Dark; recovers one Light and one Dark card. If at least 3 Cosmos are available, it consumes them to search for another Light and Dark, shuffles discard into the deck, and gains 5 Cosmos.
- **Heart Beyond All Causality** — Infinite Ain Soph Aur; its summon generates 10 Cosmos, draws 3, searches for one Light and one Dark, and shuffles discard into the deck. Its Bridge uses registered Collection Power scaling and spends 8 Limitless Light Stacks.

## Materialized Abilities

- **Author the First Cause** and **Causal Cartography** require every base Causality card.
- **Pearlescent Mandate** and **Archive of Elsewhen** require any Causality Eternal card.
- **Final Cause** and **Infinite Manuscript** require any Causality Infinite card.
- All six use the universal three-slot Ability Amplification deck loadout and real cooldown timestamps.

Every Infinite recipe uses only the five Causality Eternal rewards and materials from Rift of Causality.

## Rift Materials

- Valley of Causality: Seed of Causality, 50%.
- Entrance of the Rift: Causal Bloom, 40%.
- Journey Through Causality: Shattered Causal Transcript, 30%.
- Core of Causality: Heart of Causality, 10%.

Final replacement artwork filenames and generation prompts live in `Midjourney Art/Causality Endgame Expansion Prompts.md`. Causality art prompts should follow the splotched illuminated-ink norm: distressed parchment, dense black dry-brush/splatter texture, circular celestial-mechanical forms, and controlled cobalt/navy/violet/cyan/magenta accents.