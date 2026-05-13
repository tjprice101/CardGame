import type { AngelDefinition } from '@/types/cards';

export const mechanicalDreamsAngels: AngelDefinition[] = [
  {
    definitionId: 'md-angel-ori9-broken-sleep',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Legendary',
    name: 'ORI-9 Archon of Broken Sleep',
    description: 'A machine saint that severs destiny by overclocking the impossible.',
    artKey: 'md_angel_ori9_broken_sleep',
    summonCost: ['md-ser-dreamforge-lancer', 'md-ser-ivory-null-operator'],
    extraSummonConditions: [{ type: 'chaos_active_gte', value: 1 }],
    onSummonEffects: [
      { type: 'strain_gain', value: 1 },
      { type: 'draw', value: 1 },
      { type: 'set_chain_floor', value: 1.4 },
    ],
    activatedAbility: {
      name: 'Fatebreak Overclock',
      cardsPlayedRequirement: 4,
      description: 'Overclock: gain 2 Strain and +220 Oblivion, then vent 1 Strain.',
      effects: [
        { type: 'overclock', strain: 2, then: [{ type: 'oblivion_flat', value: 220 }] },
        { type: 'strain_vent', value: 1 },
      ],
    },
    baseStats: {
      basePower: 0,
      bonusType: 'oblivion_per_seraphim',
      bonusValue: 9,
    },
  },
  {
    definitionId: 'md-angel-thaumiel-prime',
    type: 'Angel',
    element: 'Mechanical',
    rarity: 'Legendary',
    name: 'THAUMIEL Prime Furnace of Unwritten Futures',
    description: 'An eternal engine born to end ordained timelines in yellow-white flame.',
    artKey: 'md_angel_thaumiel_prime',
    summonCost: ['md-ser-fate-sever-colossus', 'md-ser-pyrecoil-ascetic', 'md-ser-steel-hymn-executor'],
    extraSummonConditions: [{ type: 'chaos_active_gte', value: 2 }],
    onSummonEffects: [
      { type: 'strain_gain', value: 3 },
      { type: 'oblivion_flat', value: 180 },
      { type: 'set_chain_floor', value: 1.6 },
    ],
    activatedAbility: {
      name: 'Dream-Eater Cascade',
      cardsPlayedRequirement: 5,
      description: 'If Strain is 4 or more, gain +320 Oblivion. Then vent all Strain.',
      effects: [
        { type: 'conditional', condition: { type: 'strain_gte', value: 4 }, then: [{ type: 'oblivion_flat', value: 320 }] },
        { type: 'strain_vent', value: 9999 },
      ],
    },
    baseStats: {
      basePower: 0,
      bonusType: 'oblivion_per_card',
      bonusValue: 17,
    },
  },
];
