/**
 * Transcendent Cards — purchasable from the Entropy Shop and dropped as
 * completion Angels from Null Raids.
 *
 * PURCHASE RULES:
 *   - Seraphim, Cherubim, and Ophanim Transcendents are purchasable from
 *     the Entropy Shop with Entropy currency.
 *   - Angel Transcendents are exclusively awarded via the 5% completion
 *     drop on a Null Raid's final boss kill.
 *
 * DESCRIPTION RULES (per spec):
 *   - Maximum 3 lines. Line 1: new mechanic name + brief summary.
 *   - Lines 2-3: activation conditions.
 */

import type { CardDefinition } from '@/types/cards';

// ── Seraphim Transcendents ─────────────────────────────────────────────────

const TX_SERAPHIM: CardDefinition[] = [
  {
    definitionId: 'tx-sera-null-entropy',
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Entropy Herald',
    description:
      'Void Surge: Oblivion grants are doubled while Patience stacks equal or exceed 10.\n' +
      'Activate: Maintain 10 Patience stacks on any Seraphim.',
    artKey: 'tx_sera_null_entropy',
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 4, synergyRequirement: 'Neutrality' },
    attacks: {
      unsynergized: {
        id: 'tx-sera-null-entropy:unsynergized',
        label: 'Unsynergized',
        name: 'Null Rend',
        description: '120 base Oblivion · 3 cards cooldown',
        baseOblivion: 120,
        cooldownCards: 3,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'neutrality', 'transcendent'],
      },
      synergized: {
        id: 'tx-sera-null-entropy:synergized',
        label: 'Synergized',
        name: 'Void Entropy',
        description: '480 base Oblivion · 6 cards cooldown',
        baseOblivion: 480,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'synergized', 'neutrality', 'transcendent'],
      },
    },
    onPlayEffects: [{ type: 'oblivion_flat', value: 10 }],
  },
  {
    definitionId: 'tx-sera-pyro-singularity',
    type: 'Seraphim',
    element: 'Fire',
    rarity: 'Eternal',
    name: 'Singularity Ember',
    description:
      'Cinder Nova: When Furnace Pressure reaches 20, the next Seraphim attack deals 3× damage.\n' +
      'Activate: Stack Furnace Pressure to 20 via Seraphim attacks or Ophanim.',
    artKey: 'tx_sera_pyro_singularity',
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 3, synergyRequirement: 'Fire' },
    attacks: {
      unsynergized: {
        id: 'tx-sera-pyro-singularity:unsynergized',
        label: 'Unsynergized',
        name: 'Cinder Rend',
        description: '135 base Oblivion · 3 cards cooldown',
        baseOblivion: 135,
        cooldownCards: 3,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'fire', 'transcendent'],
      },
      synergized: {
        id: 'tx-sera-pyro-singularity:synergized',
        label: 'Synergized',
        name: 'Singularity Nova',
        description: '540 base Oblivion · 7 cards cooldown',
        baseOblivion: 540,
        cooldownCards: 7,
        costs: [],
        tags: ['seraphim', 'synergized', 'fire', 'transcendent'],
      },
    },
    onPlayEffects: [{ type: 'oblivion_flat', value: 8 }],
  },
  {
    definitionId: 'tx-sera-sea-current',
    type: 'Seraphim',
    element: 'EternalSeas',
    rarity: 'Eternal',
    name: 'Current Ascendant',
    description:
      'Polarity Lock: While White Flow is active, gain +50% global Oblivion mult until Flow shifts.\n' +
      'Activate: Keep White Flow polarity positive; toggling resets the bonus.',
    artKey: 'tx_sera_sea_current',
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 5, synergyRequirement: 'EternalSeas' },
    attacks: {
      unsynergized: {
        id: 'tx-sera-sea-current:unsynergized',
        label: 'Unsynergized',
        name: 'Tide Lance',
        description: '110 base Oblivion · 3 cards cooldown',
        baseOblivion: 110,
        cooldownCards: 3,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'seas', 'transcendent'],
      },
      synergized: {
        id: 'tx-sera-sea-current:synergized',
        label: 'Synergized',
        name: 'Polarity Sundering',
        description: '460 base Oblivion · 6 cards cooldown',
        baseOblivion: 460,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'synergized', 'seas', 'transcendent'],
      },
    },
    onPlayEffects: [{ type: 'seas_current_gain', value: 3 }],
  },
  {
    definitionId: 'tx-sera-star-lattice',
    type: 'Seraphim',
    element: 'WishedUponAStar',
    rarity: 'Eternal',
    name: 'Lattice Sovereign',
    description:
      'Dream Amplify: Each Starlight Charge spent adds 5% to the next Synergized attack multiplier.\n' +
      'Activate: Spend Starlight Charges via Ophanim before Seraphim attacks.',
    artKey: 'tx_sera_star_lattice',
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 3, synergyRequirement: 'WishedUponAStar' },
    attacks: {
      unsynergized: {
        id: 'tx-sera-star-lattice:unsynergized',
        label: 'Unsynergized',
        name: 'Starlight Rend',
        description: '125 base Oblivion · 3 cards cooldown',
        baseOblivion: 125,
        cooldownCards: 3,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'star', 'transcendent'],
      },
      synergized: {
        id: 'tx-sera-star-lattice:synergized',
        label: 'Synergized',
        name: 'Lattice Judgment',
        description: '500 base Oblivion · 7 cards cooldown',
        baseOblivion: 500,
        cooldownCards: 7,
        costs: [],
        tags: ['seraphim', 'synergized', 'star', 'transcendent'],
      },
    },
    onPlayEffects: [{ type: 'oblivion_flat', value: 8 }],
  },
  {
    definitionId: 'tx-sera-void-nullform',
    type: 'Seraphim',
    element: 'Dark',
    rarity: 'Eternal',
    name: 'Nullform Ascendant',
    description:
      'Void Resonance: This Seraphim gains +10 Oblivion per attack for each distinct element in your active deck.\n' +
      'Activate: Build a multi-element deck; bonus scales with element diversity.',
    artKey: 'tx_sera_void_nullform',
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 5, synergyRequirement: 'Dark' },
    attacks: {
      unsynergized: {
        id: 'tx-sera-void-nullform:unsynergized',
        label: 'Unsynergized',
        name: 'Null Cleave',
        description: '150 base Oblivion · 4 cards cooldown',
        baseOblivion: 150,
        cooldownCards: 4,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'dark', 'transcendent'],
      },
      synergized: {
        id: 'tx-sera-void-nullform:synergized',
        label: 'Synergized',
        name: 'Void Anathema',
        description: '620 base Oblivion · 8 cards cooldown',
        baseOblivion: 620,
        cooldownCards: 8,
        costs: [],
        tags: ['seraphim', 'synergized', 'dark', 'transcendent'],
      },
    },
    onPlayEffects: [{ type: 'oblivion_flat', value: 12 }],
  },
];

