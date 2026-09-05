import type { OphanimDefinition, SeraphimDefinition, CherubimDefinition, AngelDefinition } from '@/types/cards';

// Combination recipe system
// Each Infinite card is forged by consuming exact copies of specific Eternal cards.

export interface InfiniteIngredient {
  definitionId: string; // Eternal card definitionId to consume
  count: number;        // how many copies to consume
}

export interface InfiniteRecipe {
  resultId: string;           // Infinite card definitionId produced
  ingredients: InfiniteIngredient[];
  lore: string;               // flavour shown in the Infinitude menu
}

// 27 Infinite cards

// Ophanims (3)

export const infiniteOphanimCards: OphanimDefinition[] = [
  {
    definitionId: 'inf-oblivion-absolute',
    type: 'Ophanim',
    rarity: 'Infinite',
    name: 'Oblivion Absolute',
    description: 'Gain Oblivion scaled by total Patience and peak Patience; All Seraphim on board gain +15 Patience; All Seraphim on board gain +2 Patience',
    artKey: 'inf_oblivion_absolute',
    effects: [
      { type: 'oblivion_flat', value: 6000 },
      { type: 'patience_gain_all', value: 26 },
      { type: 'patience_gain_all', value: 4 }],
  },
  {
    definitionId: 'inf-void-cascade',
    type: 'Ophanim',
    rarity: 'Infinite',
    name: 'Void Cascade',
    description: 'All Seraphim on board gain +25 Patience; All Seraphim on board gain +1 Patience',
    artKey: 'inf_void_cascade',
    effects: [
      { type: 'oblivion_flat', value: 0 },
      { type: 'patience_gain_all', value: 13 },
      { type: 'patience_gain_all', value: 3 }],
  },
];

export const infiniteSeraphimCards: SeraphimDefinition[] = [
  {
    definitionId: 'inf-genesis-throne',
    type: 'Seraphim',
    rarity: 'Infinite',
    name: 'Genesis Throne',
    description: 'On play: Gain Oblivion scaled by total Patience, peak Patience, engine signatures, and setup count. While on board: +730 Oblivion per card played while active. Patience: +1 stack per card played; on attack, each stack ↁE+15 Oblivion',

    artKey: 'inf_genesis_throne',
    attacks: {
      unsynergized: {
        id: 'inf-genesis-throne:unsynergized',
        label: 'Unsynergized',
        name: 'Genesis Throne Vector Break',
        description: '7600 base Oblivion · 6 cards cooldown',
        baseOblivion: 7600,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'neutrality'],
      },
      synergized: {
        id: 'inf-genesis-throne:synergized',
        label: 'Synergized',
        name: 'Genesis Throne Angelic Verdict',
        description: '10640 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 10640,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'neutrality'],
      },
    },
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 760},
    patienceThreshold: 8,
    onPlayEffects: [
      { type: 'oblivion_flat', value: 2400 },
      { type: 'patience_gain_all', value: 9 },
      { type: 'patience_gain_all', value: 2 }],
  },
  {
    definitionId: 'inf-null-apex',
    type: 'Seraphim',
    rarity: 'Infinite',
    name: 'Null Apex',
    description: 'While on board: +2000 Oblivion whenever you play an Ophanim while active. Patience: +1 stack per card played; on attack, each stack ↁE+15 Oblivion',

    artKey: 'inf_null_apex',
    attacks: {
      unsynergized: {
        id: 'inf-null-apex:unsynergized',
        label: 'Unsynergized',
        name: 'Null Apex Vector Break',
        description: '6840 base Oblivion · 6 cards cooldown',
        baseOblivion: 6840,
        cooldownCards: 6,
        costs: [],
        tags: ['seraphim', 'unsynergized', 'neutrality'],
      },
      synergized: {
        id: 'inf-null-apex:synergized',
        label: 'Synergized',
        name: 'Null Apex Angelic Verdict',
        description: '13800 base Oblivion · 7 cards cooldown · Requires Angel',
        baseOblivion: 13800,
        cooldownCards: 7,
        costs: [],
        requiresAngelOnBoard: true,
        tags: ['seraphim', 'synergized', 'neutrality'],
      },
    },
    baseStats: { bonusType: 'ophanim_bonus', bonusValue: 1100},
    patienceThreshold: 8,
    onPlayEffects: [
      { type: 'patience_gain_all', value: 12 },
      { type: 'patience_gain_all', value: 2 },
      { type: 'oblivion_flat', value: 1100 }],
  },
];

