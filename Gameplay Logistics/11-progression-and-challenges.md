# Set-Specific Progression

Garden of Cards is set-filtered. Valley of Null, Nullified Lattice, Null-seared Light, and Nullified Oblivion-matter belong to Neutrality. Rift of Causality, Seed of Causality, Causal Bloom, Shattered Causal Transcript, and Heart of Causality belong to Causality. These material economies are not interchangeable.

Ability Materialization contains Neutrality, Causality, and Transcendent filters. Decks still equip only three abilities total. Neutrality has seven abilities with Eternal and Infinite ownership gates. Causality has six gate-defined abilities: Author the First Cause and Causal Cartography are Foundational; Pearlescent Mandate and Archive of Elsewhen are Eternal; Final Cause and Infinite Manuscript are Infinite. The four Transcendent abilities are First Dawn Accord, Axiom of Acceleration, Vault of Unwritten Futures, and Confluence of All Origins; each costs 8,000,000 Divine Light plus 30 Shards of Transcendence to purchase.

# Progression And Challenges

## Packs And Collection

Neutrality packs draw from the live base Neutrality pool: 24 Light, 24 Dark, and 4 Ain Soph Aur cards. Pack purchase must generate all five rewards before currency is deducted. Awarded cards are added to collection, then the pack-opening modal displays them face-down for manual reveal.

Starter accounts, new saves, and wiped saves start with zero currency balances: Divine Light, lifetime Divine Light counters, Aberrated Shards, Card-light Shards, Card-bane Light, Entropic Energy, and the legacy entropy compatibility field all begin at 0. The persisted `fractureShards` key remains for save compatibility only.

`PackOpeningFlow.test.ts` verifies pool validity, five-card rewards, collection updates, and currency deduction.

## Collection Power

Collection Power comes from card mastery and is computed with `computeGlobalResonanceScore(progress)`. It scales Divine Light grants through the central grant path:

Card-born Tier thresholds are 10, 25, 50, 125, 250, 625, 1,250, and 2,500 Card-light.

## Spectrum Level

Spectrum Level is the per-turn progression level from 0 to 5. Cards can only be played or summoned when their required level is at or below the current level. Level-up costs `5 + current level` Limitless Light Stacks and one chosen hand card, sent to the Light-bound Abyss. Level-up is a free action, not a card play. The Abyss is sealed until deck zones reset; level resets to 0 each turn and at new Garden encounters, boss fights, and Battleground matches. Phantom Matrix may free-summon an ASA up to one level above current.

Rarity floors are Enigmatic 1, Eternal 2, Infinite 4, Transcendent 5. Spectrum attack power is balanced by both rarity and origin; the rarity bands are non-overlapping so higher-rarity attack baselines stay above lower-rarity baselines. Deck Builder shows a level filter and curve; keep enough level-0 cards to start a turn.

```text
maximum resonance = registered card count * highest-tier resonance contribution
maximum multiplier = 1 + maximum resonance / 1000
multiplier = min(maximum multiplier, 1 + max(0, resonance) / 1000)
```

The cap therefore rises automatically whenever cards are added to the registry. Attack previews should use the same Collection Power value as runtime payout calculation.

## Daily And Weekly Challenges

`src/systems/progression/quests.ts` owns templates, rotation, reset boundaries, and reward scaling. The current counts are:

- Daily: 5 active challenges.
- Weekly: 4 active challenges.

Rotations avoid repeating the previous rotation's template IDs when enough alternatives exist. The Challenges UI presents Daily and Weekly in independently scrollable columns.

After all four weekly challenge rewards are claimed, the weekly rotation can be consumed into two Super Weekly Challenges. They target two deterministic Eternity's Wake bosses for that week. Each target completes independently and awards bonus Aberrated Shards plus an additional copy of that boss's reward card.

## Monthly Login Calendar

The login reward surface is a persistent monthly calendar. A claim awards the reward for the current UTC calendar date, not the next streak number; consecutive-login streak rewards are separate. The monthly track mixes Aberrated Shards, base-card copies, holofoil base-card copies, Card-light grants applied to owned cards, and occasional Shards of Transcendence.

## Rarity Progression

- Enigmatic cards come from Enigmas.
- Eternal cards come from Eternity's Wake bosses.
- Infinite cards are crafted in Infinitude from specific Eternal recipes.
- Transcendent cards come from the Forge of Transcendence.

The four materialized Transcendent abilities are separate from the four Transcendent cards and are not owned through a card. They are set-independent and use shared turn, card-play, hand/discard, and attack systems. They do not generate or spend Cosmos, target Causality cards/cooldowns, or depend on another set's systems. Their purchase cost is paid once; their listed Limitless Light Stack cost is paid on activation.

