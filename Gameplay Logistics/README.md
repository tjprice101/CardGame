# Gameplay Logistics

This folder explains how Card Game Idle is built and how to reason about the code as if implementing it by hand.

## Reading order

1. [01-architecture-and-foundations.md](01-architecture-and-foundations.md)
2. [02-project-structure.md](02-project-structure.md)
3. [03-card-data-and-types.md](03-card-data-and-types.md)
4. [04-effect-system.md](04-effect-system.md)
5. [05-card-registry.md](05-card-registry.md)
6. [06-state-and-store.md](06-state-and-store.md)
7. [07-card-play-lifecycle.md](07-card-play-lifecycle.md)
8. [08-turns-attacks-and-limitless-light.md](08-turns-attacks-and-limitless-light.md)
9. [09-save-and-migrations.md](09-save-and-migrations.md)
10. [10-ui-and-card-text.md](10-ui-and-card-text.md)
11. [11-progression-and-challenges.md](11-progression-and-challenges.md)
12. [12-netplay-and-desktop.md](12-netplay-and-desktop.md)
13. [13-testing-and-build-workflow.md](13-testing-and-build-workflow.md)

These are explanatory documents, not runtime source files. When behavior changes, update the relevant guide so future work has the same mental model.

## Latest Iteration Notes

- Recent UI/cosmetic work is documented in [10-ui-and-card-text.md](10-ui-and-card-text.md) and [11-progression-and-challenges.md](11-progression-and-challenges.md): ordinary black/white surfaces with player-colored ceremonial accents, redesigned Player Information, mode-aware Collection/Card Store/Codex/pickers, and preserved artwork/special experiences.
- Achievements has 19 presentation subcategories under six sections, plus grouped All view, search, and claim-status filters. The taxonomy does not change saved IDs, unlock rules, reward groups, or payouts.
- Custom Backgrounds now includes eleven achievements: the seven Forge rewards plus four dedicated Neutrality/Causality Eternal/Infinite Crown Splash achievements. Crown gates reuse their existing theme/history conditions and saved slot IDs; no empty-set completion or extra currency payout is introduced.
- Seven Transcendent background cosmetics now have installed PNGs in `card-game-idle/src/assets/main-menu-backgrounds/`. Their Forge/card/ability requirements and permanent achievement gates remain intact. Profile background selection is separate from the UI palette; earned art can be equipped without first claiming the zero-currency achievement.
- `Midjourney Art/Custom Main Menu Backgrounds.md` follows the established Splotched Ink/Forge template with white/black/pink-scarlet art. `Midjourney Art/Intensity Set Prompts.md` is a separate proposed 29-card white/black/gold volcanic mythology with level counts 4/4/3/3/2/3 and five Eternal/five Infinity concepts. Intensity is not implemented gameplay content.
- Codex progression copy reflects the current profile, appearance, achievement, and background flows. Current Wake categories are Neutrality/Causality; retired art-set names must not be presented as available modes.

