# Copilot Instructions

## Git Workflow
- All development work happens on the `development` branch only.
- Never merge to `main` or push to `main` unless the user explicitly says it is ready to deploy.
- Do not run `git checkout main`, `git merge`, or `git push origin main` on your own initiative.

## Divine Light Rules
- Treat sequence terminology as removed gameplay language.
- Never add new sequence-related effects.
- **Divine Light** is the player-facing name for the primary currency formerly called Oblivion.
- Use Divine Light in all new UI, card descriptions, tutorial copy, quests, achievements, and design documentation.
- Existing save/API identifiers (`oblivion`, `lifetimeOblivion`, `bestSingleTurnOblivion`, `oblivion_flat`, and related event names) are legacy compatibility keys. Do not remove or rename them without a save migration and a compatibility read/write path.

## Retired content and current unlock rules
- Wake Trials and Endless Gauntlet are removed. Do not add `onOpenWakeTrials`, `onOpenEndlessGauntlet`, `startWakeTrial`, `startEndlessGauntlet`, `recordGauntletRun`, `trial`/`gauntlet` boss kinds, `weeklyTrialCompletions`, or `gauntletBest` back into live code.
- Main-menu gates use their live progression sources: 5 Infinite copies unlock Ascension, 5 Eternal copies unlock Infinitude, and opening 10 card packs unlocks Enigma. Locked destinations remain visible with their current requirement.
- Enigma UI belongs in `EnigmaModal`; Daily and Weekly challenges belong in the visible Challenges surface. Do not render an `EnigmasPanel` inside the Challenges modal.
- Neutrality design must be Ain/Soph-system-native. Avoid generic draw/chain templates when reworking Neutrality cards.

