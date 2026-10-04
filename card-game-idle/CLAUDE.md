# CLAUDE.md - Card Game Design Rules

> **Current terminology:** The primary currency is named **Divine Light** in all player-facing text. Legacy persisted/API field names such as `oblivion`, `lifetimeOblivion`, `bestSingleTurnOblivion`, `oblivion_flat`, and related event identifiers remain compatibility keys until a versioned save migration replaces them. Do not reintroduce the word Oblivion into new UI, card text, tutorials, quests, achievements, or design docs.

This file is the AI-facing project brief. Read it before making design, balance, card, UI, save, or test changes.

## Current Engine Snapshot

- Main Deck contains **Light** and **Dark** cards only.
- Extra Deck contains **Ain Soph Aur** cards only. Ain Soph Aur cards are never Main Deck cards.
- Ain Soph Aur cards cannot be searched from the Main Deck or salvaged from discard; search and salvage effects may target Light and Dark cards only.
- Main-deck cards are placed into the four support/back slots. Left-click from hand places Soph; right-click from hand places Ain.
- **Soph** cards are face-down and charge by +1 whenever any card is played from hand.
- A Soph card is ready at `SOPH_FLIP_CHARGE_REQUIRED = 2`. At that point it can flip to Ain and bank its charge as Limitless Light Stacks, or be sacrificed to convert a percentage of its charge into Limitless Light Stacks.
- **Ain** cards are face-up and active. Light cards can use Ain and Soph attacks. Dark cards can use their utility activation.
- Dark utility activations are free unless the card is premium or unusually strong. Current policy: most base one-shot Dark cards cost 0; only two base Legendary utilities cost 1; Eternal costs 2; persistent Enigmatic costs 1; persistent Transcendent costs 3-4.
- Ain Soph Aur cards summon from the Extra Deck to the four front slots using authored `summonMaterials` clauses. Clauses can require card types, specific IDs, and Ain/Soph sides; selected materials must satisfy every clause.
- Ain Soph Aur cards grant +1 Limitless Light Stack plus `onSummonEffects` when summoned, then use `bridgeAttack` for Bridge the Light.
- Light cards define a distinct `sophPlacementEffects` hook that resolves when placed face-down as Soph.
- Three owned materialized abilities can be equipped per deck and activated through Ability Amplification. Neutrality, Causality, Intensity and Transcendent abilities share the same saved deck loadout slots.
- Causality materialized abilities are implemented: two base-gated abilities require every base Causality card, two Eternal abilities require any Causality Eternal card, and two Infinite abilities require any Causality Infinite card.
- Challenge economy baseline: five daily challenges per rotation total 8,625 base Divine Light, targeting 60,375 across seven daily rotations; four weekly challenges total 100,000 base Divine Light. Collection Power can increase the final paid amount.
- Four additional Neutrality abilities are available after ownership gates: Null Horizon and Axiomatic Reversal require any Neutrality Eternal; Whiteout Domain and Infinite Accord require any Neutrality Infinite. A deck still equips only three abilities.
- Premium Light cards use distinct Soph-placement effects, and Eternal ASA cards use exact named-card summon materials. Phantom Matrix is exempt from all ASA materials in both logic and presentation: every ASA remains vibrant/selectable in its picker, zero materials are required or consumed, and normal ASA summons remain material-bound.
- Neutrality materialized abilities retain their set-specific gates. Other sets must not unlock them accidentally.
- Garden of Cards contains Valley of Null (Neutrality), Rift of Causality (Causality), and four-encounter Crater of Flames (Intensity). Each set owns distinct material currencies.
- Every Divine Light gain, including sacrifices, card effects, on-summon rewards, attacks, Bridge, quests, and pack flow, must route through the central grant path so Collection Power scaling applies exactly once.
- Collection Power is `1 + Resonance / 1000`. Its cap is the natural maximum `1 + (registered card count * 320) / 1000`, so registering new cards automatically raises it. Card-light does not directly increase Collection Power; it advances one card toward a Card-born Tier, and Resonance changes only when that tier threshold is crossed.
- Rarity sources are distinct: Common/Rare/Epic/Legendary from packs, Enigmatic from Enigmas, Eternal from Eternity's Wake, Infinite from Infinitude crafting, Transcendent from the Forge of Transcendence.
- Premium acquisition uses the transient full-screen ceremony queue: FoT cards/abilities, crafted Infinites, Eternal rewards/claimed gifts, and every positive Shard of Transcendence award. Use canonical framed holofoil card faces and intact shard art. Infinite is chromatic rainbow; Eternal is crimson/purple (Intensity red/orange/white); shards are white/pink/crimson. Batch adjacent multi-copy/shard awards with +N and totals. Never trigger from costs, load/reset, Debug's initial grant, or gift-send rollback.
- Shatter snapshots all current on-board Soph + Bridge base payouts at activation and grants that total × (1 + orbit power) through the central Collection Power path once, preserving the innate ASA bonus. Zero orbit pays the full total. Do not revert to fixed 1,000-per-stack damage or consume individual attack costs.
- Covered attack HUD animations pause and its DOM is not painted, preserving local UI state. Canvas rendering stops during attacks/menus/hidden tabs without stopping saves or gameplay. Deck Builder pauses offscreen holofoils with one shared visibility observer and skips offscreen tile contents using content-visibility.
- Transcendent materialized abilities are standalone from their cards and set-neutral: use shared Limitless Light Stacks, Divine Light, draw, and generic card zones only. Never make them generate/spend Cosmos or touch Causality/another set's mechanics.

