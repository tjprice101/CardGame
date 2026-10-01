import type { AinSophAurDefinition, SpectrumLevel } from '@/types/cards';
import {
  formatSpectrumNumber,
  getSpectrumBridgeBase,
  getSpectrumFlatDivineLight,
  getSpectrumScaling,
} from './spectrumPower';

const artKeys = [
  'ain_soph_aur_neutrality_void',
  'ain_soph_aur_neutrality_axiom',
  'ain_soph_aur_neutrality_paradox',
  'ain_soph_aur_neutrality_stillness',
] as const;

const names = [
  'The White Null', 'The Axiom Below', 'The Paradox Crown', 'The Stillbreak',
] as const;

// The White Null is the starter Extra Deck card, so it stays summonable at Spectrum Level 0.
const levels: readonly SpectrumLevel[] = [0, 1, 3, 4];

export const ainSophAurCards: AinSophAurDefinition[] = names.map((name, index) => {
  const id = `ain-soph-aur-neutrality-${index + 1}`;
  const level = levels[index]!;
  const baseDivineLight = getSpectrumBridgeBase('Legendary', level, 'base');
  const summonDivineLight = getSpectrumFlatDivineLight('Legendary', level, 'base', 0.15);
  const cooldownCards = 2 + (index % 5);
  const materialCount = 1 + (index % 3);
  return {
    definitionId: id,
    type: 'AinSophAur',
    rarity: 'Legendary',
    spectrumLevel: level,
    name,
    description: `Sacrifice ${materialCount} back-row card${materialCount === 1 ? '' : 's'} to summon and gain ${formatSpectrumNumber(summonDivineLight)} Divine Light, then use Bridge the Light for a Collection Power-scaled Divine Light payout.`,
    artKey: artKeys[index],
    summonMaterialCount: materialCount,
    summonMaterials: index === 0
      ? [{ cardTypes: ['Light'], side: 'ain', count: 1 }]
      : index === 1
        ? [{ cardTypes: ['Light'], count: 1 }, { cardTypes: ['Dark'], count: 1 }]
        : index === 2
          ? [{ cardTypes: ['Light'], count: 2 }, { cardTypes: ['Dark'], count: 1 }]
          : [{ cardTypes: ['Light'], side: 'ain', count: 1 }],
    onSummonEffects: [{ type: 'divine_light_flat', value: summonDivineLight }],
    bridgeAttack: {
      id: `${id}:bridge-the-light`,
      name: 'Bridge the Light',
      description: `${formatSpectrumNumber(baseDivineLight)} base Divine Light; scales with Collection Power.`,
      baseDivineLight,
      cooldownCards,
      scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(baseDivineLight) },
      ...(index % 2 === 0 ? { consumesStacks: { kind: 'fixed' as const, value: 2 + index } } : {}),
    },
  };
});