## Current Ain/Soph Engine (authoritative)
- Main Deck: Light and Dark only.
- Extra Deck: Ain Soph Aur only. Ain Soph Aur cards are never Main Deck cards.
- Hand controls: left-click places a main-deck card as face-down Soph; right-click places a main-deck card as face-up Ain. Extra Deck cards use their summon flow, not Soph/Ain placement.
- Soph is face-down and charging; Ain is face-up and active. `SOPH_FLIP_CHARGE_REQUIRED = 2`; at 2+ charge, flip Soph to Ain and convert its charge into Limitless Light Stacks, or sacrifice it to convert a percentage of charge into Limitless Light Stacks.
- Light cards have Ain and Soph attacks. Dark cards are utility cards. Ain Soph Aur cards summon to the front row from the Extra Deck and use Bridge the Light.
- Ain Soph Aur summon requirements use `summonMaterials` clauses. Clauses may require types, specific definition IDs, and Ain/Soph sides; do not reduce them to an occupied-slot count.
- Every successful Ain Soph Aur summon grants +1 Limitless Light Stack as a universal rule; do not duplicate this on individual card faces.
- Three materialized abilities can be equipped per deck and activated through Ability Amplification. Neutrality and Causality abilities share the same saved deck loadout slots.
- Causality materialized abilities are implemented and must remain fully wired through definitions, purchase gates, deck loadouts, store activation, cooldown timestamps, icon assets, and tests. Base Causality abilities require every base Causality card; Eternal Causality abilities require any Causality Eternal; Infinite Causality abilities require any Causality Infinite.
- Challenge economy targets approximately 52,500 base Divine Light across seven daily rotations and 100,000 base Divine Light across one weekly rotation. Collection Power scales the paid amount above the base target.
- Null Horizon and Axiomatic Reversal require any Neutrality Eternal card; Whiteout Domain and Infinite Accord require any Neutrality Infinite card. These are high-cost endgame abilities, and only three abilities may be equipped at once.
- Eternal and Infinite Light cards require distinct, authored Soph-placement effects. Premium ASA cards may require exact named Light or Dark materials; Phantom Matrix always bypasses materials.
- Neutrality endgame ability gates are Neutrality-specific: Null Horizon/Axiomatic Reversal require any Neutrality Eternal card, while Whiteout Domain/Infinite Accord require any Neutrality Infinite card. Causality has its own separate ability gates.
- Garden of Cards has set-filtered expeditions: Valley of Null for Neutrality and Rift of Causality for Causality. Future sets should define separate currencies, dungeon rewards, and gates unless an intentional thematic overlap is authored.
- Dark activation-cost policy: ordinary one-shot Dark utilities should usually cost 0; reserve Limitless Light costs for premium/reusable/high-impact cards.
- Every Divine Light gain, including sacrifice rewards and card effects, scales from Collection Power exactly once through the central grant path.
- Collection Power uses `1 + Resonance / 1000`, with a dynamic natural cap derived from every registered card's maximum 320 Resonance contribution. Never restore a fixed ×3 cap. Card-light is mastery XP and changes Resonance only when a Card-born Tier threshold is crossed.
- Rarities are distinct: normal rarities, Enigmatic (Enigma rewards), Eternal (Eternity's Wake rewards), Infinite (Infinity-menu crafting), and Transcendent (Null Raid progression).

## Completed Systems Snapshot
- Neutrality content currently registers 27 Light, 28 Dark, and 12 Ain Soph Aur cards across base, Enigmatic, Eternal, and Transcendent sources. Base Neutrality packs contain 52 live cards: 24 Light, 24 Dark, and 4 Ain Soph Aur.
- Nine Neutrality Eternal boss rewards, four Transcendent Null Raid cards, and two Enigmatic rewards are implemented and art-wired.
- Daily and weekly challenges track current Light/Dark/Ain/Soph/stack/summon/Bridge/boss/raid actions.
- Achievements distinguish Infinity crafts, Eternal boss rewards, Enigmatic rewards, and Transcendent Null Raid ownership.
- Universal Ain/Soph rules are documented in the base tutorial; card stat panels should show only card-specific values.
- Supplied Neutrality card art and wide Eternity's Wake boss art live under `public/assets/card-backgrounds` and are covered by the asset audit.
- Card hover details belong in the right-rail Card Inspector, not floating over the board/hand. Pack opening waits for individual clicks, Reveal All/Reveal Best, or Instant; do not re-add timed auto-reveal.
- Card faces across gameplay, pack opening, pending modals, collection, deck builder, rewards, and profile screens should use shared card-face helpers. Live turn surfaces specifically use `getLiveCardFaceBackgroundStyle` and `getLiveCardShimmerClassName`, with one lightweight shimmer and identical hand/board composition. Face-down cards show only their backing plus state badges; front-face chrome must not render.
- Card menus must preserve the complete card aspect ratio and all face regions. Shrink cards or redesign/split the menu before allowing clipping, squashing, or overflow.
- Holofoil animation is a full-card inverted metallic field by source/rarity, never a basic white shimmer line. Do not add screen-specific foil classes or manual art overlays that change layer order.
- Causality art prompts should use the current splotched black-and-white illuminated ink norm: distressed parchment, heavy black dry-brush/splatter texture, cobalt/navy/violet/cyan/magenta accents, and circular celestial-mechanical forms. Keep this as the Causality default; future card sets may define their own aesthetic.
- Forge of Transcendence art prompts are consolidated in `Midjourney Art/Forge of Transcendence Prompts.md`. This applies universally to the main menu tile, wide banners, wide 4:3 splash art, 3:4 card art, Shards of Transcendence, and Key of Transcendence item art. The current direction is strongly provisional/up in the air: use the exact Causality Splotched Ink family as the base, with dominant white and black ink, stark parchment-white negative space, black circular splotches and dry-brush marks, and only bright pink-to-scarlet flame gradients weaving as angelic wings, halos, ribbons, and celestial forms. Do not drift into generic cosmic art or blue/cyan/violet/purple/gold/orange/green/brown palettes. Preserve the current prompt structure and locks, but treat the Transcendence style as subject to further refinement.
- Enigma banners and progression currency icons are consolidated in `Midjourney Art/Splotched Art Updated Prompts.md`. Follow its exact Splotched Ink format and keep every banner/icon distinct in subject, composition, symbol language, and accent palette.
- The duplicate-copy refinement destination is `Card-light Resonance`; its currency is `Card-light Shards`. Never add the old `Fracture Shards` or `Fracture Menu` wording to player-facing UI, tutorials, or documentation. Preserve `fractureShards` only as a legacy save compatibility key.
- Midjourney does not know the game's invented vocabulary. Translate Ain Soph Aur into winged celestial guardian/four-winged cosmic angelic figure, Soph into face-down charged sigil/sealed ritual card, Light into radiant white energy/luminous ivory light, and Dark into black void energy/obsidian cosmic force. Keep invented terms out of the visual subject description.

## Latest Iteration Status
- The current Causality set is built around a repeatable `Limitless Cosmos` loop: generate, convert, hold, and spend Cosmos for utility and Divine Light gains. The deck should reward converting existing Limitless Light into useful Cosmos loops rather than creating dead or one-off payoffs.
- All reward and board-view card appearances should share the same card source of truth so packs, collections, deck builders, and the board never show inconsistent variants of the same card.
- Ain/Soph/Bridge attacks use `AttackSequence`: central OSU-style cursor orbit scoring, deterministic visual guidance layouts, store-owned delayed payout, one resolution, and paused timers. Orbit power is uncapped but only increases from sustained circular pointer motion; do not grant score for straight-line/random movement. Do not bypass the sequence by granting attack payout directly from BoardDisplay.
- `Shatter the Infinite Light` has a 1.1-second full-black priming beat followed by a detailed 10-second cursor-orbit event-horizon field. Each completed consistent circle creates one Limitless Infinity stack worth 1,000 base Divine Light before Collection Power; vertical, straight, and random movement must not score. It returns front cards to Extra Deck, returns back-row/discard to draw, preserves hand, and staggers bosses while restoring their clock.
- Causality endgame includes five Wake bosses/Eternals, five playable Causality Infinites with Causality-only recipes, and Rift of Causality with four materials. Preserve the category filters and recipe restriction.
- Causality progression rewards include Causality titles/achievements, profile pictures, reward themes, and splash slots. Prompts live in `Midjourney Art/Causality Progression Rewards Prompts.md`.
- Weekly challenges include two Super Weekly conversions after all four weekly rewards are claimed; both target deterministic Eternity's Wake bosses and complete independently on boss victory.
- Daily login rewards use a persistent monthly catch-up calendar. Card-born thresholds are 10, 25, 50, 125, 250, 625, 1,250, and 2,500 Card-light.
- Causality ability tiers are ownership-gate based: the two `allCausalityBase` abilities are Foundational, the two `anyCausalityEternal` abilities are Eternal, and the two `anyCausalityInfinite` abilities are Infinite. Do not classify them by purchase cost.
- The main menu uses the responsive Play / Collection / Progress Command Deck in `MainMenuHub.tsx`; preserve its contextual artwork, visible lock requirements, and complete destination coverage.
- The Board panel and Card-born Stacks panel belong in the shared left-side HUD rail and must remain flow-positioned rather than independently absolutely positioned.
- Enigma completion logic must be condition-driven, scope-aware, and lock-on driven. The player selects one unlocked manuscript in `EnigmaModal`, and only that Enigma advances. One-turn, simultaneous, and end-turn requirements must use their exact runtime boundary; cumulative requirements must use persisted counters and expose progress trackers. Do not allow false positives from lifetime counters, generic board checks, or stale snapshots.
- Neutrality and Causality enigma steps are expected to reflect the actual authored requirement text; if a condition is not met, the step must not complete.
- Causality enigma reward copies are set to 3 per reward.
- `Amplifier of the Void` draws 2 cards, grants 3 Limitless Light Stacks, and conditionally grants 1,500 Divine Light when the resulting stack pool is at least 5.
- Player-facing stat summary text must be formatted as natural language and must never leak raw effect tags or snake_case field names.
- Current known-good validation state from the iteration: `npm run typecheck:tests`, `npm test -- --run`, and `npm run build` all completed successfully in the working tree.

## Required Regression Coverage
- Card/runtime edits must keep `CardRuntimeWiring.test.ts`, `CardCatalog.test.ts`, and `FullTurnE2E.test.ts` meaningful.
- Pack edits must keep `PackOpeningFlow.test.ts` and `PackOpeningModalSource.test.ts` passing.
- After cross-cutting gameplay/UI edits, run focused tests first, then `npm run build`, `npm run typecheck:tests`, and `npm test -- --run`.
