import type { SeraphimDefinition } from '@/types/cards';

export const lightSeraphims: SeraphimDefinition[] = [
  {
    definitionId: 'ser-light-dawn',
    type: 'Seraphim',
    element: 'Light',
    rarity: 'Common',
    name: 'Dawn Seraphim',
    description: 'On play: Gain 1 Radiance. In synergy: +15 Oblivion when you play a Seeker card.',
    artKey: 'ser_light_dawn',
    baseStats: { bonusType: 'seeker_bonus', bonusValue: 15, synergyRequirement: 'Light' },
    onPlayEffects: [
      { type: 'radiance_gain', value: 1 },
    ],
  },
  {
    definitionId: 'ser-light-vigil',
    type: 'Seraphim',
    element: 'Light',
    rarity: 'Common',
    name: 'Vigil Seraphim',
    description: 'On play: Draw 1 card. In synergy: +8 Oblivion per card played. Gain 1 Radiance when you play a Seeker card.',
    artKey: 'ser_light_vigil',
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 8, synergyRequirement: 'Light' },
    onPlayEffects: [
      { type: 'draw', value: 1 },
    ],
  },
  {
    definitionId: 'ser-light-choir',
    type: 'Seraphim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Choir Seraphim',
    description: 'On play: Draw 1 card. In synergy: chain multiplier grows +0.05 faster per card.',
    artKey: 'ser_light_choir',
    baseStats: { bonusType: 'chain_bonus', bonusValue: 0.05, synergyRequirement: 'Light' },
    onPlayEffects: [
      { type: 'draw', value: 1 },
    ],
  },
  {
    definitionId: 'ser-light-throne',
    type: 'Seraphim',
    element: 'Light',
    rarity: 'Rare',
    name: 'Throne Seraphim',
    description: 'On play: Gain 3 Radiance. In synergy: +12 Oblivion per card played, and all Radiance gains are doubled.',
    artKey: 'ser_light_throne',
    baseStats: { bonusType: 'oblivion_per_card', bonusValue: 12, synergyRequirement: 'Light' },
    onPlayEffects: [
      { type: 'radiance_gain', value: 3 },
    ],
  },
  {
    definitionId: 'ser-light-herald',
    type: 'Seraphim',
    element: 'Light',
    rarity: 'Epic',
    name: 'Herald Seraphim',
    description: 'On play: Gain 2 Radiance. In synergy: +25 Oblivion when you play a Seeker card.',
    artKey: 'ser_light_herald',
    baseStats: { bonusType: 'seeker_bonus', bonusValue: 25, synergyRequirement: 'Light' },
    onPlayEffects: [
      { type: 'radiance_gain', value: 2 },
    ],
  },
  {
    definitionId: 'ser-light-warden',
    type: 'Seraphim',
    element: 'Light',
    rarity: 'Epic',
    name: 'Warden Seraphim',
    description: 'On play: Gain Radiance equal to your current hand size. In synergy: chain multiplier grows +0.08 faster per card.',
    artKey: 'ser_light_warden',
    baseStats: { bonusType: 'chain_bonus', bonusValue: 0.08, synergyRequirement: 'Light' },
    onPlayEffects: [
      { type: 'radiance_gain', value: 0 },  // executor: hand size at time of play (ser-light-warden sentinel)
    ],
  },
];
