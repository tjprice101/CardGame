# Copilot Instructions

## Git Workflow
- All development work happens on the `development` branch only.
- Never merge to `main` or push to `main` unless the user explicitly says it is ready to deploy.
- Do not run `git checkout main`, `git merge`, or `git push origin main` on your own initiative.

## Oblivion Rules
- Treat sequence terminology as removed gameplay language.
- Never add new sequence-related effects.
- Use direct Oblivion wording for rewards and scaling.
- When editing existing content, migrate legacy sequence-facing copy to Oblivion-first language.

## Retired content and current unlock rules
- Wake Trials and Endless Gauntlet are removed. Do not add `onOpenWakeTrials`, `onOpenEndlessGauntlet`, `startWakeTrial`, `startEndlessGauntlet`, `recordGauntletRun`, `trial`/`gauntlet` boss kinds, `weeklyTrialCompletions`, or `gauntletBest` back into live code.
- Main-menu gates are derived from duplicate-inclusive collection counts: 5 Infinite copies unlock Ascension, 5 Eternal copies unlock Infinitude, and 1 Eternal copy unlocks Enigma. Locked tiles remain visible but dimmed.
- Enigma UI belongs in `EnigmaModal`; Daily and Weekly challenges belong in the visible Challenges surface. Do not render an `EnigmasPanel` inside the Challenges modal.
- Neutrality design must be Patience-system-native. Avoid generic draw/chain templates when reworking Neutrality cards.
