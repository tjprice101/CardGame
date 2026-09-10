# Architecture And Foundations

## Stack

- TypeScript: strict contracts for cards, effects, state, and tests.
- React: UI surfaces, HUD, menus, modals, and card faces.
- Vite: dev server and production web build.
- Zustand + Immer: gameplay and feature state stores.
- Vitest: unit and integration-style behavior tests.
- Electron: desktop packaging.
- Supabase: social and multiplayer persistence/realtime features.

## Core Rule

The code separates:

1. Data: authored cards, packs, bosses, quests, profile content.
2. Systems: reusable calculations and interpreters.
3. State: authoritative mutable gameplay transactions.
4. UI: rendering and user input dispatch.

Typical flow:

```text
card data -> CardRegistry -> store action -> systems/executor -> updated state -> React UI
```

Do not put mutations in card definitions. Do not make UI components duplicate store rules.

## Current Gameplay Model

The live engine is Light/Dark/Ain Soph Aur:

- Main Deck: Light and Dark.
- Extra Deck: Ain Soph Aur.
- Support/back row: Light/Dark as Soph or Ain.
- Front row: Ain Soph Aur summons.
- Currency display: Divine Light.
- Internal compatibility keys may still use `oblivion`.

## Adding Mechanics

When adding a mechanic:

1. Extend types only if the mechanic is genuinely new.
2. Add runtime/store handling.
3. Add display formatting.
4. Add tests.
5. Add authored data.
6. Update documentation.

This order prevents cards that display correctly but do nothing.