## Latest Iteration Status

### Current UI, Cosmetics, And Art Briefs

- Ordinary screens use neutral white/black surfaces by appearance mode with player-colored accents, outlines, glows, and readable heading/button-title gradients. `theme.ts` separates stored source swatches from display surfaces. Four swatches hold for 60 seconds and fade for three; reduced motion switches without fading on the same 63-second cadence. Keep artwork, card finishes, special experiences, and semantic status/rarity colors distinct.
- Player Information uses a responsive ceremonial identity/workspace layout. Name/bio limits are 24/200; bio/theme are explicitly saved; five signature slots, social tools, portable saves, and wipe safeguards remain. Palette selection is in Player Information; Light/Dark Mode shares the persistent Settings value.
- Collection keeps its original filtering, favorites, ownership history, card art/foil, and virtualization. Infinite sections group by Neutrality/Intensity/Causality. Card Store is not named Celestial Archive. All currency and item/material images must retain their original supplied backgrounds and pixels across every screen: no alpha removal, matte cleanup, masks, CSS blending, rounded clipping, or cropping. This includes all Garden materials, not only currencies. Shared icon rules in `animations.css` enforce full-image containment. The four Intensity materials were restored byte-for-byte from preserved originals.
- All sixteen currency/material PNGs must remain the genuine opaque RGB originals. Earlier session currency backups already contained removed backgrounds and are not valid restoration sources. Original assets were recovered from Git history; `ItemIconIntegrity.test.ts` pins their exact hashes and requires PNG color type 2.
- Achievements has 20 presentation subcategories under Gameplay, Collection, Battles, Progression, Social, and Cosmetics, including 15 Intensity accomplishments. `achievementCategories.ts` is independent of reward groups and saved IDs; organization must never change existing payouts.
- Cosmetics > Custom Backgrounds has fourteen achievements: seven Forge backgrounds, four set crowns, and three Intensity base/Eternal/Infinite completion splashes. The three new images await artwork. Crown history predicates and slot IDs remain stable. All eight Neutrality Infinites are restored as live definitions; their crown now requires the actual eight-card roster. Historical theme unlocks remain honored.
- Seven Forge background cosmetics have installed PNGs in `src/assets/main-menu-backgrounds/`. The shared `customMainMenuBackgrounds.ts` registry links each canonical art stem to its achievement. Existing unlock/claim fields preserve earned rewards; profile selection and main-menu resolution enforce availability and gates. Missing-art state is conditional, not the current status of all seven images.
- `../Midjourney Art/Custom Main Menu Backgrounds.md` contains the Forge subject-first Splotched Ink prompts and requirement/filename map. Palette is white/black/pink-scarlet, distinct from Intensity orange/red fire.
- Intensity is live: 19 base cards (level counts 4/4/3/3/2/3), five Eternal boss rewards, five crafted Infinites, seven abilities (3 foundational/2 Eternal/2 Infinite), and Crater of Flames. It is a midrange alternative using existing Spectrum power bands. Its first boss HP equals the middle Neutrality boss; its last equals the last Neutrality boss.
- Limitless Inferno is uncapped and turn-local. Only Level 3+ Intensity Light Soph attacks spend it among card actions; Intensity abilities may also consume/reshape it. Dark activations still use Light costs. `IntensityRuntime.ts` owns generation/amplification/pool/reset; `intensityAbilities.ts` owns atomic ability execution. Embers, gained/spent history, next-gain amplification and tempering reset each turn. Shatter preserves Inferno because the turn continues. Every payout routes through `grantDivineLight`.
- Crater material keys are `emberglass`, `abyssalCinder`, `solarSlag`, `heartOfTheInferno`; v56 and store loading sanitize them. Five Infinite recipes consume two copies of their corresponding Eternal and only Intensity materials.
- `neutralityInfiniteCards.ts` restores eight historical IDs with existing art and recipes: two Light, four persistent Dark, two ASA, requiring Spectrum Level 4 or 5. Six typed instructions support capped resonance, Abyss recovery, charge release/grants, cooldown rebates, and balanced support pairs. Premium Neutrality set classification, sigils/mastery, and ability gates must exclude Causality.
- `../Midjourney Art/Intensity Set Prompts.md` uses concise Chinese mythological ink-manuscript descriptions with molten obsidian, orange/red infernos, white-hot accents, and no yellow/gold fire. All 48 gameplay assets are installed. Three completion splash and five boss portrait prompts await images; four expedition scenes remain optional targets. Never substitute other sets' art.
- Five Intensity portraits have boss-specific first-clear gates and named achievements. Their Vite-bundled assets belong in `src/assets/profile-pictures/intensity/`; missing images use explicit pending-art sigils. Completion splashes belong in `src/assets/main-menu-backgrounds/` and remain unequippable until available.
- Six optional lifetime Intensity records track plays, generated/spent Inferno, best generated turn, full Crater clears, and successful ability activations. Normalize on load and merge monotonically through boss/raid progress restoration with `intensityProgress.ts`. Do not infer past Inferno events from balances, count failed actions, or count trial activity.
- Codex progression/profile/background instructions use shared registries. Current Wake categories are Neutrality/Causality/Intensity.

