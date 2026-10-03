# AI Session Handoff

This file is the compact source of truth for the current project state. Use it for the next chat session instead of reconstructing the entire recent history.

## Verified status

Latest completed validation (documentation and in-game reference consistency pass):

- `npm run typecheck:tests` ✅
- 127 tests passed across eight focused files: TutorialModal, PlayerInformationLayout, SurfaceTextRoles, ProfilePaletteRotation, ProfileRegistries, CustomMainMenuBackgrounds, BackgroundAchievementUi, and AchievementCategories. This includes current in-game cosmetic instructions in both modes, every background requirement from the registry, real installed assets, category/claim behavior, and unchanged profile/appearance behavior.
- The latest installed-background pass completed with 39 tests across `CustomMainMenuBackgrounds`, `BackgroundAchievementUi`, and `AchievementCategories`, test type-check, production build, and diff check. All seven PNGs decoded in-browser and their production copies matched the source hashes. An earlier neutral-surface/profile pass completed with 137 focused tests and desktop/mobile browser checks in both modes. These are focused results, not a claim that the full legacy suite is green.
- Older validation notes report two `AbilityRuntime` assertions expecting the removed Divine Light ability-purchase economy; that full suite was not rerun in these UI/art sessions.
- `npm run build` ✅
- `git diff --check` ✅

## Current design state

- The four existing Neutrality/Causality Eternal/Infinite Crown Splash slots now have dedicated achievements via `crownBackgroundRewards.ts`. Cosmetics > Custom Backgrounds contains eleven rewards total (four crowns plus seven Forge backgrounds). Crowns reuse the existing theme ownership/history gates and canonical slot IDs, award no currency, and latch through existing achievement fields. Imported overrides retain their achievement gates, including Causality. Neutrality currently has no registered playable Infinite cards: its crown is not granted for an empty set, but an existing persisted theme unlock earns its achievement. No new crafting content or save migration was introduced.

- All seven supplied custom Forge main-menu background PNGs have been moved out of the repository root into `src/assets/main-menu-backgrounds/`, renamed to the canonical `forge-*.png` stems in the reward registry. The existing Vite glob bundles them for web/desktop; each keeps its matching achievement gate and canonical profile selection ID. No duplicate root images remain. System/UI tests cover installed previews, locked selection, every earned bundled selection, missing-art behavior via explicit mocks, and imported overrides.

- Achievements has 19 presentation subcategories under six sections. `achievementCategories.ts` explicitly classifies every milestone; dynamic boss/Infinity/set/background groups retain their matching categories. This taxonomy is separate from reward groups and saved IDs, preserving existing payouts and claims. The All view is sectioned, with title/requirement/reward search and All/Ready to claim/Locked/Claimed status filters. Category counts remain lifetime totals, while the shown count reflects filters. Navigation and rows adapt to narrow screens.

- Forward guides and Codex copy now describe the current profile, palette, achievement, and installed-background flows. Codex renders all eleven reward requirements from the shared registries and category count from the taxonomy. Reduced motion removes rotation fades, not swatch changes: it retains the 63-second cadence. Intensity remains a proposal, not a live set; legacy Pyroabyss art references are marked accordingly.

- Player Information now follows the ceremonial reference: desktop identity monument beside a separately scrolling tab workspace, ornamental portrait rings, clickable avatar/title pickers, lifetime medallions, full-width theme/signature panels, equipped background preview, and a save-status footer. `PlayerInformationPage.css` scopes the responsive layout; narrow screens stack and scroll naturally, and portrait rotation respects reduced motion. The appearance toggle uses the existing persistent `buttonColorMode` setting, not a separate local mode. Name/bio limits remain 24/200 with existing commit/save semantics; social, background gates, signature pickers, import/export, and both wipe confirmations remain intact. `PlayerInformationLayout.test.ts` covers real component interactions in both modes.

