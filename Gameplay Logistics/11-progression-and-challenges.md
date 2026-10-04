# Set-Specific Progression

Garden of Cards is set-filtered. Valley of Null, Nullified Lattice, Null-seared Light, and Nullified Oblivion-matter belong to Neutrality. Rift of Causality, Seed of Causality, Causal Bloom, Shattered Causal Transcript, and Heart of Causality belong to Causality. Crater of Flames belongs to Intensity and grants Emberglass, Abyssal Cinder, Solar Slag, and Heart of the Inferno. These material economies are not interchangeable.

Ability Materialization contains Neutrality, Causality, Intensity, and Transcendent filters. Decks still equip only three abilities total. Neutrality has seven abilities with Eternal and Infinite ownership gates. Causality has six gate-defined abilities: Author the First Cause and Causal Cartography are Foundational; Pearlescent Mandate and Archive of Elsewhen are Eternal; Final Cause and Infinite Manuscript are Infinite. The four Transcendent abilities are First Dawn Accord, Axiom of Acceleration, Vault of Unwritten Futures, and Confluence of All Origins; each costs 8,000,000 Divine Light plus 30 Shards of Transcendence to purchase.

## Intensity Expeditions And Abilities

Intensity's five Eternal bosses each award one distinct Eternal card. Their first HP equals the middle Neutrality boss, and their final HP equals the final Neutrality boss: this is a midrange alternative, not a Causality endgame leap. Progression still orders Light/Dark rewards before Ain Soph Aur rewards, with each boss requiring the preceding clear in that set.

Crater of Flames has four encounters at 30,000 / 40,000 / 50,000 / 60,000 HP. Like other expeditions, each nonfinal encounter grants three current materials and one next material; the final encounter grants four of its material. The corresponding state keys are `emberglass`, `abyssalCinder`, `solarSlag`, and `heartOfTheInferno`.

Limitless Inferno is uncapped and turn-local. Card effects do not spend it except designated Light Soph attacks; materialized Intensity abilities are explicit exceptions. Foundational abilities require every registered base Intensity card; Eternal and Infinite abilities require any owned Intensity card of the corresponding rarity. Purchase costs are 12 Emberglass + 2 Abyssal Cinder (Foundational), 10 Abyssal Cinder + 4 Solar Slag (Eternal), or 12 Solar Slag + 6 Heart of the Inferno (Infinite).

| Tier | Ability | Activation | Cooldown |
| --- | --- | --- | --- |
| Foundational | Kindle the Depths | 3 Light stacks → 4 Inferno | 35s |
| Foundational | Bank the Flame | 6 Inferno → 12 Light stacks | 55s |
| Foundational | Temper the Hand | 4 Inferno → draw up to 2 cards; requires a nonempty draw pile | 60s |
| Eternal | Cinder Recall | 8 Inferno → recover the newest 2 eligible Intensity Light/Dark discard cards, or 1 if only 1 exists | 120s |
| Eternal | White-hot Reprieve | 10 Inferno → reduce Intensity cooldowns by 2; recover 1 Inferno per accelerated card, up to 4 | 120s |
| Infinite | Unquenched Reserve | 12 Inferno → double the next positive Inferno gain this turn; cannot stack | 180s |
| Infinite | Crucible Without End | Consume all Inferno, minimum 20 → 500 base Divine Light per stack; face-down Intensity Soph cards gain 1 charge per 10 spent, up to 5 | 180s |

`src/systems/abilities/intensityAbilities.ts` exports `activateIntensityAbility(state, abilityId, now)`, `getIntensityAbilityReadiness(state, abilityId, now)`, and `isIntensityAbility(id)`. Its `gainIntensityInferno(turn, amount)` export aliases `gainInferno` from `src/systems/cards/IntensityRuntime.ts`; there is one shared gain implementation. The activation helper checks busy/cooldown/resource/target conditions before mutation, stamps cooldowns on success, and returns `{ success: true, baseDivineLight }` or `{ success: false, reason }`. The readiness helper runs those same prechecks without mutation so HUD buttons match runtime availability. The store supplies ownership/loadout gates and sends returned Divine Light through its normal grant path. All positive card/ability Inferno gains must use the shared gain helper so Unquenched Reserve is consumed exactly once. Failed/zero/nonfinite gains do not consume it. Turn-end resets Inferno, its gained/spent counters, and the next-gain multiplier; ability cooldown deadlines remain intact.

