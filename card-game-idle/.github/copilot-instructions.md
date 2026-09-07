# Copilot Instructions

## Git Workflow
- All development work happens on the `development` branch only.
- Never merge to `main` or push to `main` unless the user explicitly says it is ready to deploy.
- Do not run `git checkout main`, `git merge`, or `git push origin main` on your own initiative.

## Divine Light Rules
- Treat sequence terminology as removed gameplay language.
- Never add new sequence-related effects.
- **Divine Light** is the player-facing name for the primary currency formerly called Oblivion.
- Use Divine Light in all new UI, card descriptions, tutorial copy, quests, achievements, and design documentation.
- Existing save/API identifiers (`oblivion`, `lifetimeOblivion`, `bestSingleTurnOblivion`, `oblivion_flat`, and related event names) are legacy compatibility keys. Do not remove or rename them without a save migration and a compatibility read/write path.

## Retired content and current unlock rules
- Wake Trials and Endless Gauntlet are removed. Do not add `onOpenWakeTrials`, `onOpenEndlessGauntlet`, `startWakeTrial`, `startEndlessGauntlet`, `recordGauntletRun`, `trial`/`gauntlet` boss kinds, `weeklyTrialCompletions`, or `gauntletBest` back into live code.
- Main-menu gates are derived from duplicate-inclusive collection counts: 5 Infinite copies unlock Ascension, 5 Eternal copies unlock Infinitude, and 1 Eternal copy unlocks Enigma. Locked tiles remain visible but dimmed.
- Enigma UI belongs in `EnigmaModal`; Daily and Weekly challenges belong in the visible Challenges surface. Do not render an `EnigmasPanel` inside the Challenges modal.
- Neutrality design must be Patience-system-native. Avoid generic draw/chain templates when reworking Neutrality cards.

## Current Ain/Soph Engine (authoritative)
- Main Deck: Light and Dark only.
- Extra Deck: Ain Soph Aur only. Ain Soph Aur cards are never Main Deck cards.
- Soph is face-down and charging; Ain is face-up and active. At 5+ charge, flip Soph to Ain and convert its charge into Limitless Light Stacks, or sacrifice it for Divine Light.
- Light cards have Ain and Soph attacks. Dark cards are utility cards. Ain Soph Aur cards summon to the front row from the Extra Deck and use Bridge the Light.
- Every Divine Light gain, including sacrifice rewards and card effects, scales from Collection Power through the central grant path.
- Rarities are distinct: normal rarities, Enigmatic (Enigma rewards), Eternal (Eternity's Wake rewards), Infinite (Infinity-menu crafting), and Transcendent (Null Raid progression).

## Completed Systems Snapshot
- Neutrality content is registered as 25 Light, 25 Dark, and 12 Ain Soph Aur cards.
- Nine Neutrality Eternal boss rewards, four Transcendent Null Raid cards, and two Enigmatic rewards are implemented and art-wired.
- Daily and weekly challenges track current Light/Dark/Ain/Soph/stack/summon/Bridge/boss/raid actions.
- Achievements distinguish Infinity crafts, Eternal boss rewards, Enigmatic rewards, and Transcendent Null Raid ownership.
- Universal Ain/Soph rules are documented in the base tutorial; card stat panels should show only card-specific values.
- Supplied Neutrality card art and wide Eternity's Wake boss art live under `public/assets/card-backgrounds` and are covered by the asset audit.
