import type { AngelDefinition } from '@/types/cards';

export const pyroabyssAngels: AngelDefinition[] = [
  {
    definitionId: 'angel-fire-cinderwing',
    type: 'Angel',
    element: 'Fire',
    rarity: 'Common',
    name: 'Cinderwing',
    description: 'Summon: sacrifice 2× Cinder. Gain 8 Embers, draw 2, and gain +80 Oblivion. After 3 cards: right-click to gain 12 Embers, draw 2, and set chain floor to ×1.8. While on board: +20 Oblivion per card played.',
    artKey: 'angel_fire_cinderwing',
    summonCost: ['ser-fire-cinder', 'ser-fire-cinder'],
    onSummonEffects: [
      { type: 'ember_gain', value: 8 },
      { type: 'draw', value: 2 },
      { type: 'oblivion_flat', value: 80 },
    ],
    activatedAbility: {
      name: 'Ashen Wingbeat',
      cardsPlayedRequirement: 3,
      description: 'Gain 12 Embers, draw 2 cards, and set chain floor to ×1.8.',
      effects: [
        { type: 'ember_gain', value: 12 },
        { type: 'draw', value: 2 },
        { type: 'set_chain_floor', value: 1.8 },
      ],
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 20 },
  },
  {
    definitionId: 'angel-fire-pyroclast-wraith',
    type: 'Angel',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Pyroclast Wraith',
    description: 'Summon: sacrifice Cinderwing + Infernal. Gain 10 Embers, draw 2, and gain +120 Oblivion. After 4 cards: right-click to gain 14 Embers, draw 3, and gain +180 Oblivion. While on board: chain multiplier grows +0.11 faster per card.',
    artKey: 'angel_fire_pyroclast_wraith',
    summonCost: ['angel-fire-cinderwing', 'ser-fire-infernal'],
    onSummonEffects: [
      { type: 'ember_gain', value: 10 },
      { type: 'draw', value: 2 },
      { type: 'oblivion_flat', value: 120 },
    ],
    activatedAbility: {
      name: 'Magma Ascension',
      cardsPlayedRequirement: 4,
      description: 'Gain 16 Embers, draw 3 cards, and gain +220 Oblivion.',
      effects: [
        { type: 'ember_gain', value: 14 },
        { type: 'draw', value: 3 },
        { type: 'oblivion_flat', value: 180 },
      ],
    },
    baseStats: { basePower: 0, bonusType: 'chain_bonus', bonusValue: 0.11 },
  },
  {
    definitionId: 'angel-fire-obliteron',
    type: 'Angel',
    element: 'Fire',
    rarity: 'Legendary',
    name: 'Obliteron',
    description: 'Summon: sacrifice Pyroclast Wraith + Void-Flame. Requires 1+ active Chaos card. Gain 14 Embers, draw 3, set chain floor to ×2.1, and gain +120 Oblivion. After 5 cards: right-click to gain 18 Embers, draw 3, set chain floor to ×2.7, and gain +300 Oblivion. While on board: +36 Oblivion per card played.',
    artKey: 'angel_fire_obliteron',
    summonCost: ['angel-fire-pyroclast-wraith', 'ser-fire-voidflame'],
    extraSummonConditions: [
      { type: 'chaos_active_gte', value: 1 },
    ],
    onSummonEffects: [
      { type: 'ember_gain', value: 14 },
      { type: 'draw', value: 3 },
      { type: 'set_chain_floor', value: 2.1 },
      { type: 'oblivion_flat', value: 120 },
    ],
    activatedAbility: {
      name: 'Cataclysm Engine',
      cardsPlayedRequirement: 5,
      description: 'Gain 18 Embers, draw 3 cards, set chain floor to ×2.7, and gain +300 Oblivion.',
      effects: [
        { type: 'ember_gain', value: 18 },
        { type: 'draw', value: 3 },
        { type: 'set_chain_floor', value: 2.7 },
        { type: 'oblivion_flat', value: 300 },
      ],
    },
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 36 },
  },
];