### Earlier Gameplay Iterations

This iteration focused on state consistency, usability, and math correctness around the Causality / Limitless Cosmos loop and the endgame Shatter finisher.

- `Limitless Cosmos` is the current Causality turn-scoped resource. Causality cards are designed as a repeatable, beneficial loop: generate Cosmos, convert or bank it, and spend it to amplify utility or Divine Light gain without creating dead or punitive branches.
- All Causality cards and earned reward cards are intentionally authored around the same loop, and their utility should be readable as a single system instead of isolated one-offs.
- Card identity is treated as a one-source-of-truth across displays. Live turn cards use `getLiveCardFaceBackgroundStyle` and `getLiveCardShimmerClassName`; hand, board, collection, deck builder, rewards, pending-search modals, and profile cards share identical composed art and foil layers. Holofoil animation is a full-card inverted metallic field, never a basic white shimmer line. Face-down Soph cards render only their backing plus state badges.
- Ain, Soph, and Bridge attacks use the shared `AttackSequence` minigame with central OSU-style cursor orbit scoring. Orbit power only increases from sustained circular pointer movement around the center, is uncapped, and increases final multiplier; random movement/straight lines should not score. Layouts are deterministic per definition/mode for visual guidance, payouts resolve once through the store, and gameplay timers pause.
- `Shatter the Infinite Light` fades fully to black for 1.1 seconds before revealing its detailed event-horizon orbit field. The 10-second window awards one Limitless Infinity stack per completed consistent cursor circle around the core and 1,000 base Divine Light per stack before Collection Power; vertical, straight, and random movement do not score. Resolution returns front-row Ain Soph Aur to the Extra Deck, returns back-row and discarded cards to the draw pile, preserves the hand, clears turn resources without advancing the turn, and staggers active bosses while restoring their clock.
- Causality has five endgame Eternity's Wake bosses/Eternal rewards, five registered playable Infinite cards with recipes restricted to those Eternals and Rift materials, and the four-encounter Rift of Causality Garden dungeon.
- Rift materials are Seed of Causality, Causal Bloom, Shattered Causal Transcript, and Heart of Causality. Generated art is wired in runtime folders; replace in-place when better final art is available.
- Causality progression rewards include added titles, achievements derived from those titles, Causality profile pictures, and Causality Eternal/Infinite splash slots. Prompts live in `Midjourney Art/Causality Progression Rewards Prompts.md`.
- Causality art prompts now default to the splotched illuminated-ink look: distressed parchment, black dry-brush/splatter marks, cobalt/navy/violet/cyan/magenta accents, and circular celestial-mechanical forms. Preserve Causality's event-horizon/manuscript identity; future sets can define a different style.
- Forge of Transcendence art prompts live in `Midjourney Art/Forge of Transcendence Prompts.md`. This source covers the main menu tile, all wide banners, all wide 4:3 splash screens, all 3:4 card art, Shards of Transcendence, and Key of Transcendence item art. The Transcendence style is currently a little up in the air and remains provisional. Its current working lock is the Causality Splotched Ink family: dominant white and black ink, distressed parchment-white ground, stark white negative space, dense black circular splotches and dry-brush marks, with only bright pink-to-scarlet gradients weaving as flaming angelic wings, halos, ribbons, and celestial forms. Do not introduce blue, cyan, violet, purple, gold, orange, green, brown, gray-heavy, rainbow, glossy, or generic cosmic rendering without an explicit art-direction change. Preserve the prompt locks and aspect ratios when extending this art set.
- Enigma banner and progression currency prompts are consolidated in `Midjourney Art/Splotched Art Updated Prompts.md`. Use the same scope, shared visual language, parameters, named sections, fenced prompts, and negative-prompt structure as the canonical Splotched Ink guide; each asset remains visually unique.
- The duplicate-copy refinement menu is named `Card-light Resonance`, and its currency is `Card-light Shards`. Do not expose `Fracture Shards` or `Fracture Menu` in new UI, tutorials, or docs; `fractureShards` remains a legacy save/API key only.
- Midjourney vocabulary rule: do not rely on invented terms such as Ain, Soph, Ain Soph Aur, Light, or Dark as visual instructions. Translate them to real-world equivalents such as winged celestial guardian, face-down charged sigil, radiant ivory energy, and obsidian cosmic force. Use game terms only as labels, filenames, or minimal context.
- Weekly challenges can be consumed into two Super Weeklies after all four weekly rewards are claimed. Each targets a deterministic Eternity's Wake boss and grants extra rewards on victory.
- Daily login rewards use a persistent full-screen monthly calendar on local dates. Save migration 54 standardizes existing accounts at claimed Days 1–2 and locks the local day so Day 3 opens tomorrow; new accounts start in the same state. Days 1/15/28 grant 2,000/5,000/15,000 Divine Light; Days 10/25 grant 1/2 Shards of Transcendence; Days 7/14/21 grant 3 Card-light to owned cards; other dates grant Aberrated Shards. Bonus Shard rolls occur on Days 10 and 25 after Forge unlock. Streak milestones are Day 3 (+100 Aberrated Shards) and Day 14 (+2 Shards of Transcendence). The unlocked Forge wheel accrues one free spin per local day; spins accumulate and award only existing resources/mastery.
- Card-born thresholds are 10, 25, 50, 125, 250, 625, 1,250, and 2,500 Card-light.
- Causality ability tiers are gate-defined: Author the First Cause and Causal Cartography are Foundational; Pearlescent Mandate and Archive of Elsewhen are Eternal; Final Cause and Infinite Manuscript are Infinite. Never infer Causality tiers from their much larger purchase prices.
- The turn HUD stacks Board and Card-born Stacks in one left-side rail. The main menu shows Progress, Collection, and Play together, keeps Begin Turn as the fixed primary action, preserves the selected background and player quote, and cycles the Forge/Causality event banners with a timed progress bar.
- Enigma discovery is passive: opening-riddle completion changes an instance to acquired without auto-focusing it. Only acquired manuscripts can be locked on; only the selected Enigma advances. The authored scope is exact: “in one turn,” “at once,” and “at end of turn” are turn/board-bound checks, while cumulative goals use persisted `progressCounters` and show live progress trackers. Do not complete steps from lifetime counters, generic board presence, or stale snapshots.
- `Amplifier of the Void` is a persistent free Enigmatic Dark utility that draws 2, grants 3 Limitless Light Stacks, and grants 1,500 Divine Light when the post-activation pool reaches 5 stacks.
- Causality enigma rewards were increased to 3 copies per reward entry.
- Player-facing summary text must remain natural language; do not leak internal tokens like `cosmos_gte` or raw snake_case into the UI.
- Front-facing card faces show full-bleed artwork beneath the shared screen-blended splotched-ink frame; do not add top name/type ribbons or bottom rules panels. Put names and rules in inspectors, tooltips, or detail views instead. Face-down cards keep their canonical backing and state badges. Keep Deck Builder library cards proportional and reserve virtualized row height for ownership/lock controls. Eternity's Wake and Garden health overlays must show live Limitless Light Stacks because the normal HUD rail may be hidden.
- The current repo validation state is the latest focused pass: `npm run typecheck:tests` and `npm run build` pass; the Phantom Matrix selection regression passes. Two older AbilityRuntime assertions still encode the removed Divine Light ability-purchase economy and need migration before claiming the entire legacy suite is green.

