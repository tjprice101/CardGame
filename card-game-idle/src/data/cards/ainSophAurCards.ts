import type { AinSophAurDefinition } from '@/types/cards';

const artKeys = [
  'ain_soph_aur_neutrality_void',
  'ain_soph_aur_neutrality_axiom',
  'ain_soph_aur_neutrality_paradox',
  'ain_soph_aur_neutrality_stillness',
] as const;

const names = [
  'The White Null', 'The Axiom Below', 'The Paradox Crown', 'The Stillbreak',
] as const;

const rarities = ['Legendary', 'Legendary', 'Legendary', 'Legendary'] as const;

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
    description: `Sacrifice ${1 + (index % 3)} back-row card${1 + (index % 3) === 1 ? '' : 's'} to summon, then use Bridge the Light for a powerful Divine Light payout.`,
    artKey: artKeys[index],
    summonCost: Array.from({ length: 1 + (index % 3) }, () => `light-neutrality-${(index % 25) + 1}`),
    onSummonEffects: [{ type: 'oblivion_flat', value: 30 + index * 10 }],
    bridgeAttack: {
      id: `${id}:bridge-the-light`,
      name: 'Bridge the Light',
      description: `${baseOblivion} base Divine Light; +${bridgeScale} scaled across Limitless Light Stack pool, front-row Ain Soph Aur count, and Collection Power.`,
      baseOblivion,
      cooldownCards,
      scaling: { kind: 'triune', amount: bridgeScale },
      ...(index % 2 === 0 ? { consumesStacks: { kind: 'fixed' as const, value: 2 + index } } : {}),
    },
    attacks: {
      primary: {
        id: `${id}:bridge`, label: 'Primary', name: 'Bridge the Light',
        description: `${baseOblivion} base Divine Light`, baseOblivion, cooldownCards,
        tags: ['ain-soph-aur', 'bridge'],
      },
    },
    baseStats: { basePower: 20 + index * 5, bonusType: 'oblivion_per_card', bonusValue: 10 + index * 2 },
  };
});