- Seven new Transcendent cosmetic background achievements cover Forge unlock, first Volume I card, all four distinct Volume I cards, and each of the four Forge ability acquisitions. `customMainMenuBackgrounds.ts` is the shared reward/filename registry; `titleBadges.ts` exposes them in the `background` group, with zero currency payout and permanent existing achievement unlock latches. Both the profile background tab and Achievements > Custom Backgrounds display their requirements and rewards. Existing Forge achievements retain their rewards.
- `../Midjourney Art/Custom Main Menu Backgrounds.md` contains seven 16:9 prompts rebuilt from the existing Splotched Ink/Forge subject-first template: explicit distressed paper, black splotched dry-brush construction, readable distinct silhouettes, and controlled pink-to-scarlet flames. The prior generalized apocalypse wording and universal chaos parameter are removed. Menu-safe upper-left and lower-center space remains explicit; names, requirements, and filenames are unchanged. All seven user-supplied images are now installed and bundled; artwork-pending behavior applies only to missing/unavailable art. Desktop imported overrides match the same filename stems and retain achievement gates. Main menu resolution checks availability and unlocks. Earned art can be equipped before claiming the zero-currency achievement. Focused system/UI tests cover exact distinct-card requirements, separate ability acquisition, persistence, zero-payout claims, import matching/gating, and both appearance modes.
- `../Midjourney Art/Intensity Set Prompts.md` replaces the old Pyroabyss artwork document with a proposed 29-card white/black/gold volcanic Splotched Ink roster: Level 0/1/2/3/4/5 counts are 4/4/3/3/2/3 (three Level 3 cards confirmed by the user), plus five Eternal and five Infinity concepts. The Last Seam mythology ties eruptions, abyssal memory, and gold-bound fractures together; five Infinity forms derive individually from five Eternal powers. These are art concepts and proposed filenames, not registered cards, effects, runtime IDs, or crafting recipes. Intensity deliberately retains gold in Infinity art rather than following the older chrome-only guide. Its palette is separate from the Forge background rewards.

- Collection uses shared appearance-aware surfaces, rounded filter controls, a fit-content artwork header title, and responsive card details. The card art/foil/back helpers and ownership-history/virtualization logic remain unchanged. Details pass `lightBg` into `CardRulesDigest` so highlighted rules remain readable in Light Mode, and favorites use `getCardFinishKey` consistently. `CollectionAppearance.test.ts` exercises both modes, filters/search/sort, keyboard opening, favorites, artwork, disabled actions, and acquisition links.
- Infinite Collection sections group by Neutrality/Causality, not Light/Dark/Ain Soph Aur. Archived Infinite records share their set section rather than adding a duplicate Neutrality heading; set filters and non-set sort modes remain unchanged.

- The 12 currency/resource, dungeon-material, and Forge-item PNGs have real feathered alpha cutouts instead of baked rectangular backdrops. Dimensions and foreground RGB are preserved. Card/Forge card artwork, avatars, and menu banners are excluded; keep transparency when replacing these item icons.

- Profile theme tiles, empty signature slots, background-state pills, and inactive tabs now use display-surface/text CSS roles, never raw editable swatches for their UI chrome. Inventory follows the appearance background; title/avatar browsers keep locked descriptions readable while only artwork dims. Deck loadout/analysis captions and pack-opening headings have matching surface roles. `SurfaceTextRoles.test.ts` covers actual components in both modes.

- The latest UI direction is neutral reading surfaces plus personal-color ceremonial flair: `getUiColorModePalette` enforces black/near-black or white/near-white surfaces for every theme, including raw profile previews. Rotation colors the accents, outlines, glows, and heading gradients, not the large surfaces or button fills. Light Mode adjusts accent brightness for contrast without replacing the player's hue with black. CSS publishes matching border/glow/shadow and semantic roles; profile previews also provide their own accent-pill foregrounds. `ProfilePaletteRotation.test.ts` checks all registered palettes, all four swatches, fades, surface neutrality, saturated ornaments, and 4.5:1 text/pill/gradient contrast. The default stays monochrome.
- Recently edited ordinary screens share this treatment through palette roles. Deck Viewer no longer has its own fixed blue palette; deck search/navigation, achievement counters, challenge columns, legacy profile, avatar/title/signature pickers, Codex selections, Collection controls, and Card Store selections use neutral surfaces with player-colored ornamentation. Artwork headers, main-menu splash art, card faces/foil, event art, Forge/Wake experiences, and gameplay special effects retain their own composition. Semantic rarity/set/status/warning colors remain meaningful rather than being replaced by decorative accents.