// ── Cherubim Transcendents ─────────────────────────────────────────────────

const TX_CHERUBIM: CardDefinition[] = [
  {
    definitionId: 'tx-cher-null-sentinel',
    type: 'Cherubim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Sentinel of Stillness',
    description:
      'Attenuation Field: While in the back row, Patience decay on all Seraphim is halved.\n' +
      'Activate: Place in any back slot; effect is passive and constant.',
    artKey: 'tx_cher_null_sentinel',
    effects: [
      { type: 'cherubim_global_oblivion_mult', value: 0.3 },
    ],
    onPlayEffects: [],
    maxDurability: 5,
  },
  {
    definitionId: 'tx-cher-pyro-infernal',
    type: 'Cherubim',
    element: 'Fire',
    rarity: 'Eternal',
    name: 'Infernal Pact',
    description:
      'Furnace Bond: All Fire Seraphim on the board gain +20% attack Oblivion output.\n' +
      'Activate: Place in any back slot; bonus applies to Seraphim on board immediately.',
    artKey: 'tx_cher_pyro_infernal',
    effects: [
      { type: 'cherubim_seraphim_amp', value: 0.2 },
      { type: 'cherubim_global_oblivion_mult', value: 0.2 },
    ],
    onPlayEffects: [{ type: 'oblivion_flat', value: 15 }],
    maxDurability: 4,
  },
  {
    definitionId: 'tx-cher-sea-deepbond',
    type: 'Cherubim',
    element: 'EternalSeas',
    rarity: 'Eternal',
    name: 'Deep Bond Pact',
    description:
      'Current Anchor: Seraphim board attacks do not shift Polarity while this is active.\n' +
      'Activate: Place in any back slot; protects all front-row Seraphim from polarity drift.',
    artKey: 'tx_cher_sea_deepbond',
    effects: [
      { type: 'cherubim_global_oblivion_mult', value: 0.3 },
    ],
    onPlayEffects: [],
    maxDurability: 5,
  },
  {
    definitionId: 'tx-cher-mech-overclock',
    type: 'Cherubim',
    element: 'Mechanical',
    rarity: 'Eternal',
    name: 'Overclock Circuit',
    description:
      'Queue Expansion: Instruction Queue capacity is increased by 2 while in the back row.\n' +
      'Activate: Place in any back slot; effect is permanent until this card expires.',
    artKey: 'tx_cher_mech_overclock',
    effects: [
      { type: 'cherubim_oblivion_per_card', value: 5 },
      { type: 'cherubim_global_oblivion_mult', value: 0.15 },
    ],
    onPlayEffects: [{ type: 'oblivion_flat', value: 10 }],
    maxDurability: 6,
  },
  {
    definitionId: 'tx-cher-glass-theorem',
    type: 'Cherubim',
    element: 'GlassAbsolute',
    rarity: 'Eternal',
    name: 'Living Theorem',
    description:
      'Proof Cascade Amp: Proof Cascade Oblivion grants are +50% larger while this is active.\n' +
      'Activate: Place in any back slot; amplifies all Cascade events passively.',
    artKey: 'tx_cher_glass_theorem',
    effects: [
      { type: 'cherubim_global_oblivion_mult', value: 0.35 },
    ],
    onPlayEffects: [],
    maxDurability: 4,
  },
];

