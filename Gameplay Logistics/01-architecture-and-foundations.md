# Architecture And Foundations

## The stack

- **TypeScript** provides strict compile-time contracts for cards, effects, state, and actions.
- **React** renders menus, boards, cards, modals, and HUD surfaces.
- **Vite** serves the development app and bundles the production web build.
- **Zustand** owns reactive application state and exposes actions to React.
- **Immer** lets store actions mutate a draft object while producing immutable state snapshots.
- **Vitest** runs unit tests.
- **Electron** packages the web app as a desktop application.
- **Supabase** supports social and multiplayer persistence/realtime features.
- **Pixi-related rendering code** handles some visual effects and presentation layers.

## The central architectural rule

The code separates:

1. **Data**: what cards, bosses, packs, and resources exist.
2. **Systems**: reusable rules that calculate or execute behavior.
3. **State**: mutable live game state and actions that change it.
4. **UI**: React components that display state and request actions.

A typical flow is:

```text
card definition -> CardRegistry -> store action -> gameplay system -> updated state -> React UI
```

For a card play, the definition describes the card, the registry resolves and normalizes it, `store.ts` validates the action and places the card, `CardEffectExecutor` interprets its effects, and React re-renders from the resulting Zustand state.

## Why this layering exists

If card definitions performed mutations themselves, they would be difficult to serialize, test, and display. If every UI component calculated rules independently, card text and actual behavior would drift. If every system owned its own copy of the state, multiplayer, saves, and turn transitions would disagree.

The project therefore keeps one authoritative live state and makes cards mostly declarative.

## Runtime startup

`src/main.tsx` is the browser entry point. It imports global styles, registers side-effect systems such as the Neutrality set engine, and mounts the root React application from `src/app/App.tsx`.

Module-level registration matters: importing a set definition runs its `registerSet(...)` call before the UI or store asks the set engine for definitions.

## Strictness rules

The project uses strict TypeScript. When adding a new card or effect, the preferred sequence is:

1. Extend a type union only if the mechanic is genuinely new.
2. Add the runtime handler.
3. Add display formatting.
4. Add tests.
5. Add the card data.

This order makes missing behavior fail at compile time or in focused tests instead of silently producing a card that displays correctly but does nothing.