export const infiniteCherubimCards: CherubimDefinition[] = [
  {
    definitionId: 'inf-entropic-crown',
      type: 'Cherubim',
    rarity: 'Infinite',
    name: 'Entropic Crown',
      description: 'On play: Gain Oblivion scaled by Patience-bearing units and total Patience; All Seraphim on board gain +8 Patience; Double all Patience on the board; All Seraphim on board gain +2 Patience. While on board: Adjacent Seraphim and Angels gain +8 Patience per card played',
    artKey: 'inf_entropic_crown',
      effects: [{ type: 'cherubim_patience_per_card', value: 6 }],
      onPlayEffects: [{ type: 'oblivion_flat', value: 2600 }, { type: 'patience_gain_all', value: 6 }, { type: 'patience_gain_all', value: 1 }],
  },
  {
    definitionId: 'inf-annihilation-field',
      type: 'Cherubim',
    rarity: 'Infinite',
    name: 'Annihilation Field',
      description: 'On play: All Seraphim on board gain +14 Patience; All Seraphim on board gain +3 Patience; Shuffle discard into deck; Gain Oblivion scaled by cross-set conversion sources and peak Patience. While on board: Adjacent Seraphim and Angels gain +4 Patience per card played',
    artKey: 'inf_annihilation_field',
      effects: [{ type: 'cherubim_patience_per_card', value: 5 }],
      onPlayEffects: [{ type: 'patience_gain_all', value: 10 }, { type: 'patience_gain_all', value: 2 }],
  },
];

export const infiniteAngelCards: AngelDefinition[] = [
  {
    definitionId: 'inf-sovereign-void',
    type: 'Angel',
    rarity: 'Infinite',
    name: 'Sovereign Void',
    description: 'On summon: All Seraphim gain +20 Patience and gain Oblivion from total and peak Patience. After 4 cards: gain +4 and +14 Patience, double Patience, draw 2, and repeat the Patience-scaled Oblivion gain. While on board: +950 Oblivion for each Seraphim. Unlocks Null Sovereign\'s Decree (replaces Slot 3).',
    artKey: 'inf_sovereign_void',
    signatureAbility: { id: 'neutrality-signature-null-sovereigns-decree', name: "Null Sovereign's Decree", replacesSlot: 3 },
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 3 }],
    onSummonEffects: [
      { type: 'patience_gain_all', value: 24 }],
    activatedAbility: {
      name: 'Null Dominion',
      cardsPlayedRequirement: 4,
      description: 'All Seraphim on board gain +4 Patience; Double all Patience on the board; All Seraphim on board gain +14 Patience; Draw 2 cards; Gain Oblivion scaled by total Patience and peak Patience',
      effects: [
        { type: 'patience_gain_all', value: 3 },
        { type: 'patience_double_all' },
        { type: 'patience_gain_all', value: 10 },
        { type: 'oblivion_flat', value: 2800 }],
    },
    attacks: {
      primary: {
        id: 'inf-sovereign-void:primary',
        label: 'Primary',
        name: 'Sovereign Void Ordinance',
        description: '3017 base Oblivion · 6 cards cooldown',
        baseOblivion: 3017,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'neutrality'],
      },
      exalted: {
        id: 'inf-sovereign-void:exalted',
        label: 'Exalted',
        name: 'Sovereign Void Throne Decree',
        description: '8299 base Oblivion · 9 cards cooldown',
        baseOblivion: 8299,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'neutrality'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 420 },
  },
  {
    definitionId: 'inf-eternity-rupture',
    type: 'Angel',
    rarity: 'Infinite',
    name: 'Eternity Rupture',
    description: 'On summon: All Seraphim gain +16 and +2 Patience; shuffle the discard into the deck. After 6 cards: gain +2 and +18 Patience, shuffle, salvage 1 card, and gain Patience-scaled Oblivion. While on board: +1450 Oblivion whenever you play an Ophanim. Unlocks Ruptured Continuum (replaces Slot 3).',
    artKey: 'inf_eternity_rupture',
    signatureAbility: { id: 'neutrality-signature-ruptured-continuum', name: 'Ruptured Continuum', replacesSlot: 3 },
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 2 },
      { type: 'cherubim_active_gte', value: 2 }],
    onSummonEffects: [
      { type: 'patience_gain_all', value: 16 },
      { type: 'patience_gain_all', value: 2 },
      { type: 'shuffle_discard' },
      { type: 'oblivion_flat', value: 1800 }],
    activatedAbility: {
      name: 'Rupture Convergence',
      cardsPlayedRequirement: 5,
      description: 'All Seraphim on board gain +2 Patience; All Seraphim on board gain +18 Patience; Shuffle discard into deck; Salvage any 1 card; Gain Oblivion scaled by Patience-bearing units, conversion sources, and peak Patience',
      effects: [
        { type: 'patience_gain_all', value: 3 },
        { type: 'patience_gain_all', value: 8 },
        { type: 'oblivion_flat', value: 2600 }],
    },
    attacks: {
      primary: {
        id: 'inf-eternity-rupture:primary',
        label: 'Primary',
        name: 'Eternity Rupture Ordinance',
        description: '3169 base Oblivion · 6 cards cooldown',
        baseOblivion: 3169,
        cooldownCards: 6,
        costs: [],
        tags: ['angel', 'primary', 'neutrality'],
      },
      exalted: {
        id: 'inf-eternity-rupture:exalted',
        label: 'Exalted',
        name: 'Eternity Rupture Throne Decree',
        description: '8717 base Oblivion · 9 cards cooldown',
        baseOblivion: 8717,
        cooldownCards: 9,
        costs: [],
        tags: ['angel', 'exalted', 'neutrality'],
      },
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 500 },
  },
];

