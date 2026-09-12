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
- Save issues: `src/save/SaveManager.ts`.
