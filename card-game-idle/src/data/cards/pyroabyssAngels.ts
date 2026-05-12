import type { AngelDefinition } from '@/types/cards';

export const pyroabyssAngels: AngelDefinition[] = [
  {
    definitionId: 'angel-fire-cinderwing',
    type: 'Angel',
    element: 'Fire',
    rarity: 'Common',
    name: 'Cinderwing',
    description: 'Summon: sacrifice 2× Cinder Seraphim. Gain 7 Embers. While on board: +18 Oblivion per card played.',
    artKey: 'angel_fire_cinderwing',
    summonCost: ['ser-fire-cinder', 'ser-fire-cinder'],
    onSummonEffects: [
      { type: 'ember_gain', value: 7 },
    ],
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 18 },
  },
  {
    definitionId: 'angel-fire-pyroclast-wraith',
    type: 'Angel',
    element: 'Fire',
    rarity: 'Rare',
    name: 'Pyroclast Wraith',
    description: 'Summon: sacrifice Cinder + Infernal Seraphim. Gain 8 Embers. Draw 2 cards. While on board: chain multiplier grows +0.10 faster per card.',
    artKey: 'angel_fire_pyroclast_wraith',
    summonCost: ['ser-fire-cinder', 'ser-fire-infernal'],
    onSummonEffects: [
      { type: 'ember_gain', value: 8 },
      { type: 'draw', value: 2 },
    ],
    baseStats: { basePower: 0, bonusType: 'chain_bonus', bonusValue: 0.10 },
  },
  {
    definitionId: 'angel-fire-obliteron',
    type: 'Angel',
    element: 'Fire',
    rarity: 'Legendary',
    name: 'Obliteron',
    description: 'Summon: sacrifice Infernal + Void-Flame Seraphim. Requires 1+ active Chaos card. Gain 12 Embers. Draw 3 cards. Set chain floor to ×2.0. While on board: +38 Oblivion per card played.',
    artKey: 'angel_fire_obliteron',
    summonCost: ['ser-fire-infernal', 'ser-fire-voidflame'],
    extraSummonConditions: [
      { type: 'chaos_active_gte', value: 1 },
    ],
    onSummonEffects: [
      { type: 'ember_gain', value: 12 },
      { type: 'draw', value: 3 },
      { type: 'set_chain_floor', value: 2.0 },
    ],
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 38 },
  },
];
