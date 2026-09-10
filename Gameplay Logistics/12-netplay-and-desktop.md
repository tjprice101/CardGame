# Netplay And Desktop

## Electron

The Vite/React app is wrapped by Electron for desktop builds:

- `electron/main.mjs`: privileged main process and window lifecycle.
- `electron/preload.mjs`: narrow renderer bridge.

The renderer should remain browser-compatible so the same gameplay code works in development, web preview, GitHub Pages, and desktop packaging.

## Social Stores

Social and multiplayer feature stores live separately from the main gameplay store. Friends, messages, gifts, parties, co-op raids, and cloud sync have different lifetimes and loading states than a local turn.

Do not make social stores the source of truth for card rules.

## Host-Authority Rule

Networked actions are untrusted input:

1. Identify session and actor.
2. Validate authorization.
3. Resolve through the authoritative gameplay store/action path.
4. Broadcast or persist the resulting state/event.
5. Handle reconnects and stale clients.

Single-player card resolution must not depend on network availability.

## Turn UI Consistency

Normal turns, Eternity's Wake fights, Null Raids, and battleground overlays share the main HUD. Shared HUD elements such as the right-rail Card Inspector should remain mode-safe and avoid fixed overlays that cover the board.