// ── Ophanim Transcendents ──────────────────────────────────────────────────

const TX_OPHANIM: CardDefinition[] = [
  {
    definitionId: 'tx-oph-null-convergence',
    type: 'Ophanim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Convergence Point',
    description:
      'Equilibrium Burst: Grants 30 Oblivion; grants 60 instead if Patience stacks ≥ 8.\n' +
      'Activate: Play this card; Patience stacks are checked at play time.',
    artKey: 'tx_oph_null_convergence',
    effects: [{ type: 'oblivion_flat', value: 30 }],
  },
  {
    definitionId: 'tx-oph-pyro-ashen-crown',
    type: 'Ophanim',
    element: 'Fire',
    rarity: 'Eternal',
    name: 'Ashen Crown',
    description:
      'Crown of Cinders: Grants 25 Oblivion and 5 Furnace Pressure to all Fire Seraphim.\n' +
      'Activate: Play while at least one Fire Seraphim is on the board.',
    artKey: 'tx_oph_pyro_ashen_crown',
    effects: [
      { type: 'oblivion_flat', value: 25 },
    ],
  },
  {
    definitionId: 'tx-oph-sea-tidal-echo',
    type: 'Ophanim',
    element: 'EternalSeas',
    rarity: 'Eternal',
    name: 'Tidal Echo',
    description:
      'Current Mirror: Grants 20 Oblivion and 4 Current tokens matching active Polarity.\n' +
      'Activate: Play this card; Polarity is checked at play time.',
    artKey: 'tx_oph_sea_tidal_echo',
    effects: [
      { type: 'oblivion_flat', value: 20 },
      { type: 'seas_current_gain', value: 4 },
    ],
  },
  {
    definitionId: 'tx-oph-star-wishbeam',
    type: 'Ophanim',
    element: 'WishedUponAStar',
    rarity: 'Eternal',
    name: 'Wishbeam',
    description:
      'Stellar Amplify: Grants 3 Starlight Charges and 20 Oblivion immediately.\n' +
      'Activate: Play at any time; charges and Oblivion are added on play.',
    artKey: 'tx_oph_star_wishbeam',
    effects: [
      { type: 'oblivion_flat', value: 20 },
    ],
  },
  {
    definitionId: 'tx-oph-void-null-pulse',
    type: 'Ophanim',
    element: 'Dark',
    rarity: 'Eternal',
    name: 'Null Pulse',
    description:
      'Entropy Wave: Grants 35 Oblivion and reduces all active Seraphim cooldowns by 1 card.\n' +
      'Activate: Play this card; cooldown reduction applies immediately on play.',
    artKey: 'tx_oph_void_null_pulse',
    effects: [
      { type: 'oblivion_flat', value: 35 },
    ],
  },
];

