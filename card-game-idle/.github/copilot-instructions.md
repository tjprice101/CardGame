# Copilot Instructions

## Git Workflow
- All development work happens on the `development` branch only.
- Never merge to `main` or push to `main` unless the user explicitly says it is ready to deploy.
- Do not run `git checkout main`, `git merge`, or `git push origin main` on your own initiative.

## Chain Rules
- Treat `chain floor` as deprecated terminology and behavior.
- Never add new `set_chain_floor` effects.
- Use additive `chain_gain` effects and wording such as `Gain +X chain`.
- When editing existing content, migrate legacy `set_chain_floor` references to `chain_gain`.
