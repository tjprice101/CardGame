# Set-Specific Progression

Garden of Cards is set-filtered. Valley of Null, Nullified Lattice, Null-seared Light, and Nullified Oblivion-matter belong to Neutrality. Rift of Causality, Seed of Causality, Causal Bloom, Shattered Causal Transcript, and Heart of Causality belong to Causality. These material economies are not interchangeable.

Ability Materialization contains Neutrality, Causality, and Transcendent filters. Decks still equip only three abilities total. Neutrality has seven abilities with Eternal and Infinite ownership gates. Causality has six gate-defined abilities: Author the First Cause and Causal Cartography are Foundational; Pearlescent Mandate and Archive of Elsewhen are Eternal; Final Cause and Infinite Manuscript are Infinite. The four Transcendent abilities are First Dawn Accord, Axiom of Acceleration, Vault of Unwritten Futures, and Confluence of All Origins; each costs 8,000,000 Divine Light plus 30 Shards of Transcendence to purchase.

# Progression And Challenges

## Packs And Collection

Neutrality packs draw from the live base Neutrality pool: 24 Light, 24 Dark, and 4 Ain Soph Aur cards. Pack purchase must generate all five rewards before currency is deducted. Awarded cards are added to collection, then the pack-opening modal displays them face-down for manual reveal.

Starter accounts, new saves, and wiped saves start with 5,000 Divine Light and 5,000 lifetime Divine Light. Aberrated Shards, Card-light Shards, Card-bane Light, Entropic Energy, and the legacy entropy compatibility field start at 0. New accounts also receive the starter Neutrality collection/deck; the persisted `fractureShards` key remains for save compatibility only.

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

The login reward surface is a persistent monthly calendar using local dates. A claim awards the current local calendar date, not the next streak number; consecutive-login streak rewards are separate. Save migration 54 standardizes current accounts to Days 1–2 claimed and marks the current local day claimed, so Day 3 becomes available the next local day. New accounts begin from that same Day 2 state.

The live monthly schedule uses existing rewards only:

- Day 1: +2,000 Divine Light.
- Days 7, 14, and 21: +3 Card-light to every owned card.
- Day 10: +1 Shard of Transcendence.
- Day 15: +5,000 Divine Light.
- Day 25: +2 Shards of Transcendence.
- Day 28: +15,000 Divine Light.
- Other non-special dates: `20 + 5 × day` Aberrated Shards.

Forge-open bonus Shard rolls occur on Days 10 and 25, in addition to their direct calendar rewards. Streak milestones are one-time claims at 3 days (+100 Aberrated Shards) and 14 days (+2 Shards of Transcendence). After Forge unlock, one free wheel spin accrues per local day; unspent spins accumulate. Opening the Forge grants the first spin. Save v55 persists spin balance and accrual day.

The wheel contains only existing rewards; weights are normalized over 82 total tickets:

| Reward | Weight |
|---|---:|
| +50 Aberrated Shards | 20 |
| +3 Card-light to owned cards | 14 |
| +100 Aberrated Shards | 16 |
| +150 Aberrated Shards | 10 |
| +1 Shard of Transcendence | 8 |
| +500 Aberrated Shards | 5 |
| +1,725 Divine Light | 9 |

## Rarity Progression

- Enigmatic cards come from Enigmas.
- Eternal cards come from Eternity's Wake bosses.
- Infinite cards are crafted in Infinitude from specific Eternal recipes.
- Transcendent cards come from the Forge of Transcendence. Vol. 1: Before the First Shuffle contains the first four cards; further chapters may be added in future expansions.

The four materialized Transcendent abilities are separate from the four Transcendent cards and are not owned through a card. They are set-independent and use shared turn, card-play, hand/discard, and attack systems. They do not generate or spend Cosmos, target Causality cards/cooldowns, or depend on another set's systems. Their purchase cost is paid once; their listed Limitless Light Stack cost is paid on activation.

- First Dawn Accord: spend 6 stacks; your next 3 cards played each grant 1,500 base Divine Light (90s cooldown).
- Axiom of Acceleration: spend 8 stacks; your next 3 card plays each add 1 extra charge to every face-down Soph card (105s cooldown).
- Vault of Unwritten Futures: spend 10 stacks; choose 2 cards from your discard pile and raise your hand limit by 2 for 40 seconds. On expiry, discard down to your normal hand limit (120s cooldown).
- Confluence of All Origins: spend 12 stacks; your next Ain, Soph, or Bridge attack gains +2 multiplier (150s cooldown).

Shard drop rolls are gated until all five Forge Causality bosses have been cleared and the Forge is open. Each qualifying boss clear has a 1% base chance (dropping 1–3 Shards with equal 33.3% weighting), multiplied by the selected x2/x3 fight count. The final encounter of each available Garden expedition has a 1% roll (1–3 Shards). Monthly Login Calendar bonus rolls occur on days 10 and 25, also at 1% (1–3 Shards). Drop-rate labels remain hidden until both unlock conditions are satisfied.

Achievements and unlock gates should distinguish those rarity sources instead of treating all premium cards as one bucket.

