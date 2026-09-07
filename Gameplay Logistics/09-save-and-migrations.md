# Save And Migrations

## Why saves need versions

Players keep saves while the code evolves. Card IDs disappear, fields change shape, and mechanics are retired. A save version tells the loader which transformations still need to run.

`src/save/SaveManager.ts` currently uses `CURRENT_VERSION = 46`.

## Migration model

Conceptually:

```ts
let progress = decode(rawSave);
if (progress.version < 43) progress = migrateV43(progress);
if (progress.version < 46) progress = migrateV46(progress);
progress.version = CURRENT_VERSION;
return progress;
```

Migrations are sequential and should remain permanently available. A player may load a save from many versions ago.

## v46 content cleanup

The v46 migration removes retired Eternal card IDs from collections, holo collections, play counts, mastery claims, locks, favorites, saved decks, and extra decks. It deletes retired boss statistics, clears retired ability loadout references, and resets the retargeted `neutralizing-the-void` enigma.

## Safe migration rules

- Treat old fields as optional.
- Do not assume arrays exist or are well-formed.
- Filter removed IDs rather than crashing on them.
- Preserve unrelated player progress.
- Bump the version only after the transform completes.
- Test an old fixture and a current fixture.

## Runtime state versus progress

The current turn and board are ephemeral gameplay state. Collection, mastery, quests, enigmas, deck definitions, and unlock-derived information are long-lived progress. Save migrations primarily protect the latter, while active runs often have separate recovery rules.

When a boss or trial run restores a pre-run progress snapshot, Enigma progress earned inside the run must be captured and merged afterward. Otherwise a successful mid-fight Enigma step disappears during restoration.
