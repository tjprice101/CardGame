# Project Structure

The application lives in `card-game-idle/`.

## Root files

- `package.json`: scripts and dependencies.
- `tsconfig.json`: strict TypeScript settings for the app.
- `tsconfig.node.json`: TypeScript settings for Node/Vite configuration.
- `vite.config.ts`: Vite build configuration and chunking rules.
- `index.html`: browser document shell.
- `CLAUDE.md`: repository design and engineering rules for AI-assisted work.
- `electron/main.mjs`: Electron main process and desktop window lifecycle.
- `electron/preload.mjs`: controlled bridge between Electron and the renderer.

## `src/`

- `app/`: top-level React composition and application shell.
- `audio/`: music playlists, radio transitions, and sound effects.
- `cards/`: card lookup, normalization, aliases, and registry bootstrapping.
- `core/`: engine primitives, events, and loop infrastructure.
- `data/`: authored game content: cards, bosses, packs, profile data, tutorials, and resources.
- `net/`: lower-level multiplayer/network transport helpers.
- `rendering/`: visual effects and renderer-specific code.
- `save/`: serialization, versioning, migrations, and persistence.
- `social/`: Supabase-backed accounts, friends, parties, messages, gifts, and activity.
- `state/`: Zustand stores; `store.ts` is the main gameplay store.
- `styles/`: global and feature styling.
- `systems/`: rules and calculations such as effects, scoring, progression, and set abilities.
- `tests/`: unit and integration-like behavior tests.
- `types/`: shared TypeScript contracts.
- `ui/`: React screens, components, HUDs, menus, deck builder, and card text display.
- `utils/`: reusable state cloning, formatting, and general helpers.

## Where to look first

- A card is wrong: inspect `src/data/cards/`, then `CardRegistry.ts`, then `CardEffectExecutor.ts`.
- A card play is wrong: inspect `src/state/store.ts` and the relevant executor/system.
- A card description is wrong: inspect `src/ui/cardStatSummary.ts` and `CardRulesDigest.tsx`.
- A save fails to load: inspect `src/save/SaveManager.ts` and its migration chain.
- A menu is wrong: inspect the matching `src/ui/menus/` or `src/ui/deck/` component and its selectors.
- A multiplayer action is wrong: inspect the relevant Zustand store, `src/social/`, and `supabase/migrations/`.

## Naming pattern

Definitions describe reusable templates. Instances describe physical runtime copies. Systems calculate rules. Stores mutate state. Components render and dispatch actions. Keeping those nouns distinct prevents a definition from accidentally being treated as a live card.