Dedicated boss, dungeon, material, and ability art is pending. Missing Intensity art uses neutral surfaces/hidden image slots, never another set's image; `PENDING_ABILITY_ART_KEYS` records the seven unsupplied icons separately from supplied-asset audits.

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

The 20 subcategories are:

| Section | Subcategories |
| --- | --- |
| Gameplay | Card Play; Resources; Daily Devotion |
| Collection | Collection Growth; Holographic Cards; Infinity Crafted; Eternal Cards; Enigmatic Cards; Set Completion |
| Battles | Wake Milestones; Boss & Category Clears; Null Raids; Battleground |
| Progression | Forge & Transcendence; Causality; Intensity; Garden Expeditions; Ability Materialization |
| Social | Friends & Co-op |
| Cosmetics | Custom Backgrounds |

Null Raid achievements represent retained legacy progress, not a newly enabled mode. Every milestone is explicitly classified; unknown assignments fail visibly instead of disappearing. All Achievements is sectioned by the same categories. Search covers titles, requirements, reward names, and categories; status filters are All statuses, Ready to claim, Locked, and Claimed. Sidebar counts are total unlock counts, not filtered counts. Individual and Claim All actions use existing store claims.

`src/data/profile/customMainMenuBackgrounds.ts` is the source of truth for seven permanent Transcendent rewards and three Intensity completion splashes. Their currency rewards are zero; existing noncosmetic milestone payouts are unchanged.

`crownBackgroundRewards.ts` adds four achievements for Neutrality Eternal Crown Splash, Neutrality Infinite Crown Splash, Causality Eternal Crown Splash, and Causality Infinite Crown Splash. Each uses its existing full-set theme gate (including lifetime ownership and persisted theme unlocks), retains `main-menu-bg-slot-{themeId}`, and awards a background/title without currency. With three Intensity splashes, Cosmetics > Custom Backgrounds contains fourteen achievements. The profile slots and imported overrides carry matching achievement IDs; earned achievements remain latched. Neutrality Infinite Crown now requires all eight restored live Neutrality Infinites; historical theme unlocks remain valid.

| Background | Requirement | Bundled PNG stem |
| --- | --- | --- |
| The Unsealed Impossible | Unlock the Forge | `forge-unsealed-impossible` |
| A Star Without a Sky | Own at least one distinct Volume I Transcendent | `forge-star-without-sky` |
| The Fourfold Absolute | Own all four distinct Volume I Transcendents | `forge-fourfold-absolute` |
| The Dawn That Devours Night | Acquire First Dawn Accord | `forge-devouring-dawn` |
| The Velocity of Silence | Acquire Axiom of Acceleration | `forge-velocity-of-silence` |
| Cathedral of Unwritten Tomorrows | Acquire Vault of Unwritten Futures | `forge-unwritten-tomorrows` |
| Where Every Origin Breaks | Acquire Confluence of All Origins | `forge-origins-break` |
| The First Unbroken Eruption | Own all 19 base Intensity cards | `intensity-base-completion-splash` |
| The Five Who Command the Flame | Own all five Eternal Intensity cards | `intensity-eternal-completion-splash` |
| The Inferno Without a Last Dawn | Own all five Infinite Intensity cards | `intensity-infinite-completion-splash` |

All seven Forge PNGs are installed in `card-game-idle/src/assets/main-menu-backgrounds/`, not the repository root. The three Intensity splash PNGs await artwork in the same folder. Vite's eager asset glob bundles supplied images for web and desktop. `mainMenuBackgrounds.ts` preserves canonical selection IDs, availability checks, and achievement gates; matching desktop imported art may override an image without bypassing the gate. Earned unlocks latch into `progress.achievementUnlocks`; claims remain in `achievementClaims`.

