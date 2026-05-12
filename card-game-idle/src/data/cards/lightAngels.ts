import type { AngelDefinition } from '@/types/cards';

export const lightAngels: AngelDefinition[] = [
  {
    definitionId: 'angel-light-seraphiel',
    type: 'Angel',
    element: 'Light',
    rarity: 'Common',
    name: 'Seraphiel Embermane',
    description: 'Summon: sacrifice Dawnfire + Thornwatch. Gain 5 Radiance and draw 2. After 3 cards: right-click to double Radiance, draw 2, and set chain floor to ×1.8. While on board: +20 Oblivion per Seeker card played.',
    artKey: 'angel_light_seraphiel',
    summonCost: ['ser-light-dawn', 'ser-light-vigil'],
    onSummonEffects: [
      { type: 'radiance_gain', value: 5 },
      { type: 'draw', value: 2 },
    ],
    activatedAbility: {
      name: 'Canticle of First Flame',
      cardsPlayedRequirement: 3,
      description: 'Double your Radiance, draw 2 cards, and set chain floor to ×1.8.',
      effects: [
        { type: 'radiance_double' },
        { type: 'draw', value: 2 },
        { type: 'set_chain_floor', value: 1.8 },
      ],
    },
    baseStats: { basePower: 0, bonusType: 'seeker_bonus', bonusValue: 20 },
  },
  {
    definitionId: 'angel-light-aurelion',
    type: 'Angel',
    element: 'Light',
    rarity: 'Rare',
    name: 'Aurelion Thorncrowned',
    description: 'Summon: sacrifice Seraphiel Embermane + Emberchoir. Gain 8 Radiance, draw 2, and set chain floor to ×1.4. After 4 cards: right-click to double Radiance, draw 3, and gain +100 Oblivion. While on board: chain multiplier grows +0.06 faster per card played.',
    artKey: 'angel_light_aurelion',
    summonCost: ['angel-light-seraphiel', 'ser-light-choir'],
    onSummonEffects: [
      { type: 'radiance_gain', value: 8 },
      { type: 'draw', value: 2 },
      { type: 'set_chain_floor', value: 1.4 },
    ],
    activatedAbility: {
      name: 'Thorncrown Zenith',
      cardsPlayedRequirement: 4,
      description: 'Double your Radiance, draw 3 cards, and gain +100 Oblivion.',
      effects: [
        { type: 'radiance_double' },
        { type: 'draw', value: 3 },
        { type: 'oblivion_flat', value: 100 },
      ],
    },
    baseStats: { basePower: 0, bonusType: 'chain_bonus', bonusValue: 0.06 },
  },
  {
    definitionId: 'angel-light-solarius',
    type: 'Angel',
    element: 'Light',
    rarity: 'Legendary',
    name: 'Solarius, Emberthorn Ascendant',
    description: 'Summon: sacrifice Aurelion Thorncrowned + Thorncrown + Cinderherald. Gain 10 Radiance, draw 3, and set chain multiplier to ×1.8. After 5 cards: right-click to double Radiance, draw 3, empower the next card, and gain +150 Oblivion. While on board: +24 Oblivion per card played.',
    artKey: 'angel_light_solarius',
    summonCost: ['angel-light-aurelion', 'ser-light-throne', 'ser-light-herald'],
    onSummonEffects: [
      { type: 'radiance_gain', value: 10 },
      { type: 'draw', value: 3 },
      { type: 'chain_multiplier_set', value: 1.8 },
    ],
    activatedAbility: {
      name: 'Emberthorn Apotheosis',
      cardsPlayedRequirement: 5,
      description: 'Double your Radiance, draw 3 cards, empower the next card, and gain +150 Oblivion.',
      effects: [
        { type: 'radiance_double' },
        { type: 'draw', value: 3 },
        { type: 'multiply_next' },
        { type: 'oblivion_flat', value: 150 },
      ],
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 24 },
  },
];