- Accent-filled pills use `--profile-accent-text` / `--profile-accent-soft-text`, not `accentDeep`. These foregrounds meet 4.5:1 contrast against their live fill in either appearance mode. For small semantic tier/status labels, `getReadableUiColor` preserves already-readable colors and adjusts only insufficient contrast; ordinary surface text and artwork copy keep their separate roles.
- Card Store set-rail badges and pack-banner tags use those accent foreground roles. Nested badges carry `data-ui-special-text` so global button lettering cannot turn their text white-on-white; Event Pack rail badges also carry `is-event` to match their soft-accent fill.

- Ain Soph Aur cards are Extra Deck-only: search and salvage effects may target Light and Dark Main Deck cards, but never Ain Soph Aur. Access Ain Soph Aur through summon or free-summon flows.

- The player-facing primary currency remains Divine Light.
- Causality is designed around a repeatable Limitless Cosmos loop: generate, convert, hold, and spend Cosmos for utility and Divine Light gain.
- The Causality deck should reward conversion from Limitless Light into useful Cosmos payoff lines rather than dead one-off effects.
- Causality materialized abilities are implemented and live in the ability registry/shop: Author the First Cause, Causal Cartography, Pearlescent Mandate, Archive of Elsewhen, Final Cause, and Infinite Manuscript. They use the existing three-slot saved deck loadout, Causality ownership gates, Cosmos/Light Stack costs, cooldown timestamps, and focused runtime tests.
- The four Forge materialized abilities are First Dawn Accord, Axiom of Acceleration, Vault of Unwritten Futures, and Confluence of All Origins. They are separate purchases (8,000,000 Divine Light + 30 Shards each) and use shared turn/card systems only. First Dawn grants 1,500 base Divine Light on each of the next 3 card plays; Axiom adds one charge to each face-down Soph on each of the next 3 card plays; Vault selects 2 discard cards and raises the hand cap by 2 for 40 seconds, then discards down to the normal cap; Confluence adds +2 to the next Ain/Soph/Bridge attack multiplier. Do not couple them to Cosmos, Causality cooldowns, or another set's mechanics. Focused activation tests are in `AbilityRuntime.test.ts`.
- Spectrum Level and its rarity floors are live. See `src/systems/cards/SpectrumLevel.ts`, `SpectrumLevel.test.ts`, and Gameplay Logistics guide 11. Do not treat the Forge abilities as card effects or add non-shared set resources to them.
- Card appearance is a single source of truth. Live turn surfaces use `getLiveCardFaceBackgroundStyle` plus `getLiveCardShimmerClassName`; hand, board, collection, deck builder, rewards, pending-search modals, and profile cards share the same composed art/foil layers. Holofoil animation is a full-card inverted metallic field, never a basic white line. Face-down Soph cards show only the card backing plus state badges, never front-face name/rules chrome.
- Ain, Soph, and Bridge attacks resolve through `AttackSequence`: store-owned delayed payout, paused encounter timers, and central OSU-style cursor orbit scoring. Orbit power increases only from sustained circular pointer motion around the center, is uncapped, and contributes directly to the attack multiplier. Legacy deterministic star/constellation data remains as visual guidance and a compatibility path.
- `Shatter the Infinite Light` uses a true 1.1-second fade to black before its detailed 10-second event-horizon orbit field. Full consistent cursor circles around the core create Limitless Infinity stacks worth 1,000 base Divine Light before Collection Power; vertical, straight, and random movement do not score. Resolution returns front-row Ain Soph Aur to the Extra Deck, returns back-row and discarded cards to the draw pile, preserves the hand, clears stacks/effects without advancing the turn, and staggers bosses while restoring their clock.
- Causality endgame content is implemented: five Eternity's Wake bosses and Eternal rewards, five playable Infinite cards with Causality-only recipes, and the four-encounter Rift of Causality dungeon with four dedicated materials.
- Final art filenames are wired for all new Causality cards, bosses, Rift cover, materials, ability icons, profile pictures, and Causality splash slots. Loose generated Causality art has been moved into runtime folders when present.
- Causality art prompts should use the splotched black-and-white illuminated-manuscript ink look as the current norm: distressed parchment/black ink, cobalt/navy/violet/cyan/magenta accents, dry-brush/splatter texture, and circular celestial-mechanical forms. Keep Causality-specific event-horizon/manuscript ideas for Causality; future sets may define their own aesthetic.
- Forge of Transcendence prompts are maintained in `Midjourney Art/Forge of Transcendence Prompts.md` and cover every Forge visual: the main menu tile, wide banners, wide 4:3 splash screens, 3:4 card art, Shards of Transcendence, and Key of Transcendence item art. The Transcendence style is intentionally still a little up in the air and should not be treated as permanently finalized. The current strongest direction is the Causality Splotched Ink family: dominant white and black, distressed parchment-white negative space, dense black circular splotches/dry-brush marks, and only bright pink through scarlet-red gradients weaving like flaming angelic wings, halos, ribbons, and celestial objects. Avoid blue, cyan, violet, purple, gold, orange, green, brown, gray-heavy rendering, rainbow palettes, and generic cosmic fantasy. Keep the universal Forge/Causality style-lock language and the current aspect ratios unless the art direction is deliberately revised.
- Enigma banner and progression currency prompts live together in `Midjourney Art/Splotched Art Updated Prompts.md` and use the canonical Splotched Ink structure: scope, shared visual language, parameter lines, named asset sections, fenced prompts with inline parameters, and a shared negative prompt. Keep the treatment consistent while making every asset unique.
- The duplicate-copy refinement destination is named `Card-light Resonance`; its player-facing currency is `Card-light Shards`. `fractureShards` remains only as a legacy persisted save key and internal compatibility path.
- Midjourney does not understand invented gameplay terms reliably. In future art prompts, translate Ain Soph Aur to winged celestial guardian/four-winged cosmic angelic figure, Soph to face-down charged sigil/sealed ritual card, Light to radiant white energy/luminous ivory light, and Dark to black void energy/obsidian cosmic force. Keep game terms only in labels or filenames.
- Board information and Card-born Stacks share one left-side vertical HUD rail with layout-driven spacing.
- Collection Power is `1 + Resonance / 1000`, applied once. Its natural maximum is derived from `CardRegistry.getAll().length * 320`, so adding registered cards raises the cap automatically. Card-light is per-card XP; Resonance changes only when a Card-born Tier is crossed.
- The main menu shows Progress, Collection, and Play together; Begin Turn is fixed as the primary action, resource counters route to existing screens, and Forge/Causality banners rotate with a timer bar. The profile quote sits beneath the avatar and the selected background is preserved.
- Enigma tracking is condition-based and lock-on driven. The player chooses one unlocked manuscript in `EnigmaModal`; only that Enigma advances. Explicit one-turn, simultaneous, and end-turn requirements use the correct runtime scope, while cumulative requirements use persisted progress counters and display live trackers. Never complete a step from generic board presence, an unrelated lifetime counter, or a stale progress snapshot.
- `Amplifier of the Void` is a persistent free Enigmatic Dark utility: draw 2 cards, gain 3 Limitless Light Stacks, then gain 1,500 Divine Light if the post-activation stack pool is at least 5.
- Causality enigma reward copies are set to 3 per reward.
- Challenges include two Super Weeklies: after all four weekly challenges are completed and claimed, the rotation can be consumed into two deterministic Eternity's Wake boss objectives. Each target completes independently and awards extra shards plus an additional boss reward card copy. The Login Calendar uses local dates; consecutive-login streak rewards are separate.
- Card-born thresholds are 10, 25, 50, 125, 250, 625, 1,250, and 2,500 Card-light.
- Causality ability tiers follow ownership gates, not purchase-price heuristics: Author the First Cause and Causal Cartography are Foundational; Pearlescent Mandate and Archive of Elsewhen are Eternal; Final Cause and Infinite Manuscript are Infinite.
- Every card-browser menu must preserve the complete card artwork and screened splotched-ink frame at the canonical aspect ratio. Shrink cards or restructure the menu into submenus before allowing either to crop, squash, or overflow.
- Front-facing card art has no overlaid name/type ribbon or rules panel. Use the shared full-art face helpers; show names and rules in inspectors or detail views. Face-down collection/back views keep their backing and state badges.
- Deck Builder library cards use a stable proportional `160x220` face with virtualized row height reserved for the card, ownership label, and lock controls.
- The Login Calendar is a full-screen Main Menu > Progress surface with local-date claims. It uses existing Aberrated Shards, Divine Light, Card-light, and Shards of Transcendence rewards with their resource PNGs; it no longer awards Base Cards. Save migration 54 standardizes to Days 1–2 claimed and allows Day 3 on the next local day. The Forge wheel accrues accumulating free local-day spins after unlock; Save v55 persists spin balance.
- Daily login claims are limited to one successful claim per local day. Save migration 54 standardizes existing accounts at Days 1–2 claimed and locks the current local day so Day 3 is claimable tomorrow; new accounts start the same way. Days 1/15/28 grant 2,000/5,000/15,000 Divine Light, Days 10/25 grant 1/2 Shards of Transcendence, Days 7/14/21 grant 3 Card-light to owned cards, and remaining dates grant Aberrated Shards. The Forge wheel accrues one free spin per local day after unlock, and missed spins accumulate.
- Enigma discovery is passive: an opening riddle changes an instance to `acquired` without auto-focusing it. Only an acquired Enigma can be locked on, and only the locked-on Enigma advances beyond its opening condition. Discovered-but-locked enigmas remain visible but non-focusable.
- Phantom Matrix is a true free-summon path: while its picker is active every Ain Soph Aur stays vibrant/selectable, zero materials are required or consumed, and normal ASA summons remain material-bound.
- Eternity's Wake and Garden health-bar overlays show the live Limitless Light Stack count directly. Attack sequences/Shatter pause encounter timers and absolute cooldown/buff deadlines.
- Main Menu Causality event art is wired to `public/assets/event-art/causality/Causality Event Banner.png`; move loose generated art into runtime folders after wiring.
- UI summary text must stay in natural language and must not leak internal tokens or snake_case fields.

