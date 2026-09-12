# Neutrality-Specific Progression

Garden of Cards, Valley of Null, Nullified Lattice, Null-seared Light, and Nullified Oblivion-matter currently belong exclusively to the Neutrality set. These are not universal progression currencies. Future sets must define their own dungeon rewards and material economies.

Ability Materialization is also Neutrality-specific. The first two endgame abilities require any owned Neutrality Eternal card; the second two require any owned Neutrality Infinite card.

The current catalog contains seven Neutrality abilities total. Only three may be equipped per deck. Null Horizon and Axiomatic Reversal are Eternal-gated; Whiteout Domain and Infinite Accord are Infinite-gated and use substantially higher endgame costs.

# Progression And Challenges

## Packs And Collection

Neutrality packs draw from the live base Neutrality pool: 24 Light, 24 Dark, and 4 Ain Soph Aur cards. Pack purchase must generate all five rewards before currency is deducted. Awarded cards are added to collection, then the pack-opening modal displays them face-down for manual reveal.

Starter accounts, new saves, and wiped saves start with zero currency balances: Divine Light, lifetime Divine Light counters, Aberrated Shards, Fracture Shards, Card-bane Light, Entropic Energy, and the legacy entropy compatibility field all begin at 0.

`PackOpeningFlow.test.ts` verifies pool validity, five-card rewards, collection updates, and currency deduction.

## Collection Power

Collection Power comes from card mastery and is computed with `computeGlobalResonanceScore(progress)`. It scales Divine Light grants through the central grant path:

```text
multiplier = min(3, 1 + max(0, collectionPower) / 1000)
```

Attack previews should use the same Collection Power value as runtime payout calculation.

## Daily And Weekly Challenges

`src/systems/progression/quests.ts` owns templates, rotation, reset boundaries, and reward scaling. The current counts are:

- Daily: 5 active challenges.
- Weekly: 4 active challenges.

Rotations avoid repeating the previous rotation's template IDs when enough alternatives exist. The Challenges UI presents Daily and Weekly in independently scrollable columns.

## Rarity Progression

- Enigmatic cards come from Enigmas.
- Eternal cards come from Eternity's Wake bosses.
- Infinite cards are crafted in Infinitude from specific Eternal recipes.
- Transcendent cards come from Null Raid progression.

Achievements and unlock gates should distinguish those rarity sources instead of treating all premium cards as one bucket.

## Enigmas

Enigma progress can complete during a boss run. If a run restores a pre-run progress snapshot, the store must capture and merge Enigma flags so mid-run progress is not lost.

`neutralizing-the-void` targets `boss-hollow-king` and retains its timed-clear requirement.

## Events

Wished Upon A Star event timing is centralized in `src/ui/eventWishedUponAStar/eventTimer.ts`. Keep event timing in one place so tiles and event screens do not disagree.