## Core Loop

The game is turn-based, not idle-tick based. A normal run is:

```text
Begin Turn -> draw 5 -> mulligan -> play cards -> build Soph/Ain board -> attack/activate/summon -> end turn -> open packs -> improve decks
```

The player earns Divine Light through card actions and spends it primarily on Neutrality packs. Packs award live base Neutrality cards from the 52-card base pool: 24 Light, 24 Dark, and 4 Ain Soph Aur.

## Board Layout

```text
front:   [A0] [A1] [A2] [A3]    Ain Soph Aur only
support: [M0] [M1] [M2] [M3]    Main Deck Light/Dark, either Soph or Ain
```

- Front slots hold summoned Ain Soph Aur cards.
- Support/back slots hold main-deck Light/Dark cards.
- Force-removing a main-deck field card sends it to discard.
- Force-removing an Ain Soph Aur field card returns it to the Extra Deck.
- End turn clears the board and hand; main-deck cards cycle through discard/draw, while Ain Soph Aur leakage is corrected back into the Extra Deck by the invariant path.

## Card Types

| Type | Zone | Runtime behavior |
|---|---|---|
| Light | Main Deck | Can be placed Soph or Ain. Ain side has Ain Attack and Soph Attack. Soph side charges, flips, or sacrifices. |
| Dark | Main Deck | Can be placed Soph or Ain. Ain side activates utility effects, then one-shot cards return to hand/deck/discard; persistent premium cards remain with cooldown. |
| Ain Soph Aur | Extra Deck | Summons to front row by sacrificing a count of back-row cards. Uses Bridge the Light. |

