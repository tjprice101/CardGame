# CLAUDE.md - Card Game Design Rules

> **Current terminology:** The primary currency is named **Divine Light** in all player-facing text. Legacy persisted/API field names such as `oblivion`, `lifetimeOblivion`, `bestSingleTurnOblivion`, `oblivion_flat`, and related event identifiers remain compatibility keys until a versioned save migration replaces them. Do not reintroduce the word Oblivion into new UI, card text, tutorials, quests, achievements, or design docs.

This file is the AI-facing project brief. Read it before making design, balance, card, UI, save, or test changes.

## Current Engine Snapshot

- Main Deck contains **Light** and **Dark** cards only.
- Extra Deck contains **Ain Soph Aur** cards only. Ain Soph Aur cards are never Main Deck cards.
- Main-deck cards are placed into the four support/back slots. Left-click from hand places Soph; right-click from hand places Ain.
- **Soph** cards are face-down and charge by +1 whenever any card is played from hand.
- A Soph card is ready at `SOPH_FLIP_CHARGE_REQUIRED = 2`. At that point it can flip to Ain and bank its charge as Limitless Light Stacks, or be sacrificed to convert a percentage of its charge into Limitless Light Stacks.
- **Ain** cards are face-up and active. Light cards can use Ain and Soph attacks. Dark cards can use their utility activation.
- Dark utility activations are free unless the card is premium or unusually strong. Current policy: most base one-shot Dark cards cost 0; only two base Legendary utilities cost 1; Eternal costs 2; persistent Enigmatic costs 1; persistent Transcendent costs 3-4.
- Ain Soph Aur cards summon from the Extra Deck to the four front slots using authored `summonMaterials` clauses. Clauses can require card types, specific IDs, and Ain/Soph sides; selected materials must satisfy every clause.
- Ain Soph Aur cards grant +1 Limitless Light Stack plus `onSummonEffects` when summoned, then use `bridgeAttack` for Bridge the Light.
- Light cards define a distinct `sophPlacementEffects` hook that resolves when placed face-down as Soph.
- Three owned materialized abilities can be equipped per deck and activated through Ability Amplification: Neutralizing Inferno, Nullified Barricade, and Phantom Matrix.
- `Card Effects/Causality/Causality Ability Drafts.md` contains three proposed Causality abilities. They remain design-only and must not be exposed by the ability registry, store, deck loadout, or UI until their full implementation is requested and validated.
- Challenge economy baseline: five daily challenges per rotation total 7,500 base Divine Light, targeting approximately 52,500 across seven daily rotations; four weekly challenges total 100,000 base Divine Light. Collection Power can increase the final paid amount.
- Four additional Neutrality abilities are available after ownership gates: Null Horizon and Axiomatic Reversal require any Neutrality Eternal; Whiteout Domain and Infinite Accord require any Neutrality Infinite. A deck still equips only three abilities.
- Premium Light cards use distinct Soph-placement effects, and Eternal ASA cards use exact named-card summon materials. Phantom Matrix is exempt from all ASA materials.
- Materialized abilities are Neutrality content. The first two additional endgame abilities require any owned Neutrality Eternal card; the next two require any owned Neutrality Infinite card. Other sets must not unlock them accidentally.
- Garden of Cards and Valley of Null are Neutrality-specific. Nullified Lattice, Null-seared Light, and Nullified Oblivion-matter are Neutrality materials and must not be treated as universal currencies for future sets.
- Every Divine Light gain, including sacrifices, card effects, on-summon rewards, attacks, Bridge, quests, and pack flow, must route through the central grant path so Collection Power scaling applies exactly once.
- Collection Power is `1 + Resonance / 1000`. Its cap is the natural maximum `1 + (registered card count * 320) / 1000`, so registering new cards automatically raises it. Card-light does not directly increase Collection Power; it advances one card toward a Card-born Tier, and Resonance changes only when that tier threshold is crossed.
- Rarity sources are distinct: Common/Rare/Epic/Legendary from packs, Enigmatic from Enigmas, Eternal from Eternity's Wake, Infinite from Infinitude crafting, Transcendent from Null Raid progression.

## Latest Iteration Status

This iteration focused on state consistency, usability, and math correctness around the Causality / Limitless Cosmos loop and the endgame Shatter finisher.

- `Limitless Cosmos` is the current Causality turn-scoped resource. Causality cards are designed as a repeatable, beneficial loop: generate Cosmos, convert or bank it, and spend it to amplify utility or Divine Light gain without creating dead or punitive branches.
- All Causality cards and earned reward cards are intentionally authored around the same loop, and their utility should be readable as a single system instead of isolated one-offs.
- Card identity is treated as a one-source-of-truth across displays. Live turn cards use `getLiveCardFaceBackgroundStyle` and `getLiveCardShimmerClassName`; hand and board share identical composed art and foil layers, with one lightweight shimmer animation. Face-down Soph cards render only their backing plus state badges.
- `Shatter the Infinite Light` fades fully to black for 1.1 seconds before revealing its detailed active starfield. The 10-second click window awards one Limitless Infinity stack per star and 1,000 base Divine Light per stack before Collection Power. Resolution wipes field and hand, reshuffles discard, clears turn resources, does not draw or advance the turn, and staggers active bosses while restoring their clock.
- The turn HUD stacks Board and Card-born Stacks in one left-side rail. The main menu is a responsive Command Deck organized into Play, Collection, and Progress, with one contextual artwork banner and a reduced set of visible actions.
- Enigma tracking now evaluates actual turn-scoped conditions instead of false positives from lifetime counters, generic board presence, or stale progress. Neutrality and Causality enigma checks must match the real conditions required by the authored text.
- Causality enigma rewards were increased to 3 copies per reward entry.
- Player-facing summary text must remain natural language; do not leak internal tokens like `cosmos_gte` or raw snake_case into the UI.
- The current repo validation state is the final pass recorded at the end of the iteration: `npm run typecheck:tests`, `npm test -- --run`, and `npm run build` completed successfully in the working tree.