- First Dawn Accord: spend 6 stacks; your next 3 cards played each grant 1,500 base Divine Light (90s cooldown).
- Axiom of Acceleration: spend 8 stacks; your next 3 card plays each add 1 extra charge to every face-down Soph card (105s cooldown).
- Vault of Unwritten Futures: spend 10 stacks; select 2 cards from your discard pile and raise your hand limit by 2 for the rest of the turn (120s cooldown).
- Confluence of All Origins: spend 12 stacks; your next Ain, Soph, or Bridge attack gains +2 multiplier (150s cooldown).

Shard drop rolls are gated until all five Forge Causality bosses have been cleared and the Forge is open. Each qualifying boss clear has a 0.1% base chance, multiplied by the selected x2/x3 fight count. The final encounter of each available Garden expedition has a 0.1% roll. Monthly Login Calendar bonus rolls occur on days 10 and 22, also at 0.1%. Drop-rate labels remain hidden until both unlock conditions are satisfied.

Achievements and unlock gates should distinguish those rarity sources instead of treating all premium cards as one bucket.

## Enigmas

Enigma progress can complete during a boss run. The player locks on to one unlocked manuscript in the Enigma menu, and only that manuscript advances. If a run restores a pre-run progress snapshot, the store must capture and merge Enigma flags and cumulative progress counters so mid-run progress is not lost. Requirements explicitly scoped to one turn, a simultaneous board state, or the end of a turn must not complete outside that scope. Non-turn goals such as Causality card plays, Cosmos generated/consumed, Bridge attacks, and Twin-light summons use persisted counters shown as live trackers in the Enigma panel.

The `Amplifier of the Void` reward is a persistent free Dark utility: it draws 2 cards, grants 3 Limitless Light Stacks, and grants 1,500 Divine Light when the resulting stack pool is at least 5.

`neutralizing-the-void` targets `boss-hollow-king` and retains its timed-clear requirement.

## Events

Wished Upon A Star event timing is centralized in `src/ui/eventWishedUponAStar/eventTimer.ts`. Keep event timing in one place so tiles and event screens do not disagree.

## Causality Endgame

- Eternity's Wake includes a Causality filter with five endgame bosses. The first exceeds one million HP and the category rises through its own anchored curve.
- Each boss awards one unique, registered Causality Eternal card.
- Rift of Causality is a four-encounter Garden dungeon using the same five-minute encounter timer as Valley of Null. Its 160,000 HP opening encounter is four times Valley's final 40,000 HP encounter.
- Rift materials are Seed of Causality (50%), Causal Bloom (40%), Shattered Causal Transcript (30%), and Heart of Causality (10%).
- Five playable Causality Infinite cards have recipes containing only Causality Eternal rewards and those four Rift materials.
- Causality progression rewards include titles/achievements, profile pictures, reward themes, and Eternal/Infinite splash slots.
- Causality Midjourney prompts should use the splotched illuminated-ink look as the current norm: distressed parchment, heavy black dry-brush and splatter texture, cobalt/navy/violet/cyan/magenta accents, and circular celestial-mechanical forms. Keep Causality-specific event-horizon/manuscript concepts in Causality prompts; future sets may define a different visual style.
- Forge of Transcendence prompts are the separate working art brief in `Midjourney Art/Forge of Transcendence Prompts.md`. The style applies to the Forge menu tile, banners, wide 4:3 splash screens, 3:4 card art, Shards of Transcendence, and Key of Transcendence. It is still a little up in the air rather than final: currently use the Causality Splotched Ink structure with dominant white/black ink, stark parchment-white negative space, black circular splotches, and bright pink-to-scarlet flame gradients forming angelic wings, halos, ribbons, and celestial objects. Keep the palette and composition locks intact unless the art direction is deliberately revised.
- Enigma manuscript banners and progression currency prompts are consolidated in `Midjourney Art/Splotched Art Updated Prompts.md`, using shared visual language and parameters followed by named fenced prompts and one shared negative prompt. The treatment stays consistent while each asset remains visually unique.
- Do not use invented gameplay terms as the main visual instruction in Midjourney prompts. Translate Ain Soph Aur, Soph, Light, and Dark into recognizable real-world visual equivalents as documented in the canonical Splotched Ink prompt guide.
- Silent Exchange is a Neutrality Dark utility: exchange one Light or Dark card from hand for one opposite-type card from the deck, then shuffle the returned card into the deck.