Do not add Seraphim, Cherubim, Ophanim, Angel, sequence, or old Patience-system dependencies back into live gameplay.

## Inputs And UX

- Hand left-click: place main-deck card as Soph.
- Hand right-click: place main-deck card as Ain.
- Press `E`: swap hand view with Extra Deck view.
- Extra Deck click: begin summon-material selection.
- Field card left-click: open available action panel.
- Field card right-click: open force-remove confirmation.
- Hover details belong in the right-rail Card Inspector, not floating over the board or hand.
- Pack opening starts face-down and waits for individual card clicks, Reveal All/Reveal Best, or Instant. It must never auto-reveal on a timer.
- Card art should use the shared card-face style, which composes full-bleed art with the screened splotched-ink frame. Respect `settings.cardArtDisplay` everywhere a card face is shown; do not overlay name or rules bars on the art.
- Card-browser menus must display complete, proportional card artwork and frame. If the available panel cannot fit them, shrink the cards or split the workflow into submenus; never crop or squash the card art or frame to preserve a surrounding layout.
- Face-down cards show only the canonical card backing and state badges. Card names and rules belong in adjacent inspectors, tooltips, or detail views, not over card art.

## Effects And Actions

Cards are declarative data. Effects are serializable tagged objects from `src/types/effects.ts`, interpreted by `src/systems/cards/CardEffectExecutor.ts`. Store actions remain the authority for lifecycle changes such as moving cards, spending stacks, applying cooldowns, queuing pending choices, granting Divine Light, and recomputing derived state.

