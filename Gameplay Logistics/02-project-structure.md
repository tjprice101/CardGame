# Project Structure

The application lives in `card-game-idle/`.

## Root Files

- `package.json`: scripts and dependencies.
- `tsconfig.json`: strict app TypeScript settings.
- `tsconfig.node.json`: Node/Vite TypeScript settings.
- `vite.config.ts`: Vite build configuration.
- `index.html`: browser shell.
- `CLAUDE.md`: AI-facing project rules.
- `.github/copilot-instructions.md`: Copilot-facing project instructions.
- `electron/main.mjs` and `electron/preload.mjs`: desktop wrapper.

## `src/`

- `app/`: top-level React composition.
- `assets/main-menu-backgrounds/`: seven bundled custom achievement background PNGs, discovered by Vite's asset glob. Their canonical stems match `data/profile/customMainMenuBackgrounds.ts`; do not leave supplied images in the repository root.
- `audio/`: music, radio, and SFX.
- `cards/`: card registry and lookup.
- `core/`: engine primitives and event loop support.
- `data/`: authored cards, packs, bosses, quests, profiles, tutorials, and rewards.
- `net/`: lower-level network helpers.
- `rendering/`: visual effects.
- `save/`: save serialization, validation, migrations.
- `social/`: account, friend, party, gift, chat, and cloud sync services.
- `state/`: Zustand stores; `store.ts` is the gameplay authority.
- `styles/`: global styles.
- `systems/`: card effects, scaling, progression, scoring, quests, and ability runtime systems.
- `tests/`: Vitest tests.
- `types/`: shared TypeScript contracts.
- `ui/`: React HUD, menus, modals, deck builder, store, profile, and card faces.
- `utils/`: formatting and state helpers.

## Start Points

- Card behavior: `src/data/cards`, `src/types/cards.ts`, `src/types/effects.ts`, `src/systems/cards/CardEffectExecutor.ts`, `src/state/store.ts`.
- Card visuals/text: `src/ui/cardBackgrounds.ts`, `src/ui/cardStatSummary.ts`, `src/ui/components/CardRulesDigest.tsx`.
- Pack issues: `src/data/packs/packDefinitions.ts`, `src/systems/cards/PackSystem.ts`, `src/ui/store/PackOpeningModal.tsx`, store `openPack`/`openBox`/`openCase`.
- Turn HUD issues: `src/ui/hud/BoardDisplay.tsx`, `HandDisplay.tsx`, `HUD.tsx`, `CardInspectorPanel.tsx`.
- Turn HUD information rail: `HUD.tsx` flow-stacks `AngelStatPanel` and `CardBornStacksPanel` with a fixed gap; child panels must not independently assign overlapping top/left coordinates.
- Main-menu navigation: `src/ui/menu/MainMenuHub.tsx` owns the responsive Play / Collection / Progress Command Deck, contextual feature artwork, lock messaging, profile identity, resources, and event banner.
- Live card rendering: `src/ui/cardBackgrounds.ts` owns `getLiveCardFaceBackgroundStyle` and `getLiveCardShimmerClassName`; all in-turn card surfaces use these instead of composing their own art or foil layers.
- Save issues: `src/save/SaveManager.ts`.
- Profile/appearance: `src/ui/player/PlayerInformationPage.tsx` and its scoped CSS; shared display-mode palette and CSS roles in `src/ui/theme.ts`; palette definitions/unlocks in `src/data/profile/uiThemes.ts`.
- Achievement presentation: `src/systems/progression/achievementCategories.ts` and `src/ui/menus/AchievementsModal.tsx`. Reward groups and payouts remain in `achievements.ts`, independent of navigation categories.
- Background rewards: `src/data/profile/customMainMenuBackgrounds.ts` owns names, filename stems, and gates; `mainMenuBackgrounds.ts` owns loading, imported overrides, availability, and main-menu resolution.
- In-game reference: `src/data/tutorialContent.ts` owns stable section metadata; `src/ui/menus/TutorialModal.tsx` owns Codex body copy and renders shared ability/background registries.

## Art Briefs

The repository's `Midjourney Art/` folder contains prompt documents, not automatic runtime registrations. `Custom Main Menu Backgrounds.md` describes the seven installed Forge cosmetics. `Intensity Set Prompts.md` documents the live 29-card volcanic set replacing the old Pyroabyss prompt document. Its current art direction is concise Chinese mythological ink manuscript: white parchment, black splotches, molten obsidian, hot orange/red fire, and white-hot accents, not yellow/gold flames. The 29 faces, banner, backing, five boss banners, dungeon cover, four materials, and seven ability icons are installed. Eight new reward prompts describe three completion splashes and five boss portraits awaiting artwork; four expedition scene prompts are optional reserved outputs. Prompt text never installs an image or registers gameplay automatically.
