import type { SeekerDefinition, SeraphimDefinition, ChaosDefinition, AngelDefinition } from '@/types/cards';

export const eternalSeekerCards: SeekerDefinition[] = [
  {
    definitionId: 'btei-voids-reaping',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: "Void's Reaping",
    description: 'Draw 3 cards. Gain 5 of your dominant resource. Set the chain floor to ×2.0.',
    artKey: 'btei_voids_reaping',
    effects: [
      { type: 'draw', value: 3 },
      { type: 'dominant_stack_gain', value: 5 },
      { type: 'set_chain_floor', value: 2.0 },
    ],
  },
  {
    definitionId: 'btei-temporal-ruin',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Temporal Ruin',
    description: 'Draw 3 cards. Set the chain floor to ×5.0. +500 Oblivion.',
    artKey: 'btei_temporal_ruin',
    effects: [
      { type: 'draw', value: 3 },
      { type: 'set_chain_floor', value: 5.0 },
      { type: 'oblivion_flat', value: 500 },
    ],
  },
  {
    definitionId: 'btei-null-edict',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Null Edict',
    description: 'Draw 4 cards. Set the chain floor to ×6.0. +700 Oblivion.',
    artKey: 'btei_null_edict',
    effects: [
      { type: 'draw', value: 4 },
      { type: 'set_chain_floor', value: 6.0 },
      { type: 'oblivion_flat', value: 700 },
    ],
  },
  {
    definitionId: 'btei-axiom-of-oblivion',
    type: 'Seeker',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Axiom of Oblivion',
    description: 'Draw 5 cards. Set the chain floor to ×8.0. +1,000 Oblivion. Gain 20 of your dominant resource.',
    artKey: 'btei_axiom_of_oblivion',
    effects: [
      { type: 'draw', value: 5 },
      { type: 'set_chain_floor', value: 8.0 },
      { type: 'oblivion_flat', value: 1000 },
      { type: 'dominant_stack_gain', value: 20 },
    ],
  },
];

export const eternalSeraphimCards: SeraphimDefinition[] = [
  {
    definitionId: 'btei-eternal-vigil',
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Eternal Vigil',
    description: 'On play: +120 Oblivion. Draw 2 cards. Set the chain floor to ×2.0. In synergy: +50 Oblivion per card played.',
    artKey: 'btei_eternal_vigil',
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 50, synergyRequirement: 'Neutrality' },
    onPlayEffects: [
      { type: 'oblivion_flat', value: 120 },
      { type: 'draw', value: 2 },
      { type: 'set_chain_floor', value: 2.0 },
    ],
  },
  {
    definitionId: 'btei-colossus-advent',
    type: 'Seraphim',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Colossus Advent',
    description: 'On play: +350 Oblivion. Draw 4 cards. Set the chain floor to ×6.0. In synergy: +200 Oblivion per card played.',
    artKey: 'btei_colossus_advent',
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 200, synergyRequirement: 'Neutrality' },
    onPlayEffects: [
      { type: 'oblivion_flat', value: 350 },
      { type: 'draw', value: 4 },
      { type: 'set_chain_floor', value: 6.0 },
    ],
  },
];

export const eternalChaosCards: ChaosDefinition[] = [
  {
    definitionId: 'btei-sovereign-domain',
    type: 'Chaos',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Sovereign Domain',
    description: 'On play: +150 Oblivion. Draw 2 cards. While active: adjacent Seraphim in synergy gain +80 Oblivion per card played. On expiry: set the chain floor to ×3.0, then +150 Oblivion. Expires after 12 plays.',
    artKey: 'btei_sovereign_domain',
    maxDurability: 12,
    effects: [
      { type: 'chaos_oblivion_per_card', value: 80 },
    ],
    enthalpy: [
      { type: 'oblivion_flat', value: 150 },
      { type: 'draw', value: 2 },
    ],
    entropy: [
      { type: 'set_chain_floor', value: 3.0 },
      { type: 'oblivion_flat', value: 150 },
    ],
  },
  {
    definitionId: 'btei-architects-manifold',
    type: 'Chaos',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: "Architect's Manifold",
    description: 'On play: +250 Oblivion. Draw 3 cards. Set the chain floor to ×4.0. While active: adjacent Seraphim in synergy gain +110 Oblivion per card played and +0.05 to chain growth. On expiry: set the chain floor to ×4.5, then +250 Oblivion. Expires after 15 plays.',
    artKey: 'btei_architects_manifold',
    maxDurability: 15,
    effects: [
      { type: 'chaos_oblivion_per_card', value: 110 },
      { type: 'chaos_chain_bonus', value: 0.05 },
    ],
    enthalpy: [
      { type: 'oblivion_flat', value: 250 },
      { type: 'draw', value: 3 },
      { type: 'set_chain_floor', value: 4.0 },
    ],
    entropy: [
      { type: 'set_chain_floor', value: 4.5 },
      { type: 'oblivion_flat', value: 250 },
    ],
  },
];

export const eternalAngels: AngelDefinition[] = [
  {
    definitionId: 'btei-convergence-of-eternity',
    type: 'Angel',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Convergence of Eternity',
    description: 'Summon: requires 2+ Seraphim on the board (no sacrifice). Gain 15 of your dominant resource. Draw 4 cards. Set the chain floor to ×3.5. While on board: +130 Oblivion per card played.',
    artKey: 'btei_convergence_of_eternity',
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 2 },
    ],
    onSummonEffects: [
      { type: 'dominant_stack_gain', value: 15 },
      { type: 'draw', value: 4 },
      { type: 'set_chain_floor', value: 3.5 },
    ],
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 130 },
  },
  {
    definitionId: 'btei-omniscient-fracture',
    type: 'Angel',
    element: 'Neutrality',
    rarity: 'Eternal',
    name: 'Omniscient Fracture',
    description: 'Summon: requires 3+ Seraphim on the board (no sacrifice). Gain 20 of your dominant resource. Draw 5 cards. Set the chain floor to ×5.5. While on board: +200 Oblivion per card played.',
    artKey: 'btei_omniscient_fracture',
    summonCost: [],
    extraSummonConditions: [
      { type: 'seraphim_on_board_gte', value: 3 },
    ],
    onSummonEffects: [
      { type: 'dominant_stack_gain', value: 20 },
      { type: 'draw', value: 5 },
      { type: 'set_chain_floor', value: 5.5 },
    ],
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 200 },
  },
];

export const eternalCards = [
  ...eternalSeekerCards,
  ...eternalSeraphimCards,
  ...eternalChaosCards,
  ...eternalAngels,
];
