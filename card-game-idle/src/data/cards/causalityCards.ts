import type { AinSophAurDefinition, DarkCardDefinition, LightCardDefinition } from '@/types/cards';
import type { CardEffect } from '@/types/effects';

const LIGHT_NAMES = [
  'Eventide Archivist', 'Horizon Silk', 'Black-Star Crane', 'Mandate of Falling Suns', 'Heavenly Singularity',
  'Orbit-Scribe', 'White Aperture', 'Ninefold Eclipse', 'Celestial Debt', 'Last Meridian',
] as const;

const DARK_NAMES = [
  'Gravitic Testament', 'Abyssal Ledger', 'Black Hole Sutra', 'Collapsed Mandate', 'Horizon Taxonomist',
  'Eventide Reversal', 'Void-Thread Seal', 'Ashen Orbit', 'Causal Undertow', 'The Unwritten Mass',
] as const;

const ASA_NAMES = [
  'The Horizon Sovereign', 'Asterion of the Last Gate', 'Heavenly Collapse Engine', 'The Black-White Pilgrim', 'Causality Unbound',
] as const;

const artKey = (type: 'light' | 'dark' | 'asa', index: number) => `causality_${type}_${index + 1}`;

export const causalityLightCards: LightCardDefinition[] = LIGHT_NAMES.map((name, index) => {
  const id = `light-causality-${index + 1}`;
  return {
    definitionId: id,
    type: 'Light',
    rarity: index < 5 ? 'Rare' : index < 9 ? 'Epic' : 'Legendary',
    name,
    description: 'A Causality Light card that bends the event horizon into a controlled Divine Light line.',
    artKey: artKey('light', index),
    ainAttack: {
      id: `${id}:ain-attack`, label: 'Ain', name: 'Ain Attack',
      description: 'Steady Divine Light gain with Collection Power scaling.',
      baseOblivion: 180 + index * 35, cooldownCards: 2 + (index % 3),
      scaling: { kind: 'triune', amount: 140 + index * 20 }, tags: ['causality', 'ain-attack'],
    },
    sophAttack: {
      id: `${id}:soph-attack`, label: 'Soph', name: 'Soph Attack',
      description: 'Stronger Divine Light burst that consumes Limitless Light Stacks.',
      baseOblivion: 260 + index * 45, cooldownCards: 3 + (index % 4),
      scaling: { kind: 'triune', amount: 220 + index * 25 },
      stackCost: { kind: 'fixed', value: 1 + (index % 4) }, tags: ['causality', 'soph-attack'],
    },
    sophPlacementEffects: [
      { type: 'oblivion_flat', value: 20 + index * 8 } as CardEffect,
      ...(index % 3 === 0 ? [{ type: 'cosmos_flat', value: 1 + Math.floor(index / 4) } as CardEffect] : []),
    ],
    sacrificeStackRate: 22 + index * 3,
  };
});

export const causalityDarkCards: DarkCardDefinition[] = DARK_NAMES.map((name, index) => {
  const id = `dark-causality-${index + 1}`;
  return {
    definitionId: id,
    type: 'Dark',
    rarity: index < 5 ? 'Rare' : index < 9 ? 'Epic' : 'Legendary',
    name,
    description: 'A Causality Dark card that bends, taxes, or redirects the event horizon.',
    artKey: artKey('dark', index),
    sophEffects: [
      index % 2 === 0 ? { type: 'draw', value: 1 } : { type: 'shuffle_discard' },
      ...(index % 3 === 1 ? [{ type: 'cosmos_flat', value: 1 } as CardEffect] : []),
    ],
    activationCost: { kind: 'fixed', value: index % 3 === 0 ? 1 : 0 },
    cooldownCardsPlayed: index % 3 === 0 ? 2 : undefined,
    postActivationFate: index % 3 === 0 ? 'hand' : index % 3 === 1 ? 'deck' : 'discard',
    sacrificeStackRate: 24 + index * 3,
    persistent: index % 3 === 0,
  };
});

export const causalityAinSophAurCards: AinSophAurDefinition[] = ASA_NAMES.map((name, index) => {
  const id = `ain-soph-aur-causality-${index + 1}`;
  return {
    definitionId: id,
    type: 'AinSophAur',
    rarity: 'Legendary',
    name,
    description: 'A Causality Ain Soph Aur that converts a prepared board into a horizon-breaking Bridge the Light attack.',
    artKey: artKey('asa', index),
    summonMaterialCount: 1,
    summonMaterials: [{ cardTypes: ['Light'], side: 'any', count: 1 }],
    onSummonEffects: [{ type: 'oblivion_flat', value: 180 + index * 60 }],
    bridgeAttack: {
      id: `${id}:bridge-the-light`, name: 'Bridge the Light',
      description: 'Bridge the event horizon for a Collection Power-scaled Divine Light payout.',
      baseOblivion: 650 + index * 120, cooldownCards: 2 + (index % 3),
      scaling: { kind: 'triune', amount: 500 + index * 80 },
      consumesStacks: { kind: 'fixed', value: 2 + (index % 3) },
    },
  };
});

export const causalityCards = [
  ...causalityLightCards,
  ...causalityDarkCards,
  ...causalityAinSophAurCards,
] as const;

export const CAUSALITY_PACK_POOL = causalityCards.map(card => card.definitionId);