## Core Loop

The game is turn-based, not idle-tick based. A normal run is:

```text
Begin Turn -> draw 5 -> mulligan -> play cards -> build Soph/Ain board -> attack/activate/summon -> end turn -> open packs -> improve decks
```

The player earns Divine Light through card actions and spends it primarily on Neutrality packs. Packs award live base Neutrality cards from the 52-card base pool: 24 Light, 24 Dark, and 4 Ain Soph Aur.

## Board Layout

```text
front:   [A0] [A1] [A2] [A3]    Ain Soph Aur only
support: [M0] [M1] [M2] [M3]    Main Deck Light/Dark, either Soph or Ain
```

- Front slots hold summoned Ain Soph Aur cards.
- Support/back slots hold main-deck Light/Dark cards.
- Force-removing a main-deck field card sends it to discard.
- Force-removing an Ain Soph Aur field card returns it to the Extra Deck.
- End turn clears the board and hand; main-deck cards cycle through discard/draw, while Ain Soph Aur leakage is corrected back into the Extra Deck by the invariant path.

## Card Types

| Type | Zone | Runtime behavior |
|---|---|---|
| Light | Main Deck | Can be placed Soph or Ain. Ain side has Ain Attack and Soph Attack. Soph side charges, flips, or sacrifices. |
| Dark | Main Deck | Can be placed Soph or Ain. Ain side activates utility effects, then one-shot cards return to hand/deck/discard; persistent premium cards remain with cooldown. |
| Ain Soph Aur | Extra Deck | Summons to front row by sacrificing a count of back-row cards. Uses Bridge the Light. |

Do not add Seraphim, Cherubim, Ophanim, Angel, sequence, or old Patience-system dependencies back into live gameplay.

## Inputs And UX

- Hand left-click: place main-deck card as Soph.
- Hand right-click: place main-deck card as Ain.
- Press `E`: swap hand view with Extra Deck view.
- Extra Deck click: begin summon-material selection.
- Field card left-click: open available action panel.
- Field card right-click: open force-remove confirmation.
- Hover details belong in the right-rail Card Inspector, not floating over the board or hand.
- Pack opening starts face-down and waits for individual card clicks, Reveal All/Reveal Best, or Instant. It must never auto-reveal on a timer.
- Card art should use the shared card-face style: art background plus top ribbon and bottom rules panel. Respect `settings.cardArtDisplay` everywhere a card face is shown.
- Face-down cards are the exception: show only the canonical card backing and state badges. Do not render front-face ribbons or rules panels on a back face.

## Effects And Actions

Cards are declarative data. Effects are serializable tagged objects from `src/types/effects.ts`, interpreted by `src/systems/cards/CardEffectExecutor.ts`. Store actions remain the authority for lifecycle changes such as moving cards, spending stacks, applying cooldowns, queuing pending choices, granting Divine Light, and recomputing derived state.

All new effect tags require:

1. Type union entry.
2. Executor case.
3. Readable card-summary formatting.
4. Pending-effect UI/store handling if player input is needed.
5. Runtime tests.

The executor uses an exhaustive switch; do not bypass it with ad hoc UI logic.

## Testing Expectations

Card and gameplay changes must preserve the executable audits:

- `CardRuntimeWiring.test.ts`: every registered card lifecycle, attack, utility, summon, Bridge, cooldown, and failure guard.
- `CardCatalog.test.ts`: catalog counts, registry exposure, playability, and cost policy.
- `FullTurnE2E.test.ts`: turn, mulligan, summon, Bridge, and hand-cap flows.
- `PackOpeningFlow.test.ts`: live Neutrality pack pool and collection awards.
- `PackOpeningModalSource.test.ts`: pack modal does not auto-reveal.
- `CardBackgroundAssetAudit.test.ts` and `LiveCardFaceSource.test.ts`: assets resolve and live hand/board foil composition remains unified.
- `CardMasteryProgress.test.ts`: Resonance tier crossings, canonical Collection Power scaling, registry-derived maximum, and truthful boss reward previews.

Run focused tests for the touched subsystem first, then `npm run build`, `npm run typecheck:tests`, and `npm test -- --run` when the change crosses card/runtime/UI boundaries.

## Save Compatibility

Current player-facing mechanics may use old internal field names. Do not rename persisted fields like `oblivion` or effect tags like `oblivion_flat` without a versioned migration and compatibility read/write path. Save loading should tolerate old or malformed arrays, clear ephemeral active runs safely, and preserve long-lived progress.
