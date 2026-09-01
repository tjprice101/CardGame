/**
 * Transcendent cards currently active in Ascension.
 *
 * Scope policy:
 * - Active Null Raid completion Angels are defined in TX_ANGELS.
 * - Raid Shop cards are defined in TX_SHOP_CARDS.
 */

import type { CardDefinition } from '@/types/cards';

const TX_ANGELS: CardDefinition[] = [
  {
    definitionId: 'tx-angel-starbound-null-archangel',
    type: 'Angel' as const,
    rarity: 'Legendary' as const,
    name: 'Starbound Null Archangel',
    description:
      'On summon: all Seraphim gain +16 Patience. ' +
      'While in your deck: all Patience gains are uncapped. ' +
      'After 4 cards played: double all Patience and gain +3600 Oblivion.',
    artKey: 'tx_angel_starbound_null_archangel',
    summonCost: ['inf-null-apex', 'tx-sera-null-entropy'],
    extraSummonConditions: [
      { type: 'board_definition_gte' as const, definitionId: 'tx-cher-null-sentinel', value: 1 },
    ],
    onSummonEffects: [
      { type: 'patience_gain_all' as const, value: 16 },
    ],
    activatedAbility: {
      name: 'Starlit Equilibrium',
      cardsPlayedRequirement: 4,
      description: 'Double all Patience and gain +3600 Oblivion.',
      effects: [
        { type: 'patience_double_all' as const },
        { type: 'oblivion_flat' as const, value: 3600 },
      ],
    },
    attacks: {
      primary: {
        id: 'tx-angel-starbound-null-archangel:primary',
        label: 'Primary' as const,
        name: 'Starbound Decree',
        description: '4600 base Oblivion · 6 cards cooldown',
        baseOblivion: 4600,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'neutrality', 'transcendent'],
      },
      exalted: {
        id: 'tx-angel-starbound-null-archangel:exalted',
        label: 'Exalted' as const,
        name: 'Verdict of the Last Constellation',
        description: '12400 base Oblivion · 9 cards cooldown',
        baseOblivion: 12400,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'neutrality', 'transcendent'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'ophanim_bonus' as const, bonusValue: 0 }
  },
];

const TX_SHOP_CARDS: CardDefinition[] = [
  {
    definitionId: 'tx-sera-null-entropy',
    type: 'Seraphim' as const,
    rarity: 'Legendary' as const,
    name: 'Null Entropy Seraph',
    description:
      'On play: all Seraphim gain +10 Patience. ' +
      'While in your deck: all Patience gains are uncapped. ' +
      'While active: attacks scale heavily with consumed Patience.',
    artKey: 'tx_sera_null_entropy',
    baseStats: { bonusType: 'oblivion_per_card' as const, bonusValue: 0},
    patienceThreshold: 8,
    onPlayEffects: [
      { type: 'patience_gain_all' as const, value: 10 },
    ],
    attacks: {
      unsynergized: {
        id: 'tx-sera-null-entropy:unsynergized',
        label: 'Unsynergized' as const,
        name: 'Entropy Cleave',
        description: '7400 base Oblivion · 6 cards cooldown',
        baseOblivion: 7400,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'neutrality', 'transcendent'],
      },
      synergized: {
        id: 'tx-sera-null-entropy:synergized',
        label: 'Synergized' as const,
        name: 'Absolute Entropy',
        description: '14600 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 14600,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'neutrality', 'transcendent'],
      },
    },
  },
  {
    definitionId: 'tx-cher-null-sentinel',
    type: 'Cherubim' as const,
    rarity: 'Legendary' as const,
    name: 'Null Sentinel',
    description:
      'On play: all Seraphim gain +4 Patience and salvage any 1 card. ' +
      'While in your deck: all Patience gains are uncapped.',
    artKey: 'tx_cher_null_sentinel',
    effects: [],
    onPlayEffects: [
      { type: 'patience_gain_all' as const, value: 4 },
      { type: 'salvage_any' as const },
    ],
    maxDurability: 10,
  },
  {
    definitionId: 'tx-oph-null-convergence',
    type: 'Ophanim' as const,
    rarity: 'Legendary' as const,
    name: 'Null Convergence',
    description:
      'Draw 2 cards and all Seraphim gain +12 Patience. ' +
      'While in your deck: all Patience gains are uncapped. ' +
      'If you control 3+ active Seraphim: gain extra Oblivion. ' +
      'Choose a unit: consume all its Patience for heavy Oblivion.',
    artKey: 'tx_oph_null_convergence',
    effects: [
      { type: 'draw' as const, value: 2 },
      { type: 'patience_gain_all' as const, value: 12 },
      {
        type: 'conditional' as const,
        condition: { type: 'seraphim_active_gte' as const, value: 3 },
        then: [
          { type: 'oblivion_flat' as const, value: 2800 },
        ],
      },
      {
        type: 'oblivion_from_target_unit_patience' as const,
        multiplier: 400,
        masteryMultiplierCap: 400,
      },
    ],
  },
];

export const transcendentCardDefinitions: CardDefinition[] = [...TX_ANGELS, ...TX_SHOP_CARDS];

/** Ids of all Angel-type transcendents (drop-only, never purchasable). */
export const TRANSCENDENT_ANGEL_IDS: ReadonlySet<string> = new Set(
  TX_ANGELS.map(a => a.definitionId),
);

/** Ids of all shop-purchasable transcendents. */
export const TRANSCENDENT_SHOP_IDS: ReadonlySet<string> = new Set(
  TX_SHOP_CARDS.map(c => c.definitionId),
);

/** Entropic Energy costs for each Transcendent shop card. */
export const TRANSCENDENT_SHOP_COSTS: Readonly<Record<string, number>> = {
  'tx-sera-null-entropy': 6000,
  'tx-cher-null-sentinel': 5000,
  'tx-oph-null-convergence': 4500,
};
