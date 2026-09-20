# Causality Ability Notes

> Current status: Causality materialized abilities are implemented, registered, purchasable, equippable in saved deck loadouts, and executable through Ability Amplification. This file preserves the original design direction and explains how the live implementation maps to it.

## Package Direction

The first draft proposed three foundational abilities forming a Causality arc:

1. **Author the First Cause** converts Limitless Light into an opening Cosmos reserve.
2. **Unwritten Margin** changes how one chosen Causality card handles that reserve.
3. **Final Cause** cashes out a developed Cosmos pool for Divine Light and renewed actions.

The live implementation expands that arc into six endgame Causality abilities in `src/data/abilities/abilityDefinitions.ts`:

1. **Author the First Cause** and **Causal Cartography** require at least one copy of every base Causality card and cost 250,000 Divine Light each.
2. **Pearlescent Mandate** and **Archive of Elsewhen** require any Causality Eternal card and cost 2,500,000 Divine Light each.
3. **Final Cause** and **Infinite Manuscript** require any Causality Infinite card and cost 25,000,000 Divine Light each.

All six use the existing Ability Amplification slots. A saved deck can equip any three owned materialized abilities, regardless of set, but ownership gates remain set-specific.

## Live Ability Tiers

### Foundational

- **Author the First Cause** — 250,000 Divine Light; requires every base Causality card. Spend 4 Limitless Light Stacks to gain 3 Limitless Cosmos, plus 1 more if the Cosmos pool began empty. Cooldown: 35 seconds.
- **Causal Cartography** — 250,000 Divine Light; requires every base Causality card. Spend 6 Limitless Light Stacks to gain 4 Limitless Cosmos and draw 3 cards. Cooldown: 55 seconds.

### Eternal

- **Pearlescent Mandate** — 2,500,000 Divine Light; requires any Causality Eternal card. Spend 6 Limitless Cosmos to reduce active Causality card cooldowns by 2 and gain 12 Limitless Light Stacks. Cooldown: 100 seconds.
- **Archive of Elsewhen** — 2,500,000 Divine Light; requires any Causality Eternal card. Spend 8 Limitless Cosmos to draw 5 cards and recover one Light, one Dark, and one Ain Soph Aur card from the deck. Cooldown: 150 seconds.

### Infinite

- **Final Cause** — 25,000,000 Divine Light; requires any Causality Infinite card. Consume all Limitless Cosmos, requiring at least 5, to gain 1,500 Divine Light per Cosmos stack and reduce active Causality cooldowns by up to 5. Cooldown: 180 seconds.
- **Infinite Manuscript** — 25,000,000 Divine Light; requires any Causality Infinite card. Spend 12 Limitless Cosmos to draw 5 cards, refresh active Causality card cooldowns, and gain 75,000 Divine Light. Cooldown: 240 seconds.

The Ability Materialization UI derives these tiers from ownership gates, not price thresholds. Divine Light payouts use the central grant path and receive Collection Power scaling exactly once.

## Runtime Implementation Notes

- Ability definitions support Causality ownership gates plus `cosmosCost` and `consumesAllCosmos` fields.
- Store activation branches validate phase, ownership, resource costs, cooldowns, and target state before mutating resources.
- Divine Light payouts route through the central grant path so Collection Power applies exactly once.
- Causality ability icons are wired under `public/assets/ability-icons/`.
- Focused coverage lives in `src/tests/unit/systems/AbilityRuntime.test.ts` and `src/tests/unit/systems/AbilityAssetAudit.test.ts`.
- The retired **Unwritten Margin** draft is not part of the live registry.