- Causality is now treated as a coherent `Limitless Cosmos` engine: cards are authored to generate, convert, hold, and spend Cosmos in a beneficial loop, with the deck encouraging conversion from Limitless Light into stronger ongoing utility and Divine Light payoffs.
- Enigma tracking is lock-on and scope-aware: the player chooses one unlocked manuscript to advance; one-turn, simultaneous-board, and end-turn requirements use their exact boundaries, while cumulative Causality card plays, Cosmos generated/consumed, Bridge attacks, and Twin-light summons use persisted counters displayed as live Enigma-panel trackers. Generic board presence, unrelated lifetime counters, and stale snapshots cannot complete steps.
- Amplifier of the Void is a persistent free Enigmatic Dark utility that draws 2 cards, grants 3 Limitless Light Stacks, and grants 1,500 Divine Light when the post-activation pool reaches 5 stacks.
- Ain, Soph, Bridge, and Shatter the Infinite Light use central cursor-orbit scoring with delayed store-owned payout. Only full, consistent circles score; vertical/straight/random movement does not. Attack timers, multipliers, fades, and pause rules are documented in guides 07 and 08.
- Shatter now preserves the hand, returns front cards to the Extra Deck, and returns back-row/discard cards to the draw pile while retaining boss stagger and clock restoration.
- Causality endgame now includes five Wake bosses/Eternal rewards, five playable Infinite recipes, and Rift of Causality with four materials. Art prompts and final replacement filenames are in `Midjourney Art/Causality Endgame Expansion Prompts.md`.
- Live card appearance is unified through `getLiveCardFaceBackgroundStyle` and `getLiveCardShimmerClassName`: hand, board, collection, deck builder, reward, pending-search, and profile surfaces use identical art/foil composition; holofoils use a full-card inverted metallic field; face-down cards show only their backing plus state badges.
- Base Causality and Transcendent card backs live in `public/assets/card-backgrounds/causality/Causality Card-backing.png` and `public/assets/card-backgrounds/infinite/Transcendant Card-backing.png`; `cardBackgrounds.ts` is the routing source of truth.
- Collection Power uses `1 + Resonance / 1000`, is applied once, and has a registry-derived natural maximum that rises automatically as cards are added.
- Card-born Tier thresholds are 10, 25, 50, 125, 250, 625, 1,250, and 2,500 Card-light.
- Card-browser menus must show complete proportional card artwork and the screened splotched-ink frame, without overlaid title or rules bars. Shrink cards or split the workflow into submenus before allowing the art or frame to crop or squash.
- The main menu presents Progress, Collection, and Play together, keeps Begin Turn fixed as the primary action, preserves the selected background and player quote, and cycles Forge/Causality event banners with a timer bar. Resource counters link to the existing Card Store and Divine Light reference.
- Board statistics and Card-born Stacks share a flow-positioned left HUD rail so variable panel height cannot create overlap.
- Causality materialized abilities are implemented in the runtime ability registry and shop: two base-gated, two Eternal-gated, and two Infinite-gated abilities. Decks still equip only three total abilities.
- Four standalone Transcendent abilities are also purchasable in Ability Materialization for 8,000,000 Divine Light and 30 Shards each. They are independent of their associated card names and use no Cosmos or set-specific mechanics.
- The four abilities spend 6/8/10/12 Limitless Light Stacks: First Dawn Accord grants 1,500 base Divine Light on each of your next 3 card plays (90-second cooldown); Axiom of Acceleration adds one charge to every face-down Soph on each of your next 3 card plays (105 seconds); Vault of Unwritten Futures lets you choose 2 discard cards and raises your hand cap by 2 for 40 seconds, then discards down to the normal cap (120 seconds); Confluence of All Origins gives your next Ain, Soph, or Bridge attack +2 multiplier (150 seconds).
- Spectrum Level is turn-scoped (Lv 0-5): pay 5 + current level Limitless Light Stacks and sacrifice one hand card to the Light-bound Abyss to advance; cards above your level cannot be played/summoned. See guide 11 for rarity floors, reset points, and deck-building details.
- Two Super Weekly challenges are available after all weekly challenge rewards are claimed, consuming the weekly rotation into two deterministic Eternity's Wake boss objectives.
- The login reward is a persistent local-date monthly calendar; its consecutive-login streak is tracked separately. Save v54 standardized accounts at claimed Days 1–2 and Day 3 opens on the next local day. Calendar rewards use existing resources: Divine Light on Days 1/15/28, Shards of Transcendence on Days 10/25, Card-light on Days 7/14/21, and Aberrated Shards on other dates. The Forge wheel accrues accumulating free daily spins after unlock; streak milestones award existing Aberrated Shards and Shards of Transcendence.
- Causality reward titles/achievements, profile pictures, reward themes, splash slots, and art prompts are implemented. Causality art prompts should follow the splotched illuminated-ink reference style unless a future set defines its own aesthetic.
- Forge of Transcendence art prompts are maintained in `Midjourney Art/Forge of Transcendence Prompts.md` and cover the main menu tile, all wide banners, all wide 4:3 splash art, 3:4 card art, Shards of Transcendence, and Key of Transcendence item art. The Transcendence visual style is currently a little up in the air and remains provisional. Its working direction inherits the Causality Splotched Ink family: dominant white and black, distressed parchment-white ground, dense black splotches/dry-brush marks, and only bright pink-to-scarlet flame gradients weaving as angelic wings, halos, ribbons, and celestial forms. Avoid unrelated palette drift or generic cosmic rendering until the style is finalized.
- Enigma banner prompts follow the canonical `Midjourney Art/Splotched Ink Replacement Prompts.md` structure and style. Keep the shared high-contrast splotched ink treatment, but make each manuscript banner unique in subject, composition, symbol language, and controlled accent palette.
- Enigma and future Midjourney prompts must translate invented gameplay terms into recognizable visual language: winged celestial guardian for Ain Soph Aur, face-down charged sigil for Soph, radiant ivory energy for Light, and obsidian cosmic force for Dark.
- The duplicate-copy refinement screen is named **Card-light Resonance**. Its resource is **Card-light Shards**; retain the legacy `fractureShards` save key internally for compatibility, but never expose the old name in player-facing text.
- Reward copy counts for Causality enigma rewards were increased to 3.
- Recent UI/cosmetic validation is focused, not a full-suite result: the documentation/in-game consistency pass had 127 passing tests across eight files, with test type-check, production build, and diff check passing. Earlier neutral-surface/profile and installed-background/category passes had 137 and 39 tests respectively. Consult `card-game-idle/AI_SESSION_HANDOFF.md` for scope; do not treat earlier full-suite notes as current validation.
