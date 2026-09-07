# Card Data And Types

## Definitions versus instances

`src/types/cards.ts` defines two conceptual layers.

A **definition** is authored content:

```ts
interface SeraphimDefinition {
  readonly definitionId: string;
  readonly type: 'Seraphim';
  readonly rarity: CardRarity;
  readonly name: string;
  readonly description: string;
  readonly baseStats: SeraphimStats;
  readonly attacks?: SeraphimAttackSet;
  readonly onPlayEffects: CardEffect[];
  readonly patienceThreshold?: number;
}
```

An **instance** is a physical copy in a hand, deck, discard pile, or board:

```ts
interface SeraphimInstance {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly type: 'Seraphim';
  readonly finish: CardFinish;
  attackCooldowns: Record<string, number>;
  boardSlot: 0 | 1 | 2 | 3 | 4 | null;
  patienceStacks?: number;
}
```

The instance points to the definition by `definitionId`. It stores only runtime facts such as cooldowns, location, counters, and finish.

## Why use a discriminated union

The four card types are represented by the literal field `type`:

```ts
type CardType = 'Ophanim' | 'Cherubim' | 'Seraphim' | 'Angel';
type CardDefinition =
  | OphanimDefinition
  | CherubimDefinition
  | SeraphimDefinition
  | AngelDefinition;
```

This lets TypeScript narrow safely:

```ts
if (definition.type === 'Angel') {
  definition.summonCost;
}
```

Outside that branch, `summonCost` is not available. This is safer than a generic card object full of optional fields.

## Card roles

- **Ophanim**: immediate hand-play effects; no board slot.
- **Seraphim**: front-row unit; on-play effects, passive bonus, and two attack modes.
- **Cherubim**: back-row unit; durability and adjacent-front-row passives.
- **Angel**: extra-deck unit; summon materials, optional conditions, activated ability, and attacks.

## Attack data

Attacks are data too:

```ts
interface AttackDefinition<TLabel extends string = string> {
  readonly id: string;
  readonly label: TLabel;
  readonly name: string;
  readonly description: string;
  readonly baseOblivion: number;
  readonly cooldownCards: number;
  readonly costs?: AttackCost[];
  readonly requiresAngelOnBoard?: boolean;
}
```

The runtime reads this object to decide when an attack is ready, what it costs, and how much it awards. The UI reads the same object to show attack information.

## How to add a card by hand

1. Choose its type and rarity.
2. Create a stable `definitionId`.
3. Fill the required fields for that definition interface.
4. Use existing effect types instead of inventing an inline function.
5. Add it to the appropriate `src/data/cards/` export array.
6. Verify that `CardRegistry.get(id)` resolves it.
7. Add a behavior test and a card-summary test.

Do not add `cardSubtype` fields or new card classes. The existing union is the contract.