export const infiniteCards: Array<OphanimDefinition | SeraphimDefinition | CherubimDefinition | AngelDefinition> = [
  ...infiniteOphanimCards,
  ...infiniteSeraphimCards,
  ...infiniteCherubimCards,
  ...infiniteAngelCards,
];

// Combination recipes


export const INFINITE_RECIPES: InfiniteRecipe[] = [
  {
    resultId: 'inf-oblivion-absolute',
    lore: 'When the four axioms of annihilation converge, nothing remains but the absolute void.',
    ingredients: [
      { definitionId: 'btei-axiom-of-oblivion', count: 1 },
      { definitionId: 'btei-null-edict', count: 1 },
      { definitionId: 'btei-temporal-ruin', count: 1 },
      { definitionId: 'btei-voids-reaping', count: 1 },
      { definitionId: 'btei-neutrality-zero-edict', count: 1 }],
  },
  {
    resultId: 'inf-void-cascade',
    lore: 'Time rewound past its first breath, pouring endlessly into itself.',
    ingredients: [
      { definitionId: 'btei-temporal-ruin', count: 2 },
      { definitionId: 'btei-voids-reaping', count: 1 },
      { definitionId: 'btei-architects-manifold', count: 1 },
      { definitionId: 'btei-convergence-of-eternity', count: 1 }],
  },
  {
    resultId: 'inf-genesis-throne',
    lore: 'Before the first star, before even the void, the Throne already sat.',
    ingredients: [
      { definitionId: 'btei-colossus-advent', count: 2 },
      { definitionId: 'btei-eternal-vigil', count: 1 },
      { definitionId: 'btei-omniscient-fracture', count: 1 },
      { definitionId: 'btei-convergence-of-eternity', count: 1 },
      { definitionId: 'btei-sovereign-domain', count: 1 }],
  },
  {
    resultId: 'inf-null-apex',
    lore: 'The apex of nothingness: a point so empty it bends all realities inward.',
    ingredients: [
      { definitionId: 'btei-neutrality-void-throne', count: 1 },
      { definitionId: 'btei-architects-manifold', count: 1 },
      { definitionId: 'btei-null-edict', count: 1 },
      { definitionId: 'btei-axiom-of-oblivion', count: 1 },
      { definitionId: 'btei-sovereign-domain', count: 1 }],
  },
  {
    resultId: 'inf-entropic-crown',
    lore: 'To wear entropy is to command it; the crown does not decay, it unmakes.',
    ingredients: [
      { definitionId: 'btei-architects-manifold', count: 2 },
      { definitionId: 'btei-sovereign-domain', count: 1 },
      { definitionId: 'btei-neutrality-zero-edict', count: 1 },
      { definitionId: 'btei-null-edict', count: 1 }],
  },
  {
    resultId: 'inf-annihilation-field',
    lore: 'In the field of annihilation, even the concept of opposition ceases.',
    ingredients: [
      { definitionId: 'btei-neutrality-zero-edict', count: 2 },
      { definitionId: 'btei-sovereign-domain', count: 1 },
      { definitionId: 'btei-voids-reaping', count: 1 },
      { definitionId: 'btei-axiom-of-oblivion', count: 1 },
      { definitionId: 'btei-temporal-ruin', count: 1 }],
  },
  {
    resultId: 'inf-sovereign-void',
    lore: 'No court. No subjects. Only dominion absolute and the silence of a conquered cosmos.',
    ingredients: [
      { definitionId: 'btei-omniscient-fracture', count: 2 },
      { definitionId: 'btei-convergence-of-eternity', count: 1 },
      { definitionId: 'btei-neutrality-void-throne', count: 1 },
      { definitionId: 'btei-sovereign-domain', count: 1 },
      { definitionId: 'btei-architects-manifold', count: 1 }],
  },
  {
    resultId: 'inf-eternity-rupture',
    lore: 'The seam between eternities split, and from it emerged something that predated both.',
    ingredients: [
      { definitionId: 'btei-convergence-of-eternity', count: 2 },
      { definitionId: 'btei-sovereign-domain', count: 1 },
      { definitionId: 'btei-temporal-ruin', count: 1 },
      { definitionId: 'btei-omniscient-fracture', count: 1 }],
  },
];
