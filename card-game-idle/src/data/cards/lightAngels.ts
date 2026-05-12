import type { AngelDefinition } from '@/types/cards';

export const lightAngels: AngelDefinition[] = [
  {
    definitionId: 'angel-light-seraphiel',
    type: 'Angel',
    element: 'Light',
    rarity: 'Common',
    name: 'Seraphiel',
    description: 'Summon: sacrifice Dawn + Vigil Seraphim. Gain 5 Radiance. While on board: +28 Oblivion per Seeker card played.',
    artKey: 'angel_light_seraphiel',
    summonCost: ['ser-light-dawn', 'ser-light-vigil'],
    onSummonEffects: [{ type: 'radiance_gain', value: 5 }],
    baseStats: { basePower: 0, bonusType: 'seeker_bonus', bonusValue: 28 },
  },
  {
    definitionId: 'angel-light-aurelion',
    type: 'Angel',
    element: 'Light',
    rarity: 'Rare',
    name: 'Aurelion the Gilded',
    description: 'Summon: sacrifice Dawn + Choir Seraphim. Gain 8 Radiance. While on board: chain multiplier grows +0.10 faster per card played.',
    artKey: 'angel_light_aurelion',
    summonCost: ['ser-light-dawn', 'ser-light-choir'],
    onSummonEffects: [{ type: 'radiance_gain', value: 8 }],
    baseStats: { basePower: 0, bonusType: 'chain_bonus', bonusValue: 0.10 },
  },
  {
    definitionId: 'angel-light-solarius',
    type: 'Angel',
    element: 'Light',
    rarity: 'Legendary',
    name: 'Solarius, Dawnbringer',
    description: 'Summon: sacrifice Throne + Warden + Herald Seraphim. Gain 12 Radiance. Draw 1 card. While on board: +38 Oblivion per card played.',
    artKey: 'angel_light_solarius',
    summonCost: ['ser-light-throne', 'ser-light-warden', 'ser-light-herald'],
    onSummonEffects: [
      { type: 'radiance_gain', value: 12 },
      { type: 'draw', value: 1 },
    ],
    baseStats: { basePower: 0, bonusType: 'oblivion_per_card', bonusValue: 38 },
  },
];