## Important files to read first

For the latest UI/cosmetic/art work:

- [UI and card-text guide](../Gameplay%20Logistics/10-ui-and-card-text.md)
- [Progression and cosmetic guide](../Gameplay%20Logistics/11-progression-and-challenges.md)
- [Testing scope](../Gameplay%20Logistics/13-testing-and-build-workflow.md)
- [Display palette roles](src/ui/theme.ts)
- [Player Information](src/ui/player/PlayerInformationPage.tsx)
- [Achievement presentation categories](src/systems/progression/achievementCategories.ts)
- [Background reward registry](src/data/profile/customMainMenuBackgrounds.ts)
- [Background loading and resolution](src/data/profile/mainMenuBackgrounds.ts)
- [In-game Codex](src/ui/menus/TutorialModal.tsx)
- [Custom background prompt/filename map](../Midjourney%20Art/Custom%20Main%20Menu%20Backgrounds.md)
- [Proposed Intensity roster](../Midjourney%20Art/Intensity%20Set%20Prompts.md)

For earlier gameplay systems:

- `card-game-idle/CLAUDE.md`
- `card-game-idle/.github/copilot-instructions.md`
- `Gameplay Logistics/README.md`
- `src/state/store.ts`
- `src/systems/progression/EnigmaSystem.ts`
- `src/data/cards/causalityCards.ts`
- `src/data/cards/causalityInfiniteCards.ts`
- `src/systems/cards/AttackSequence.ts`
- `src/data/dungeons/gardenDungeonDefinitions.ts`
- `src/systems/progression/cardMastery.ts`
- `src/ui/cardBackgrounds.ts`
- `src/ui/menu/MainMenuHub.tsx`
- `src/data/abilities/abilityDefinitions.ts`
- `src/ui/cardStatSummary.ts`
- `Midjourney Art/Causality Ability Icon Prompts.md`
- `Midjourney Art/Causality Progression Rewards Prompts.md`

## Working rules for future chats

1. Do not restart from scratch: read this handoff, then the docs, then the exact files touched by the task.
2. Do not claim a fix as complete without fresh verification output.
3. Keep summaries short and file-backed rather than large threaded context.
4. Preserve the source-of-truth model: if a fact matters long-term, write it down in a file.
5. When a task crosses gameplay/UI boundaries, run focused tests first and then the full validation gate.

## Recommended next-chat prompt

"Read the current handoff and project rules, then continue from the verified state. Keep the scope narrow, preserve the source-of-truth rules, and confirm any new changes with relevant verification before claiming completion."