Find the rewards in Achievements > Cosmetics > Custom Backgrounds; equip earned art in Player Information > Main Menu Background. Claiming is not required to equip an earned background. Duplicate copies cannot satisfy the four-distinct-card gate; acquiring an ability is separate from owning its associated card, equipping it, or activating it. Missing images honestly show Artwork pending, remain unequippable, and fall back to available unlocked art in the main menu. Do not substitute unrelated artwork into a missing reward slot.

## Proposed Art Versus Live Content

`Midjourney Art/Custom Main Menu Backgrounds.md` is the seven installed rewards' production prompt guide. Its subject-first Splotched Ink format follows the established replacement/updated/Forge guides, with distressed white paper, black dry-brush forms, and controlled pink-to-scarlet flames. Each silhouette differs and leaves space for main-menu overlays.

`Midjourney Art/Intensity Set Prompts.md` replaces the old Pyroabyss set prompt file and documents the **live 29-card Intensity roster**: 19 base cards (Level 0/1/2/3/4/5 counts 4/4/3/3/2/3), five level-3 Eternal cards, and five level-4/5 Infinite cards. Intensity is registered in the card catalog and its own pack, Eternity's Wake category, Crater of Flames expedition, Ability Materialization, and Infinitude. Five bosses award its five Eternal cards; five Infinite recipes each consume two copies of their corresponding Eternal and the recipe's Intensity dungeon materials. Its art direction uses concise Chinese mythological ink manuscripts: white parchment, black splotches, molten obsidian, hot orange/red infernos, and white-hot accents, not yellow/gold fire. All 48 gameplay assets are installed: 29 faces, back, pack banner, five boss banners, dungeon cover, four material icons, and seven ability icons. All material icons retain their complete supplied backgrounds and pixels; earlier Intensity alpha cleanup has been reversed. Only the three splash and five portrait rewards await new images; the four optional encounter-scene prompts are not runtime requirements.

Runtime rarity remains `Infinite`, even where older art briefs say "Infinity." Stable definition IDs are independent of human-readable art filenames. Missing assets do not block implemented gameplay and must not be disguised with another set's imagery. Older Pyroabyss splash/boss art remains legacy reference and is not used as Intensity's dedicated art.

## Intensity Accomplishments And Portraits

The three unlockable Intensity UI palettes (base completion, Eternal Crown, Infinite Crown) use deep crimson reds, hot orange accents, obsidian-black and white swatches. Their animated accents stay red/orange rather than adopting the generic gold Eternal or cyan Infinite tint. Light/Dark appearance still controls neutral reading surfaces; palette selection changes decorative colors, not splash artwork. Existing palette IDs and ownership-history unlock gates are unchanged.

The dedicated Intensity category contains 15 milestones:

- Card plays: 1, 100, and 1,000 Intensity cards.
- Lifetime Inferno generated: 100 and 10,000; spent: 100 and 1,000.
- Single-turn pressure: generate 50 Inferno, regardless of how much remains after spending.
- Full Crater expeditions: 1 and 25; only the final encounter increments the counter.
- Hold all four different Crater materials simultaneously.
- Materialize one Intensity ability, all three foundational abilities, and all seven abilities.
- Successfully activate Intensity abilities 100 times.

Existing dynamic achievements still cover the category clear, every boss, every Infinite craft, and base-plus-Eternal set completion. Five bosses and five Infinite crafts now have distinct lore-specific title epithets. Five additional named boss-trophy achievements accompany five portrait definitions in `intensityProfileRewards.ts`; each requires only its matching boss's first clear. Until supplied, portraits use explicitly labeled sigils, not broken image URLs. Their PNGs belong in `card-game-idle/src/assets/profile-pictures/intensity/`. All eight new cosmetic prompts are in the main Intensity art guide.

Lifetime records are optional, normalized on load, and preserved through boss snapshot restoration. Old card-play history can seed a missing Intensity play total, but past Inferno generation, spending, expeditions, and activations are not fabricated from current inventories.

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
