# Progression And Challenges

## Quests

`src/systems/progression/quests.ts` owns quest templates, rotation, reset boundaries, and reward scaling. `src/ui/menus/QuestsModal.tsx` presents them.

The current local reset schedule is:

- Daily: 12:00 PM.
- Weekly: Sunday at 8:00 PM.

`getNextDailyResetAt` and `getNextWeeklyResetAt` calculate the next boundary. `formatQuestCountdown` turns the difference into UI text. The modal refreshes its displayed countdown once per second.

## Collection Power

Quest Oblivion is calculated at claim time, not permanently baked into the quest display:

```text
multiplier = min(3, 1 + max(0, resonanceScore) / 1000)
reward = floor(baseReward * multiplier)
```

`computeGlobalResonanceScore(progress)` supplies the current score. `getScaledQuestOblivion` applies the formula. This ensures collection growth affects future claims without retroactively changing a claimed reward.

Weekly quests grant both Oblivion and Shards. The store's `claimQuest` action is authoritative; the modal only previews the result.

## Rotation hydration

`refreshQuestRotation` rehydrates existing quest instances from current templates without resetting current progress. This is useful when reward definitions change while a rotation is already active.

## Enigmas

Enigmas are progression challenges evaluated against gameplay state. Some steps can complete during a boss run, so `syncEnigmaProgressFromBoard` checks board state during play. When a run restores the pre-run snapshot, the store merges the captured Enigma flags back in.

`neutralizing-the-void` targets `boss-hollow-king` and retains the timed clear threshold of at least 1:30 remaining.

## Boss HP

Eternity's Wake uses a set-anchored HP curve. `FIRST_SET_FIRST_BOSS_HP = 97_031` is the +15% starting anchor, and the final HP multiplier chains the curve through later sets.

## Events

The Wished Upon A Star end timestamp is centralized in `src/ui/eventWishedUponAStar/eventTimer.ts` and currently ends on November 1, 2026 at 8:00 PM EST. Centralizing the timestamp prevents the menu tile and event screen from disagreeing.
