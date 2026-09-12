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
- Every Divine Light gain, including sacrifices, card effects, on-summon rewards, attacks, Bridge, quests, and pack flow, must route through the central grant path so Collection Power scaling applies consistently.
- Rarity sources are distinct: Common/Rare/Epic/Legendary from packs, Enigmatic from Enigmas, Eternal from Eternity's Wake, Infinite from Infinitude crafting, Transcendent from Null Raid progression.

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

Run focused tests for the touched subsystem first, then `npm run build`, `npm run typecheck:tests`, and `npm test -- --run` when the change crosses card/runtime/UI boundaries.

## Save Compatibility

Current player-facing mechanics may use old internal field names. Do not rename persisted fields like `oblivion` or effect tags like `oblivion_flat` without a versioned migration and compatibility read/write path. Save loading should tolerate old or malformed arrays, clear ephemeral active runs safely, and preserve long-lived progress.