// ── Completion Angel Drops ─────────────────────────────────────────────────
// Exclusively awarded by the 5% Null Raid completion drop.
// Cannot be purchased from the Entropy Shop.

const TX_ANGELS = [
  {
    definitionId: 'tx-angel-null-verdant',
    type: 'Angel' as const,
    element: 'Neutrality',
    rarity: 'Legendary' as const,
    name: 'Verdant Null, the Balanced',
    description:
      'On summon: Reset all Seraphim attack cooldowns and grant 50 Oblivion. ' +
      'After 4 cards played: Double all Patience on the board. ' +
      'While on board: +25 Oblivion per card played.',
    artKey: 'tx_angel_null_verdant',
    summonCost: ['ser-neutral-null', 'ser-neutral-null'],
    onSummonEffects: [{ type: 'oblivion_flat' as const, value: 50 }],
    activatedAbility: {
      name: 'Equilibrium Absolute',
      cardsPlayedRequirement: 4,
      description: 'Double all Patience on the board.',
      effects: [{ type: 'patience_double_all' as unknown as 'oblivion_flat', value: 0 }],
    },
    attacks: {
      primary: {
        id: 'tx-angel-null-verdant:primary',
        label: 'Primary' as const,
        name: 'Null Edict',
        description: '420 base Oblivion · 3 cards cooldown',
        baseOblivion: 420,
        cooldownCards: 3,
        costs: [],
        tags: ['angel', 'primary', 'neutrality', 'transcendent'],
      },
      exalted: {
        id: 'tx-angel-null-verdant:exalted',
        label: 'Exalted' as const,
        name: 'Verdict Absolute',
        description: '900 base Oblivion · 5 cards cooldown',
        baseOblivion: 900,
        cooldownCards: 5,
        costs: [],
        tags: ['angel', 'exalted', 'neutrality', 'transcendent'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card' as const, bonusValue: 25 },
  },
  {
    definitionId: 'tx-angel-pyro-first-ember',
    type: 'Angel' as const,
    element: 'Fire',
    rarity: 'Legendary' as const,
    name: 'First Ember, the Undying',
    description:
      'On summon: Grant 10 Furnace Pressure to all Fire Seraphim and +40 Oblivion. ' +
      'After 3 cards played: All Fire Seraphim attack simultaneously once. ' +
      'While on board: +30 Oblivion when a Seraphim fires a Synergized attack.',
    artKey: 'tx_angel_pyro_first_ember',
    summonCost: ['ser-pyro-pyre', 'ser-pyro-pyre'],
    onSummonEffects: [{ type: 'oblivion_flat' as const, value: 40 }],
    activatedAbility: {
      name: 'Primal Ignition',
      cardsPlayedRequirement: 3,
      description: 'All Fire Seraphim attack simultaneously.',
      effects: [{ type: 'oblivion_flat' as const, value: 30 }],
    },
    attacks: {
      primary: {
        id: 'tx-angel-pyro-first-ember:primary',
        label: 'Primary' as const,
        name: 'Primal Ember',
        description: '440 base Oblivion · 3 cards cooldown',
        baseOblivion: 440,
        cooldownCards: 3,
        costs: [],
        tags: ['angel', 'primary', 'fire', 'transcendent'],
      },
      exalted: {
        id: 'tx-angel-pyro-first-ember:exalted',
        label: 'Exalted' as const,
        name: 'First Ignition',
        description: '950 base Oblivion · 5 cards cooldown',
        baseOblivion: 950,
        cooldownCards: 5,
        costs: [],
        tags: ['angel', 'exalted', 'fire', 'transcendent'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card' as const, bonusValue: 30 },
  },
  {
    definitionId: 'tx-angel-glass-axiom-prime',
    type: 'Angel' as const,
    element: 'GlassAbsolute',
    rarity: 'Legendary' as const,
    name: 'Axiom Prime',
    description:
      'On summon: Trigger Proof Cascade twice and grant 40 Oblivion. ' +
      'After 4 cards played: Double the next Proof Cascade Oblivion gain. ' +
      'While on board: +25 Oblivion whenever Proof Cascade triggers.',
    artKey: 'tx_angel_glass_axiom_prime',
    summonCost: ['ser-glass-axiom', 'ser-glass-axiom'],
    onSummonEffects: [
      { type: 'proof_gain' as unknown as 'oblivion_flat', value: 2 },
      { type: 'oblivion_flat' as const, value: 40 },
    ],
    activatedAbility: {
      name: 'Absolute Proof',
      cardsPlayedRequirement: 4,
      description: 'Double the next Proof Cascade Oblivion grant.',
      effects: [{ type: 'oblivion_flat' as const, value: 40 }],
    },
    attacks: {
      primary: {
        id: 'tx-angel-glass-axiom-prime:primary',
        label: 'Primary' as const,
        name: 'Axiom Ray',
        description: '460 base Oblivion · 3 cards cooldown',
        baseOblivion: 460,
        cooldownCards: 3,
        costs: [],
        tags: ['angel', 'primary', 'glass', 'transcendent'],
      },
      exalted: {
        id: 'tx-angel-glass-axiom-prime:exalted',
        label: 'Exalted' as const,
        name: 'Proof Absolute',
        description: '1000 base Oblivion · 6 cards cooldown',
        baseOblivion: 1000,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'exalted', 'glass', 'transcendent'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card' as const, bonusValue: 25 },
  },
  {
    definitionId: 'tx-angel-thorn-scar-warden',
    type: 'Angel' as const,
    element: 'Thornbound',
    rarity: 'Legendary' as const,
    name: 'Scar Warden',
    description:
      'On summon: Maximize Trail stacks and grant 35 Oblivion. ' +
      'After 4 cards played: All Scar bonuses are doubled this turn. ' +
      'While on board: +20 Oblivion per Trail spent.',
    artKey: 'tx_angel_thorn_scar_warden',
    summonCost: ['ser-thorn-briar', 'ser-thorn-briar'],
    onSummonEffects: [
      { type: 'trail_gain' as unknown as 'oblivion_flat', value: 10 },
      { type: 'oblivion_flat' as const, value: 35 },
    ],
    activatedAbility: {
      name: 'Scar Culmination',
      cardsPlayedRequirement: 4,
      description: 'All Scar bonuses are doubled this turn.',
      effects: [{ type: 'oblivion_flat' as const, value: 35 }],
    },
    attacks: {
      primary: {
        id: 'tx-angel-thorn-scar-warden:primary',
        label: 'Primary' as const,
        name: 'Gallow Severance',
        description: '430 base Oblivion · 3 cards cooldown',
        baseOblivion: 430,
        cooldownCards: 3,
        costs: [],
        tags: ['angel', 'primary', 'thornbound', 'transcendent'],
      },
      exalted: {
        id: 'tx-angel-thorn-scar-warden:exalted',
        label: 'Exalted' as const,
        name: 'Scar Dominion',
        description: '920 base Oblivion · 5 cards cooldown',
        baseOblivion: 920,
        cooldownCards: 5,
        costs: [],
        tags: ['angel', 'exalted', 'thornbound', 'transcendent'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card' as const, bonusValue: 20 },
  },
  {
    definitionId: 'tx-angel-machine-kernel-sovereign',
    type: 'Angel' as const,
    element: 'Mechanical',
    rarity: 'Legendary' as const,
    name: 'Kernel Sovereign',
    description:
      'On summon: Fill the Instruction Queue to capacity and grant 40 Oblivion. ' +
      'After 3 cards played: Kernel triggers cost 0 Oblivion until end of turn. ' +
      'While on board: +25 Oblivion when Kernel triggers.',
    artKey: 'tx_angel_machine_kernel_sovereign',
    summonCost: ['ser-mech-gear', 'ser-mech-gear'],
    onSummonEffects: [{ type: 'oblivion_flat' as const, value: 40 }],
    activatedAbility: {
      name: 'System Reboot',
      cardsPlayedRequirement: 3,
      description: 'Kernel triggers cost 0 Oblivion until end of turn.',
      effects: [{ type: 'oblivion_flat' as const, value: 40 }],
    },
    attacks: {
      primary: {
        id: 'tx-angel-machine-kernel-sovereign:primary',
        label: 'Primary' as const,
        name: 'Kernel Decree',
        description: '450 base Oblivion · 3 cards cooldown',
        baseOblivion: 450,
        cooldownCards: 3,
        costs: [],
        tags: ['angel', 'primary', 'mechanical', 'transcendent'],
      },
      exalted: {
        id: 'tx-angel-machine-kernel-sovereign:exalted',
        label: 'Exalted' as const,
        name: 'Prime Process',
        description: '980 base Oblivion · 6 cards cooldown',
        baseOblivion: 980,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'exalted', 'mechanical', 'transcendent'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card' as const, bonusValue: 25 },
  },
  {
    definitionId: 'tx-angel-sea-tidal-sovereign',
    type: 'Angel' as const,
    element: 'EternalSeas',
    rarity: 'Legendary' as const,
    name: 'Tidal Sovereign',
    description:
      'On summon: Force Polarity into White Flow and grant 50 Oblivion. ' +
      'After 5 cards played: Instantly grant 15 Current tokens at maximum Polarity bonus. ' +
      'While on board: Polarity cannot shift to Black Flow.',
    artKey: 'tx_angel_sea_tidal_sovereign',
    summonCost: ['ser-seas-current', 'ser-seas-current'],
    onSummonEffects: [
      { type: 'seas_polarity_shift' as unknown as 'oblivion_flat', polarity: 'White', value: 0 },
      { type: 'oblivion_flat' as const, value: 50 },
    ],
    activatedAbility: {
      name: 'Ocean Cataclysm',
      cardsPlayedRequirement: 5,
      description: 'Grant 15 Current tokens at maximum White Flow bonus.',
      effects: [
        { type: 'seas_current_gain' as unknown as 'oblivion_flat', value: 15 },
        { type: 'oblivion_flat' as const, value: 40 },
      ],
    },
    attacks: {
      primary: {
        id: 'tx-angel-sea-tidal-sovereign:primary',
        label: 'Primary' as const,
        name: 'Tidal Cant',
        description: '480 base Oblivion · 3 cards cooldown',
        baseOblivion: 480,
        cooldownCards: 3,
        costs: [],
        tags: ['angel', 'primary', 'seas', 'transcendent'],
      },
      exalted: {
        id: 'tx-angel-sea-tidal-sovereign:exalted',
        label: 'Exalted' as const,
        name: 'Ocean Apotheosis',
        description: '1050 base Oblivion · 6 cards cooldown',
        baseOblivion: 1050,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'exalted', 'seas', 'transcendent'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card' as const, bonusValue: 30 },
  },
  {
    definitionId: 'tx-angel-star-final-wish',
    type: 'Angel' as const,
    element: 'WishedUponAStar',
    rarity: 'Legendary' as const,
    name: 'The Final Wish Granted',
    description:
      'On summon: Grant 10 Starlight Charges and 60 Oblivion. ' +
      'After 5 cards played: All Starlight Charges deal 2× bonus damage until end of turn. ' +
      'While on board: +20 Oblivion each time a Starlight Charge is spent.',
    artKey: 'tx_angel_star_final_wish',
    summonCost: ['ser-star-lattice', 'ser-star-lattice'],
    onSummonEffects: [
      { type: 'oblivion_flat' as const, value: 60 },
    ],
    activatedAbility: {
      name: 'Starfall Omega',
      cardsPlayedRequirement: 5,
      description: 'All Starlight Charges deal 2× damage until end of turn.',
      effects: [{ type: 'oblivion_flat' as const, value: 50 }],
    },
    attacks: {
      primary: {
        id: 'tx-angel-star-final-wish:primary',
        label: 'Primary' as const,
        name: 'Final Hammer',
        description: '500 base Oblivion · 3 cards cooldown',
        baseOblivion: 500,
        cooldownCards: 3,
        costs: [],
        tags: ['angel', 'primary', 'star', 'transcendent'],
      },
      exalted: {
        id: 'tx-angel-star-final-wish:exalted',
        label: 'Exalted' as const,
        name: 'The Last Wish',
        description: '1200 base Oblivion · 7 cards cooldown',
        baseOblivion: 1200,
        cooldownCards: 7,
        costs: [],
        tags: ['angel', 'exalted', 'star', 'transcendent'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card' as const, bonusValue: 35 },
  },
  {
    definitionId: 'tx-angel-void-entropy-prime',
    type: 'Angel' as const,
    element: 'Dark',
    rarity: 'Legendary' as const,
    name: 'Entropy Prime',
    description:
      "On summon: Grant 70 Oblivion. The active boss's next 2 attacks deal 0 damage. " +
      'After 4 cards played: Reduce all Seraphim attack cooldowns to 0. ' +
      'While on board: +40 Oblivion per card played regardless of element.',
    artKey: 'tx_angel_void_entropy_prime',
    summonCost: ['ser-dark-null', 'ser-dark-null'],
    onSummonEffects: [{ type: 'oblivion_flat' as const, value: 70 }],
    activatedAbility: {
      name: 'Null Terminus',
      cardsPlayedRequirement: 4,
      description: 'Reduce all Seraphim attack cooldowns to 0.',
      effects: [{ type: 'oblivion_flat' as const, value: 60 }],
    },
    attacks: {
      primary: {
        id: 'tx-angel-void-entropy-prime:primary',
        label: 'Primary' as const,
        name: 'Void Hammer',
        description: '520 base Oblivion · 3 cards cooldown',
        baseOblivion: 520,
        cooldownCards: 3,
        costs: [],
        tags: ['angel', 'primary', 'dark', 'transcendent'],
      },
      exalted: {
        id: 'tx-angel-void-entropy-prime:exalted',
        label: 'Exalted' as const,
        name: 'Entropy Dominion',
        description: '1300 base Oblivion · 7 cards cooldown',
        baseOblivion: 1300,
        cooldownCards: 7,
        costs: [],
        tags: ['angel', 'exalted', 'dark', 'transcendent'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card' as const, bonusValue: 40 },
  },
];

// ── Exported collection ────────────────────────────────────────────────────
export const transcendentCardDefinitions: CardDefinition[] = [
  ...TX_SERAPHIM,
  ...TX_CHERUBIM,
  ...TX_OPHANIM,
  ...(TX_ANGELS as unknown as CardDefinition[]),
];

/** Ids of all Angel-type transcendents (drop-only, never purchasable). */
export const TRANSCENDENT_ANGEL_IDS: ReadonlySet<string> = new Set(
  TX_ANGELS.map(a => a.definitionId),
);

/** Ids of all shop-purchasable transcendents (Seraphim / Cherubim / Ophanim). */
export const TRANSCENDENT_SHOP_IDS: ReadonlySet<string> = new Set([
  ...TX_SERAPHIM.map(c => c.definitionId),
  ...TX_CHERUBIM.map(c => c.definitionId),
  ...TX_OPHANIM.map(c => c.definitionId),
]);