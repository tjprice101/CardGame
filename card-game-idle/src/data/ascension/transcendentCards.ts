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
    element: 'Neutrality',
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
  {
    definitionId: 'tx-angel-pyro-first-ember',
    type: 'Angel' as const,
    element: 'Fire',
    rarity: 'Legendary' as const,
    name: 'Starflame Cataclysm Archangel',
    description:
      'On summon: gain 6 Inferno Tiers and 6 Chroma Embers, then Confluence up to 3 matched pairs for burst Oblivion. ' +
      'After 4 cards played: restoke both pools and trigger a larger Confluence burst. ' +
      'While on board: rewards matched Inferno Tier and Chroma Ember sequencing for heavy payoff.',
    artKey: 'tx_angel_pyro_first_ember',
    summonCost: ['inf-pyraxis-colossus', 'tx-sera-pyro-singularity'],
    extraSummonConditions: [
      { type: 'board_definition_gte' as const, definitionId: 'tx-cher-pyro-vow', value: 1 },
      { type: 'eternal_stack_gte' as const, stack: 'pyro', value: 8 },
      { type: 'set_secondary_gte' as const, kind: 'pyro', value: 6 },
    ],
    onSummonEffects: [
      { type: 'eternal_stack_gain' as const, stack: 'pyro', value: 6 },
      { type: 'set_secondary_gain' as const, kind: 'pyro', value: 6 },
      {
        type: 'pyro_transcendent_confluence' as const,
        consume: 3,
        oblivionPerPair: 1300,
        drawAtPairs: 3,
      },
    ],
    activatedAbility: {
      name: 'Cataclysm Coronation',
      cardsPlayedRequirement: 4,
      description: 'Gain 2 Inferno Tiers and 2 Chroma Embers, then Confluence up to 5 matched pairs for a crowned burst.',
      effects: [
        { type: 'eternal_stack_gain' as const, stack: 'pyro', value: 2 },
        { type: 'set_secondary_gain' as const, kind: 'pyro', value: 2 },
        {
          type: 'pyro_transcendent_confluence' as const,
          consume: 5,
          oblivionPerPair: 1550,
          empowerAtPairs: 4,
        },
      ],
    },
    attacks: {
      primary: {
        id: 'tx-angel-pyro-first-ember:primary',
        label: 'Primary' as const,
        name: 'Crownflare Verdict',
        description: '4600 base Oblivion · 5 cards cooldown · +3% attack per Heat (max +75%)',
        baseOblivion: 4600,
        cooldownCards: 5,
        costs: [],
        tags: ['angel', 'primary', 'fire', 'transcendent'],
      },
      exalted: {
        id: 'tx-angel-pyro-first-ember:exalted',
        label: 'Exalted' as const,
        name: 'Abyssal Eventide Decree',
        description: '13685 base Oblivion · 8 cards cooldown · +3% attack per Heat (max +75%)',
        baseOblivion: 13685,
        cooldownCards: 8,
        costs: [],
        tags: ['angel', 'exalted', 'fire', 'transcendent'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'ophanim_bonus' as const, bonusValue: 0 },
  },
  {
    definitionId: 'tx-angel-light-astral-adjudicator',
    type: 'Angel' as const,
    element: 'Light',
    rarity: 'Legendary' as const,
    name: 'Astral Adjudicator Prime',
    description:
      'The apex Light Transcendent of the Twin Horizon Raid — triggers Duality twice, ' +
      'channeling the full weight of Radiance, Halo, and Resonance into each verdict.',
    artKey: 'tx_angel_light_astral_adjudicator',
    summonCost: ['inf-lucent-cataclysm-archon', 'tx-sera-light-duality-crown'],
    extraSummonConditions: [
      { type: 'board_definition_gte' as const, definitionId: 'tx-cher-light-duality-vow', value: 1 },
      { type: 'eternal_stack_gte' as const, stack: 'light', value: 10 },
      { type: 'cherubim_active_gte' as const, value: 1 },
    ],
    onSummonEffects: [
      { type: 'radiance_gain' as const, value: 96 },
      { type: 'eternal_stack_gain' as const, stack: 'light', value: 7 },
      {
        type: 'light_transcendent_duality_choice' as const,
        baseOblivion: 630,
        resonanceScale: 116,
        haloScale: 95,
        distinctNoteScale: 47,
        thresholdDivisor: 5,
        thresholdScale: 131,
      },
    ],
    activatedAbility: {
      name: 'Zenith Appellation',
      cardsPlayedRequirement: 4,
      description: 'Gain 48 Radiance and 4 Halo, then trigger Duality.',
      effects: [
        { type: 'radiance_gain' as const, value: 48 },
        { type: 'eternal_stack_gain' as const, stack: 'light', value: 4 },
        {
          type: 'light_transcendent_duality_choice' as const,
          baseOblivion: 630,
          resonanceScale: 116,
          haloScale: 95,
          distinctNoteScale: 47,
          thresholdDivisor: 5,
          thresholdScale: 131,
        },
      ],
    },
    attacks: {
      primary: {
        id: 'tx-angel-light-astral-adjudicator:primary',
        label: 'Primary' as const,
        name: 'Solar Verdict Prime',
        description: '4860 base Oblivion · 5 cards cooldown',
        baseOblivion: 4860,
        cooldownCards: 5,
        costs: [],
        tags: ['angel', 'primary', 'light', 'transcendent'],
      },
      exalted: {
        id: 'tx-angel-light-astral-adjudicator:exalted',
        label: 'Exalted' as const,
        name: 'Judgment of Twin Horizons',
        description: '13940 base Oblivion · 8 cards cooldown',
        baseOblivion: 13940,
        cooldownCards: 8,
        costs: [],
        tags: ['angel', 'exalted', 'light', 'transcendent'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'ophanim_bonus' as const, bonusValue: 0 },
  },
];

const TX_SHOP_CARDS: CardDefinition[] = [
  {
    definitionId: 'tx-sera-null-entropy',
    type: 'Seraphim' as const,
    element: 'Neutrality',
    rarity: 'Legendary' as const,
    name: 'Null Entropy Seraph',
    description:
      'On play: all Seraphim gain +8 Patience and gain 3 Equilibrium Sigils. ' +
      'While in your deck: all Patience and Patient Light gains are uncapped. ' +
      'While active: attacks scale heavily with your Sigils. ' +
      'On attack: consumes Patience, then restores a Sigil-scaled portion; if 10+ Patience was consumed, gain +1 Patient Light.',
    artKey: 'tx_sera_null_entropy',
    baseStats: { bonusType: 'oblivion_per_card' as const, bonusValue: 0, synergyRequirement: 'Neutrality' },
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
    element: 'Neutrality',
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
    element: 'Neutrality',
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
  {
    definitionId: 'tx-sera-pyro-singularity',
    type: 'Seraphim' as const,
    element: 'Fire',
    rarity: 'Legendary' as const,
    name: 'Abyssal Singularity Seraph',
    description:
      'On play: gain 4 Inferno Tiers and 4 Chroma Embers, then Confluence up to 3 matched pairs for an immediate burst. ' +
      'If 3 pairs are spent, empower the next card you play. ' +
      'This is the suite\'s precision compressor: it turns a balanced state into instant pressure.',
    artKey: 'tx_sera_pyro_singularity',
    baseStats: { bonusType: 'oblivion_per_card' as const, bonusValue: 38, synergyRequirement: 'Fire' },
    patienceThreshold: 6,
    onPlayEffects: [
      { type: 'eternal_stack_gain' as const, stack: 'pyro', value: 4 },
      { type: 'set_secondary_gain' as const, kind: 'pyro', value: 4 },
      {
        type: 'pyro_transcendent_confluence' as const,
        consume: 3,
        oblivionPerPair: 980,
        empowerAtPairs: 3,
      },
    ],
    attacks: {
      unsynergized: {
        id: 'tx-sera-pyro-singularity:unsynergized',
        label: 'Unsynergized' as const,
        name: 'Singularity Cleave',
        description: '9439 base Oblivion · 4 cards cooldown · +3% attack per Heat (max +75%)',
        baseOblivion: 9439,
        cooldownCards: 4,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'fire', 'transcendent'],
      },
      synergized: {
        id: 'tx-sera-pyro-singularity:synergized',
        label: 'Synergized' as const,
        name: 'Eventide Singularity',
        description: '15540 base Oblivion · 8 cards cooldown · Requires Angel · +3% attack per Heat (max +75%)',
        baseOblivion: 15540,
        cooldownCards: 8,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'fire', 'transcendent'],
      },
    },
  },
  {
    definitionId: 'tx-cher-pyro-vow',
    type: 'Cherubim' as const,
    element: 'Fire',
    rarity: 'Legendary' as const,
    name: 'Cinder Vow Cherub',
    description:
      'On play: gain 2 Inferno Tiers, gain 3 Chroma Embers, salvage any 1 card, then Confluence 1 matched pair and refund 1 Chroma Ember. ' +
      'Passive: sharpens allied Fire attacks while keeping Confluence turns stocked.',
    artKey: 'tx_cher_pyro_vow',
    effects: [],
    onPlayEffects: [
      { type: 'eternal_stack_gain' as const, stack: 'pyro', value: 2 },
      { type: 'set_secondary_gain' as const, kind: 'pyro', value: 3 },
      { type: 'salvage_any' as const },
      {
        type: 'pyro_transcendent_confluence' as const,
        consume: 1,
        oblivionPerPair: 640,
        gainChromaPerPair: 1,
      },
    ],
    maxDurability: 10,
  },
  {
    definitionId: 'tx-oph-pyro-hellstar',
    type: 'Ophanim' as const,
    element: 'Fire',
    rarity: 'Legendary' as const,
    name: 'Hellstar Ophanim',
    description:
      'Draw 1, then correct whichever side of your Pyro state is lagging. ' +
      'If Inferno Tiers are high, forge extra Chroma Embers; if Chroma Embers are high, raise Inferno Tiers. ' +
      'Then Confluence up to 2 matched pairs for a tactical burst and empower the next card if both pairs land.',
    artKey: 'tx_oph_pyro_hellstar',
    effects: [
      { type: 'draw' as const, value: 1 },
      {
        type: 'conditional' as const,
        condition: { type: 'eternal_stack_gte' as const, stack: 'pyro', value: 8 },
        then: [
          { type: 'set_secondary_gain' as const, kind: 'pyro', value: 3 },
          { type: 'oblivion_flat' as const, value: 1800 },
        ],
      },
      {
        type: 'conditional' as const,
        condition: { type: 'set_secondary_gte' as const, kind: 'pyro', value: 8 },
        then: [
          { type: 'eternal_stack_gain' as const, stack: 'pyro', value: 3 },
          { type: 'oblivion_flat' as const, value: 1800 },
        ],
      },
      {
        type: 'pyro_transcendent_confluence' as const,
        consume: 2,
        oblivionPerPair: 900,
        empowerAtPairs: 2,
      },
    ],
  },
  {
    definitionId: 'tx-sera-light-duality-crown',
    type: 'Seraphim' as const,
    element: 'Light',
    rarity: 'Legendary' as const,
    name: 'Duality Crown',
    description:
      'A precision Light Seraphim that enters the board with an immediate Duality verdict, ' +
      'fueling Halo pressure while active attacks scale with your full Light engine state.',
    artKey: 'tx_sera_light_duality_crown',
    baseStats: { bonusType: 'oblivion_per_card' as const, bonusValue: 44, synergyRequirement: 'Light' },
    patienceThreshold: 6,
    onPlayEffects: [
      { type: 'radiance_gain' as const, value: 72 },
      { type: 'eternal_stack_gain' as const, stack: 'light', value: 5 },
      {
        type: 'light_transcendent_duality_choice' as const,
        baseOblivion: 630,
        resonanceScale: 116,
        haloScale: 95,
        distinctNoteScale: 47,
        thresholdDivisor: 5,
        thresholdScale: 131,
      },
    ],
    attacks: {
      unsynergized: {
        id: 'tx-sera-light-duality-crown:unsynergized',
        label: 'Unsynergized' as const,
        name: 'Duality Crown Break',
        description: '9360 base Oblivion · 5 cards cooldown',
        baseOblivion: 9360,
        cooldownCards: 5,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'light', 'transcendent'],
      },
      synergized: {
        id: 'tx-sera-light-duality-crown:synergized',
        label: 'Synergized' as const,
        name: 'Astral Dual Verdict',
        description: '15620 base Oblivion · 8 cards cooldown · Requires Angel',
        baseOblivion: 15620,
        cooldownCards: 8,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'light', 'transcendent'],
      },
    },
  },
  {
    definitionId: 'tx-cher-light-duality-vow',
    type: 'Cherubim' as const,
    element: 'Light',
    rarity: 'Legendary' as const,
    name: 'Duality Vow',
    description:
      'A Cherubim support that swears the Duality vow on entry — salvages for value, ' +
      'seeds Radiance and Halo, then forces a judgment call between cardflow and burst Oblivion.',
    artKey: 'tx_cher_light_duality_vow',
    effects: [],
    onPlayEffects: [
      { type: 'radiance_gain' as const, value: 54 },
      { type: 'eternal_stack_gain' as const, stack: 'light', value: 4 },
      { type: 'salvage_any' as const },
      {
        type: 'light_transcendent_duality_choice' as const,
        baseOblivion: 630,
        resonanceScale: 116,
        haloScale: 95,
        distinctNoteScale: 47,
        thresholdDivisor: 5,
        thresholdScale: 131,
      },
    ],
    maxDurability: 10,
  },
  {
    definitionId: 'tx-oph-light-duality-wheel',
    type: 'Ophanim' as const,
    element: 'Light',
    rarity: 'Legendary' as const,
    name: 'Duality Wheel',
    description:
      'An Ophanim that spins the Duality wheel — draws, feeds Radiance and Halo into the engine, ' +
      'then demands a verdict. Resonance-stable boards earn a bonus burst and card empowerment.',
    artKey: 'tx_oph_light_duality_wheel',
    effects: [
      { type: 'draw' as const, value: 1 },
      { type: 'radiance_gain' as const, value: 60 },
      { type: 'eternal_stack_gain' as const, stack: 'light', value: 5 },
      {
        type: 'light_transcendent_duality_choice' as const,
        baseOblivion: 630,
        resonanceScale: 116,
        haloScale: 95,
        distinctNoteScale: 47,
        thresholdDivisor: 5,
        thresholdScale: 131,
      },
      {
        type: 'conditional' as const,
        condition: { type: 'light_resonance_gte' as const, value: 5 },
        then: [
          { type: 'oblivion_flat' as const, value: 2200 },
          { type: 'multiply_next' as const },
        ],
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
  'tx-sera-pyro-singularity': 6200,
  'tx-cher-pyro-vow': 5600,
  'tx-oph-pyro-hellstar': 5200,
  'tx-sera-light-duality-crown': 6400,
  'tx-cher-light-duality-vow': 5700,
  'tx-oph-light-duality-wheel': 5400,
};
