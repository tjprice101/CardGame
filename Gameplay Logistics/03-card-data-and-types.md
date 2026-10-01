# Card Data And Types

`src/types/cards.ts` is the card contract. Current live gameplay has three card definition variants: `Light`, `Dark`, and `AinSophAur`.

## Definitions Versus Instances

A definition is authored content: ID, type, rarity, name, description, art key, attacks, effects, costs, and summon data. Definitions live under `src/data/` and are resolved through `CardRegistry`.

An instance is a physical copy in hand, draw pile, discard pile, or on the board. Instances carry runtime facts such as `instanceId`, `finish`, `side`, `faceState`, `limitlessCharge`, cooldown maps, and board slot indexes.

Do not store runtime counters on definitions. Do not put authored rules only on instances.

## Current Card Types

| Type | Deck zone | Board zone | Runtime role |
|---|---|---|---|
| Light | Main Deck | Support/back row | Can enter as Soph or Ain. Ain side has Ain Attack and Soph Attack. Soph side charges, flips, or sacrifices. |
| Dark | Main Deck | Support/back row | Can enter as Soph or Ain. Ain side activates utility effects. One-shot cards leave after activation; persistent premium cards remain with cooldown. |
| AinSophAur | Extra Deck | Front row | Summoned by sacrificing a count of occupied back-row cards. Uses Bridge the Light. |

Retired types such as Seraphim, Cherubim, Ophanim, and Angel are not live card types and should not be reintroduced.

## Light Definitions

Light cards require:

```ts
interface LightCardDefinition {
  definitionId: string;
  type: 'Light';
  rarity: CardRarity;
  spectrumLevel: SpectrumLevel;
  name: string;
  description: string;
  artKey: string;
  ainAttack: LightAttackDefinition;
  sophAttack: LightAttackDefinition;
  onFlipEffects?: CardEffect[];
  sophPlacementEffects?: CardEffect[];
  sacrificeStackRate: number;
}
```

`baseOblivion` and `oblivion_flat` are legacy internal names. Player-facing text must say Divine Light.

## Dark Definitions

Dark cards require:

```ts
interface DarkCardDefinition {
  definitionId: string;
  type: 'Dark';
  rarity: CardRarity;
  spectrumLevel: SpectrumLevel;
  name: string;
  description: string;
  artKey: string;
  sophEffects: CardEffect[];
  activationCost: StackCostDefinition;
  cooldownCardsPlayed?: number;
  postActivationFate: 'hand' | 'deck' | 'discard';
  sacrificeStackRate: number;
  persistent?: boolean;
}
```

Balance policy: ordinary one-shot Dark cards should usually cost 0 Limitless Light Stacks. Costs are reserved for premium, repeatable, or unusually high-impact effects.

## Ain Soph Aur Definitions

Ain Soph Aur cards require:

```ts
interface AinSophAurDefinition {
  definitionId: string;
  type: 'AinSophAur';
  rarity: CardRarity;
  spectrumLevel: SpectrumLevel;
  name: string;
  description: string;
  artKey: string;
  summonMaterialCount: number;
  onSummonEffects: CardEffect[];
  bridgeAttack?: BridgeAttackDefinition;
}
```

`summonMaterialCount` is a count of any occupied back-row cards. It is not an exact-ID recipe. Do not add `summonCost` back without redesigning descriptions, UI, tests, and material selection.

## Rarity Sources

- Common/Rare/Epic/Legendary: card packs.
- Enigmatic: Enigma rewards.
- Eternal: Eternity's Wake boss rewards.
- Infinite: Infinitude crafting.
- Transcendent: Forge of Transcendence.

## Spectrum Level

Every card has a `spectrumLevel` from 0 to 5. It is an authored play/summon requirement, separate from rarity. A card's level may not fall below its rarity floor: Enigmatic 1, Eternal 2, Infinite 4, and Transcendent 5. Spectrum Power bands also account for rarity and origin; higher-rarity attack bands remain above lower-rarity bands.

Every turn starts at Spectrum Level 0. `raiseSpectrumLevel(handInstanceId)` spends `5 + currentLevel` Limitless Light Stacks and moves one chosen hand card into `DeckState.lightBoundAbyss`; levels are capped at 5. Abyss cards cannot be retrieved during the turn. They return when the deck zones reset. Cards above the current level cannot be played, and Ain Soph Aur cards cannot be summoned. Phantom Matrix free summons may reach one level above the current level.

Origin power order is base packs < event packs < Enigma rewards < boss Eternals < Infinitude Infinites < Forge Transcendents. Spectrum Level positions a card within its rarity/origin band; origin bonuses must never let a lower rarity exceed the next rarity's attack band. Every Light card across every live source must have a distinct authored Soph placement effect.

## Adding Cards

1. Add the definition to the appropriate data file.
2. Use existing `CardEffect` tags when possible.
3. Register it through `CardRegistry` source imports.
4. Ensure art resolves through `cardBackgrounds.ts`.
5. Update `cardStatSummary.ts` only if the display model needs a new section.
6. Add or extend runtime coverage in `CardRuntimeWiring.test.ts` and catalog coverage in `CardCatalog.test.ts`.
