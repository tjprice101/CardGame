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
      'On summon: gain 6 Equilibrium Sigils and all Seraphim gain +12 Patience. ' +
      'While on board: Equilibrium Sigil cap increases to 16. ' +
      'While in your deck: all Patience and Patient Light gains are uncapped. ' +
      'After 4 cards played: spend all Sigils, double all Patience, and gain heavy Oblivion per Sigil spent.',
    artKey: 'tx_angel_starbound_null_archangel',
    summonCost: ['inf-null-apex', 'tx-sera-null-entropy'],
    extraSummonConditions: [
      { type: 'board_definition_gte' as const, definitionId: 'tx-cher-null-sentinel', value: 1 },
      { type: 'equilibrium_sigils_gte' as const, value: 10 },
    ],
    onSummonEffects: [
      { type: 'neutrality_equilibrium_sigil_gain' as const, value: 6 },
      { type: 'patience_gain_all' as const, value: 12 },
    ],
    activatedAbility: {
      name: 'Starlit Equilibrium',
      cardsPlayedRequirement: 4,
      description: 'Spend all Sigils: double all Patience and gain +900 Oblivion per Sigil spent.',
      effects: [
        {
          type: 'neutrality_equilibrium_starbound_cashout' as const,
          oblivionPerSigil: 900,
          patientLightPerSigils: 5,
        },
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
      'On play: all Seraphim gain +8 Patience and gain 3 Equilibrium Sigils. ' +
      'While in your deck: all Patience and Patient Light gains are uncapped. ' +
      'While active: attacks scale heavily with your Sigils. ' +
      'On attack: consumes Patience, then restores a Sigil-scaled portion; if 10+ Patience was consumed, gain +1 Patient Light.',
    artKey: 'tx_sera_null_entropy',
    baseStats: { bonusType: 'oblivion_per_card' as const, bonusValue: 0},
    patienceThreshold: 8,
    onPlayEffects: [
      { type: 'patience_gain_all' as const, value: 8 },
      { type: 'neutrality_equilibrium_sigil_gain' as const, value: 3 },
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
      'On play: gain 2 Equilibrium Sigils and salvage any 1 card. ' +
      'While in your deck: all Patience and Patient Light gains are uncapped. ' +
      'Passive: Sigil-based Patience amplification remains online while this is on board. ' +
      'Automatically spends 4 Sigils whenever it triggers to reduce Seraphim cooldown pressure and grants +1 Patient Light each time.',
    artKey: 'tx_cher_null_sentinel',
    effects: [],
    onPlayEffects: [
      { type: 'neutrality_equilibrium_sigil_gain' as const, value: 2 },
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
      'Draw 2 cards, all Seraphim gain +10 Patience, and gain 4 Equilibrium Sigils. ' +
      'While in your deck: all Patience and Patient Light gains are uncapped. ' +
      'If you control 3+ active Seraphim: gain extra Oblivion and +1 Sigil. ' +
      'Tactical mode: may spend 6 Sigils for either massive burst Oblivion or full-team Patience restore; gain +1 Patient Light.',
    artKey: 'tx_oph_null_convergence',
    effects: [
      { type: 'draw' as const, value: 2 },
      { type: 'patience_gain_all' as const, value: 10 },
      { type: 'neutrality_equilibrium_sigil_gain' as const, value: 4 },
      {
        type: 'conditional' as const,
        condition: { type: 'seraphim_active_gte' as const, value: 3 },
        then: [
          { type: 'oblivion_flat' as const, value: 2800 },
          { type: 'neutrality_equilibrium_sigil_gain' as const, value: 1 },
        ],
      },
      {
        type: 'neutrality_equilibrium_tactical_spend' as const,
        spend: 6,
        burstOblivion: 7600,
        restorePercent: 100,
        patientLightGain: 1,
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
