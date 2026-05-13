import type { AngelDefinition } from '@/types/cards';

export const prismaticAccordAngels: AngelDefinition[] = [
  {
    definitionId: 'pa-angel-aurelith-ninth-beam',
    type: 'Angel',
    element: 'Prismatic',
    rarity: 'Legendary',
    name: 'Aurelith Seer of the Ninth Beam',
    description: 'A still-light herald whose frozen plumage holds one future in perfect suspension.',
    artKey: 'pa_angel_aurelith_ninth_beam',
    summonCost: ['pa-ser-stormmemory-veltharion', 'pa-ser-mirrorback-mirshan'],
    extraSummonConditions: [{ type: 'chaos_active_gte', value: 1 }],
    onSummonEffects: [
      { type: 'draw', value: 2 },
      { type: 'look_top_take', look: 4, take: 1 },
      { type: 'set_chain_floor', value: 1.45 },
    ],
    activatedAbility: {
      name: 'Frozen Future',
      cardsPlayedRequirement: 4,
      description: 'Set chain multiplier to 2.1, salvage 1 card, and draw 1.',
      effects: [
        { type: 'chain_multiplier_set', value: 2.1 },
        { type: 'salvage_any' },
        { type: 'draw', value: 1 },
      ],
    },
    baseStats: {
      basePower: 0,
      bonusType: 'oblivion_per_seraphim',
      bonusValue: 8,
    },
  },
  {
    definitionId: 'pa-angel-vorthum-whitebeam-arbiter',
    type: 'Angel',
    element: 'Prismatic',
    rarity: 'Legendary',
    name: 'Vorthum Whitebeam Arbiter',
    description: 'The white beam given judgmental form, where every reflected oath is remembered forever.',
    artKey: 'pa_angel_vorthum_whitebeam_arbiter',
    summonCost: ['pa-ser-goldvein-ancestor', 'pa-ser-veilstep-drossken', 'pa-ser-plainshush-drossken'],
    extraSummonConditions: [{ type: 'chaos_active_gte', value: 2 }],
    onSummonEffects: [
      { type: 'draw', value: 2 },
      { type: 'oblivion_flat', value: 170 },
      { type: 'set_chain_floor', value: 1.6 },
    ],
    activatedAbility: {
      name: 'Accord Without End',
      cardsPlayedRequirement: 5,
      description: 'Set chain multiplier to 2.4, multiply your next card, and salvage 1 card.',
      effects: [
        { type: 'chain_multiplier_set', value: 2.4 },
        { type: 'multiply_next' },
        { type: 'salvage_any' },
      ],
    },
    baseStats: {
      basePower: 0,
      bonusType: 'oblivion_per_card',
      bonusValue: 16,
    },
  },
];
