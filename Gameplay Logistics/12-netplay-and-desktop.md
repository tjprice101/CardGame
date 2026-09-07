# Netplay And Desktop

## Electron

The browser application is wrapped by Electron:

- `electron/main.mjs` runs in the privileged main process, creates windows, and manages desktop lifecycle.
- `electron/preload.mjs` exposes a narrow safe bridge to renderer code.
- The React/Vite app remains the renderer.

Keeping the renderer mostly browser-compatible allows the same code to run in development, web-like previews, and desktop packaging.

## Social stores

Feature-specific Zustand stores live under `src/state/` and `src/social/`. Examples include friends, messages, gifts, party sessions, activity, co-op raids, and Eternity boss co-op.

They are separate from the primary gameplay store because social data has different lifetimes, synchronization rules, and loading states.

## Supabase

`supabase/migrations/` defines database schema changes. The migrations describe tables, columns, indexes, and row-level security. Social code calls Supabase services and updates local stores from responses/realtime events.

Core single-player gameplay does not need the network to calculate a card play. Multiplayer layers synchronize or authorize actions around the gameplay state according to the mode's host-authority design.

## Multiplayer reasoning

A networked action should be treated as untrusted input:

1. Identify the session and acting player.
2. Validate that the player is allowed to perform the action.
3. Resolve it through the authoritative gameplay path.
4. Broadcast or persist the resulting state/event.
5. Handle reconnects and stale clients.

Do not let a chat or invitation store become the source of truth for board rules.
