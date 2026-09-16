# Causality Ability Drafts

> Design draft only. These abilities are not registered, purchasable, equipped, or implemented in the runtime.

## Package Direction

These three foundational abilities form a complete Causality arc:

1. **Author the First Cause** converts Limitless Light into an opening Cosmos reserve.
2. **Unwritten Margin** changes how one chosen Causality card handles that reserve.
3. **Final Cause** cashes out a developed Cosmos pool for Divine Light and renewed actions.

All three are intended for the existing Ability Amplification slots. Draft purchase cost is 25,000 Divine Light each, matching foundational Neutrality abilities. Cooldowns are measured in real time, as they are for the current materialized ability system.

## Author the First Cause

**Tier:** Foundational  
**Purchase Cost:** 25,000 Divine Light  
**Activation Cost:** 4 Limitless Light Stacks  
**Cooldown:** 35 seconds

**Rules Text:** Convert 4 Limitless Light Stacks into 3 Limitless Cosmos. If you had no Limitless Cosmos before this ability resolved, gain 1 additional Limitless Cosmos.

**Role:** Engine starter.

This gives Causality decks a deliberate way to open their Cosmos loop without replacing card-based generation. The empty-pool bonus rewards using it as the first written cause, while later activations settle at the less efficient 4-to-3 conversion rate.

**Guardrails:**

- Requires at least 4 Limitless Light Stacks.
- Checks the Cosmos pool before paying or granting resources.
- The empty-pool bonus applies only when starting from exactly 0 Cosmos.
- Does not trigger card-play, card-effect, or Cosmos-generation bonuses unless those systems explicitly include ability-generated Cosmos in the future.

**Icon Direction:** A white quill touching the edge of a black event horizon, with four small Light marks collapsing into three violet-white stars.

## Unwritten Margin

**Tier:** Foundational  
**Purchase Cost:** 25,000 Divine Light  
**Activation Cost:** 2 Limitless Cosmos  
**Cooldown:** 60 seconds

**Rules Text:** Spend 2 Limitless Cosmos, then choose 1 Causality card in your hand. The next time that card resolves a Cosmos effect this turn, double Cosmos it generates or reduce Cosmos it consumes by 1, to a minimum cost of 0. The modification is then removed.

**Role:** Precision setup and rule manipulation.

This is the set's signature decision ability. It can enlarge a future generation step or protect the Cosmos reserve during a payoff, but it cannot do both. Choosing the card in advance creates a visible commitment and keeps the effect from becoming a generic global multiplier.

**Guardrails:**

- Can target only a Causality main-deck card currently in hand.
- The chosen card receives one pending modification, consumed by its first Cosmos-generating or Cosmos-consuming effect.
- Generated Cosmos is doubled after all printed conditions pass.
- A reduced cost can reach 0, but the original `cosmos_gte` condition must still be satisfied before the effect resolves.
- The modification expires at turn end and is lost if the chosen card leaves the hand without being played.
- Copies with the same definition ID are tracked by card instance, preventing the player from modifying every copy at once.

**Icon Direction:** An open black-and-white manuscript with one glowing line erased from the left page and rewritten as a branching constellation on the right.

## Final Cause

**Tier:** Foundational  
**Purchase Cost:** 25,000 Divine Light  
**Activation Cost:** All Limitless Cosmos; requires at least 5  
**Cooldown:** 120 seconds

**Rules Text:** Consume all Limitless Cosmos. Gain 1,000 base Divine Light for each stack consumed, then reduce every active Causality card cooldown by 1 for every 3 stacks consumed, up to a maximum reduction of 3. Divine Light gained scales with Collection Power. 

**Role:** Cosmos cashout and closing sequence.

Final Cause turns a mature Cosmos reserve into an immediate payout while reopening a limited number of attacks and persistent utilities. Spending the entire pool makes timing consequential: activating early gives a smaller payout and cooldown reduction, while waiting risks ending the turn with unused Cosmos.

**Guardrails:**

- Cannot activate below 5 Limitless Cosmos.
- Divine Light uses the central grant path and therefore receives Collection Power scaling once, never twice.
- Cooldown reduction is `min(3, floor(consumed Cosmos / 3))` cards played.
- Affected actions are limited to active Causality Light attacks, persistent Dark utilities, and Ain Soph Aur Bridge the Light attacks.
- Cooldowns cannot be reduced below 0.
- The ability does not refresh itself or reduce real-time Ability Amplification cooldowns.

**Icon Direction:** A radiant manuscript ring collapsing into a black stellar core, with numbered orbit lines snapping backward around three card-shaped fragments.

## Intended Sequence

Example with 8 Limitless Light Stacks and no Cosmos:

1. Activate **Author the First Cause**: spend 4 Light and gain 4 Cosmos because the pool began empty.
2. Generate at least 3 more Cosmos through Causality cards.
3. Use **Unwritten Margin** on a planned Cosmos spender, leaving at least 5 Cosmos afterward.
4. Resolve that card's altered Cosmos effect.
5. Activate **Final Cause** to consume the remaining pool, gain its scaled Divine Light payout, and reduce active Causality card cooldowns.

The sequence rewards planning without making any ability mandatory: First Cause accelerates entry, Unwritten Margin improves one authored card line, and Final Cause provides a clean exit from the resource loop.

## Future Implementation Requirements

- Extend ability definitions with a Causality ownership/set gate and a `cosmosCost` or custom-cost representation.
- Add instance-scoped, turn-expiring card modification state for Unwritten Margin.
- Route generated and consumed Cosmos through the existing Causality progress counters where appropriate.
- Apply Final Cause's payout through the central Divine Light grant function.
- Add dedicated ability icons, activation validation, tooltips, toasts, save migration defaults, and focused tests.
- Decide whether ability-generated Cosmos advances Enigma objectives before implementation; the draft defaults to **no**.