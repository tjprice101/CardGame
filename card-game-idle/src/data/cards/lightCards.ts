import type { LightCardDefinition } from '@/types/cards';
import type { CardEffect } from '@/types/effects';

const lightNames = [
  'Lumen Stag', 'Glasswing Sentinel', 'Dawn Warden', 'Nullfire Seraph', 'Axiom Herald',
  'Stillwater Colossus', 'Horizon Lion', 'Crown of Morning', 'Veilbreaker', 'First Radiance',
  'White Orchard Keeper', 'Paradox Knight', 'Solar Cantor', 'Pale Star Drake', 'Measure of Dawn',
  'Equilibrium Titan', 'Lucent Pilgrim', 'Ain-Bound Guardian', 'Quiet Sun', 'Origin Bearer',
  'Mirror Saint', 'Lightwell Watcher', 'Celestial Null', 'Last Horizon',
] as const;

const artKeys = [
  'ser_neutral_null', 'ser_neutral_void', 'ser_neutral_balance', 'ser_neutral_equilibrium',
  'ser_neutral_null', 'ser_neutral_void', 'ser_neutral_balance', 'ser_neutral_equilibrium', 'ser_neutral_still',
  'ser_neutral_null', 'ser_neutral_void', 'ser_neutral_balance', 'ser_neutral_equilibrium', 'ser_neutral_still',
  'ser_neutral_null', 'ser_neutral_void', 'ser_neutral_balance', 'ser_neutral_equilibrium', 'ser_neutral_still',
  'ser_neutral_null', 'ser_neutral_void', 'ser_neutral_balance', 'ser_neutral_equilibrium', 'ser_neutral_still',
] as const;

export const lightCards: LightCardDefinition[] = lightNames.map((name, index) => {
  const id = `light-neutrality-${index + 1}`;
  const ainBase = 70 + index * 28;
  const sophBase = 110 + index * 42;
  const ainScale = 60 + (index % 6) * 15;
  const sophScale = 110 + (index % 7) * 20;
  const sophPlacementPatterns: CardEffect[][] = [
    [{ type: 'oblivion_flat', value: 5 + index * 3 }, { type: 'draw', value: 1 }],
    [{ type: 'oblivion_flat', value: 5 + index * 3 }, { type: 'shuffle_discard' }],
    [{ type: 'oblivion_flat', value: 5 + index * 3 }, { type: 'discard_draw', discard: 1, draw: 1 }],
    [{ type: 'oblivion_flat', value: 5 + index * 3 }, { type: 'look_top_take', look: 2, take: 1 }],
    [{ type: 'oblivion_flat', value: 5 + index * 3 }, { type: 'look_top_take_type', look: 2, filter: ['Light'], take: 1 }],
    [{ type: 'oblivion_flat', value: 5 + index * 3 }, { type: 'salvage_by_type_count', filter: ['Light'], count: 1 }],
  ];
  const sophPlacementEffects = sophPlacementPatterns[index % 6];
  return {
    definitionId: id,
    type: 'Light',
    rarity: index < 8 ? 'Common' : index < 15 ? 'Rare' : index < 21 ? 'Epic' : index < 24 ? 'Legendary' : 'Eternal',
    name,
    description: `Use Ain Attack for a steady Divine Light payout or spend Limitless Light Stacks on Soph Attack for a stronger burst.`,
    artKey: artKeys[index],
    ainAttack: {
      id: `${id}:ain-attack`, label: 'Ain', name: 'Ain Attack',
      description: `${ainBase} base Divine Light; +${ainScale} scaled across Limitless Light Stack pool, front-row Ain Soph Aur count, and Collection Power.`,
      baseOblivion: ainBase, cooldownCards: 1 + (index % 4),
      scaling: { kind: 'triune', amount: ainScale },
      tags: ['light', 'ain-attack'],
    },
    sophAttack: {
      id: `${id}:soph-attack`, label: 'Soph', name: 'Soph Attack',
      description: `${sophBase} base Divine Light; +${sophScale} scaled across Limitless Light Stack pool, front-row Ain Soph Aur count, and Collection Power; consumes ${1 + (index % 5)} stacks.`,
      baseOblivion: sophBase, cooldownCards: 2 + (index % 6),
      scaling: { kind: 'triune', amount: sophScale },
      stackCost: { kind: 'fixed', value: 1 + (index % 5) },
      tags: ['light', 'soph-attack'],
    },
    sophPlacementEffects,
    sacrificeStackRate: 18 + index * 4,
  };
});