## Achievements And Cosmetic Backgrounds

Achievement definitions derive from `src/data/profile/titleBadges.ts`; unlock/claim views and currency rewards belong to `src/systems/progression/achievements.ts`. The presentation taxonomy in `achievementCategories.ts` is separate from the reward group. Never change reward groups, IDs, or payouts merely to reorganize the menu.

The 19 subcategories are:

| Section | Subcategories |
| --- | --- |
| Gameplay | Card Play; Resources; Daily Devotion |
| Collection | Collection Growth; Holographic Cards; Infinity Crafted; Eternal Cards; Enigmatic Cards; Set Completion |
| Battles | Wake Milestones; Boss & Category Clears; Null Raids |
| Progression | Forge & Transcendence; Causality; Garden Expeditions; Ability Materialization |
| Social | Friends & Co-op |
| Cosmetics | Custom Backgrounds |

Null Raid achievements represent retained legacy progress, not a newly enabled mode. Every milestone is explicitly classified; unknown assignments fail visibly instead of disappearing. All Achievements is sectioned by the same categories. Search covers titles, requirements, reward names, and categories; status filters are All statuses, Ready to claim, Locked, and Claimed. Sidebar counts are total unlock counts, not filtered counts. Individual and Claim All actions use existing store claims.

`src/data/profile/customMainMenuBackgrounds.ts` is the source of truth for seven permanent Transcendent cosmetic rewards. Their currency rewards are zero; existing noncosmetic Forge milestone payouts are unchanged.

`crownBackgroundRewards.ts` adds four dedicated achievements for Neutrality Eternal Crown Splash, Neutrality Infinite Crown Splash, Causality Eternal Crown Splash, and Causality Infinite Crown Splash. Each uses its existing full-set theme gate (including lifetime ownership and persisted theme unlocks), retains `main-menu-bg-slot-{themeId}`, and awards a background/title without currency. Cosmetics > Custom Backgrounds therefore contains eleven achievements. The profile slots and imported overrides carry matching achievement IDs; earned achievements remain latched. Neutrality currently has no live Infinite definitions, so its empty-set gate stays locked unless the theme was already earned and persisted. This does not add playable Neutrality Infinite cards or recipes.

| Background | Requirement | Bundled PNG stem |
| --- | --- | --- |
| The Unsealed Impossible | Unlock the Forge | `forge-unsealed-impossible` |
| A Star Without a Sky | Own at least one distinct Volume I Transcendent | `forge-star-without-sky` |
| The Fourfold Absolute | Own all four distinct Volume I Transcendents | `forge-fourfold-absolute` |
| The Dawn That Devours Night | Acquire First Dawn Accord | `forge-devouring-dawn` |
| The Velocity of Silence | Acquire Axiom of Acceleration | `forge-velocity-of-silence` |
| Cathedral of Unwritten Tomorrows | Acquire Vault of Unwritten Futures | `forge-unwritten-tomorrows` |
| Where Every Origin Breaks | Acquire Confluence of All Origins | `forge-origins-break` |

All seven supplied PNGs are installed in `card-game-idle/src/assets/main-menu-backgrounds/`, not the repository root. Vite's eager asset glob bundles them for web and desktop. `mainMenuBackgrounds.ts` preserves canonical selection IDs, availability checks, and achievement gates; matching desktop imported art may override an image without bypassing the gate. Earned unlocks latch into existing `progress.achievementUnlocks`; claims remain in `achievementClaims`. No new save migration was needed.

Find the rewards in Achievements > Cosmetics > Custom Backgrounds; equip earned art in Player Information > Main Menu Background. Claiming is not required to equip an earned background. Duplicate copies cannot satisfy the four-distinct-card gate; acquiring an ability is separate from owning its associated card, equipping it, or activating it. Missing images honestly show Artwork pending, remain unequippable, and fall back to available unlocked art in the main menu. Do not substitute unrelated artwork into a missing reward slot.

## Proposed Art Versus Live Content

`Midjourney Art/Custom Main Menu Backgrounds.md` is the seven installed rewards' production prompt guide. Its subject-first Splotched Ink format follows the established replacement/updated/Forge guides, with distressed white paper, black dry-brush forms, and controlled pink-to-scarlet flames. Each silhouette differs and leaves space for main-menu overlays.

`Midjourney Art/Intensity Set Prompts.md` replaces the old Pyroabyss set prompt file as a **proposed art roster**, not a playable set. It has 29 concepts: Level 0/1/2/3/4/5 counts 4/4/3/3/2/3, five Eternal concepts, and five Infinity concepts. The Last Seam story combines white volcanic creation, black abyssal memory, and molten-gold bonds. All prompts use the shared Splotched Ink medium but their own white/black/gold palette; each Infinity concept derives from an Eternal counterpart and intentionally retains gold.

Do not expose Intensity as a live pack, boss category, card registry entry, unlock, or crafting recipe until those systems are explicitly implemented and tested. "Infinity" is the art brief's tier label; the current runtime rarity remains "Infinite." Proposed filenames are not runtime IDs. Older Pyroabyss splash/boss art remains legacy reference, not proof of live Intensity content.

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
