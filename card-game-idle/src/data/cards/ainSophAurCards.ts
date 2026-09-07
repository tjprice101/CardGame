import type { AinSophAurDefinition } from '@/types/cards';

const artKeys = [
  'ain_soph_aur_neutrality_void',
  'ain_soph_aur_neutrality_axiom',
  'ain_soph_aur_neutrality_paradox',
  'ain_soph_aur_neutrality_stillness',
  'ain_soph_aur_neutrality_horizon',
  'ain_soph_aur_neutrality_crown',
  'ain_soph_aur_neutrality_veil',
  'ain_soph_aur_neutrality_mirror',
  'ain_soph_aur_neutrality_gate',
  'ain_soph_aur_neutrality_well',
  'ain_soph_aur_neutrality_sun',
  'ain_soph_aur_neutrality_origin',
] as const;

const names = [
  'The White Null', 'The Axiom Below', 'The Paradox Crown',
  'The Stillbreak', 'The Horizon of Silence', 'The Veil of Dawn',
  'The Mirror of Ash', 'The Gate of Inevitable', 'The Hollow Well',
  'The Sun Without Flame', 'The Last Aurora', 'The Infinite Origin',
] as const;

const rarities = ['Legendary', 'Legendary', 'Legendary', 'Legendary', 'Eternal', 'Eternal', 'Eternal', 'Eternal', 'Infinite', 'Infinite', 'Infinite', 'Infinite'] as const;

export const ainSophAurCards: AinSophAurDefinition[] = names.map((name, index) => {
  const id = `ain-soph-aur-neutrality-${index + 1}`;
  const baseOblivion = 320 + index * 95;
  const cooldownCards = 2 + (index % 5);
  const bridgeScale = 240 + index * 45;
  return {
    definitionId: id,
    type: 'AinSophAur',
    rarity: rarities[index],
    name,
    description: `Ain Soph Aur Extra Deck. Sacrifice ${1 + (index % 3)} back-row card${1 + (index % 3) === 1 ? '' : 's'} to summon. Bridge the Light: ${baseOblivion} base Oblivion, +${bridgeScale} scaled evenly across Limitless Light Stacks, summoned Ain Soph Aur, and Collection Power; ${cooldownCards}-play cooldown.`,
    artKey: artKeys[index],
    summonCost: Array.from({ length: 1 + (index % 3) }, () => `light-neutrality-${(index % 25) + 1}`),
    onSummonEffects: [{ type: 'oblivion_flat', value: 30 + index * 10 }],
    bridgeAttack: {
      id: `${id}:bridge-the-light`,
      name: 'Bridge the Light',
      description: `${baseOblivion} base Oblivion; +${bridgeScale} scaled evenly across Limitless Light Stacks, summoned Ain Soph Aur, and Collection Power.`,
      baseOblivion,
      cooldownCards,
      scaling: { kind: 'triune', amount: bridgeScale },
      ...(index % 2 === 0 ? { consumesStacks: { kind: 'fixed' as const, value: 2 + index } } : {}),
    },
    attacks: {
      primary: {
        id: `${id}:bridge`, label: 'Primary', name: 'Bridge the Light',
        description: `${baseOblivion} base Oblivion`, baseOblivion, cooldownCards,
        tags: ['ain-soph-aur', 'bridge'],
      },
    },
    baseStats: { basePower: 20 + index * 5, bonusType: 'oblivion_per_card', bonusValue: 10 + index * 2 },
  };
});