All new effect tags require:

1. Type union entry.
2. Executor case.
3. Readable card-summary formatting.
4. Pending-effect UI/store handling if player input is needed.
5. Runtime tests.

The executor uses an exhaustive switch; do not bypass it with ad hoc UI logic.

## Testing Expectations

Card and gameplay changes must preserve the executable audits:

- `CardRuntimeWiring.test.ts`: every registered card lifecycle, attack, utility, summon, Bridge, cooldown, and failure guard.
- `CardCatalog.test.ts`: catalog counts, registry exposure, playability, and cost policy.
- `FullTurnE2E.test.ts`: turn, mulligan, summon, Bridge, and hand-cap flows.
- `PackOpeningFlow.test.ts`: live Neutrality pack pool and collection awards.
- `PackOpeningModalSource.test.ts`: pack modal does not auto-reveal.
- `CardBackgroundAssetAudit.test.ts` and `LiveCardFaceSource.test.ts`: assets resolve and live hand/board foil composition remains unified.
- `CardMasteryProgress.test.ts`: Resonance tier crossings, canonical Collection Power scaling, registry-derived maximum, and truthful boss reward previews.
- `AttackSequence.test.ts`: deterministic guidance layouts, circular-only orbit scoring, uncapped orbit power, delayed payout, and cooldown application.
- `CausalityEndgame.test.ts`: five bosses/rewards, five restricted Infinite recipes, Rift encounter HP, materials, and drop rates.

Run focused tests for the touched subsystem first, then `npm run build`, `npm run typecheck:tests`, and `npm test -- --run` when the change crosses card/runtime/UI boundaries.

## Save Compatibility

Current player-facing mechanics may use old internal field names. Do not rename persisted fields like `oblivion` or effect tags like `oblivion_flat` without a versioned migration and compatibility read/write path. Save loading should tolerate old or malformed arrays, clear ephemeral active runs safely, and preserve long-lived progress.
