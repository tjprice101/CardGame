import type { AinSophAurDefinition, CardDefinition, DarkCardDefinition, LightCardDefinition, SpectrumLevel } from '@/types/cards';
import type { CardEffect } from '@/types/effects';
import {
  formatSpectrumNumber,
  getSpectrumAinBase,
  getSpectrumBridgeBase,
  getSpectrumFlatDivineLight,
  getSpectrumScaling,
  getSpectrumSophBase,
} from './spectrumPower';

export interface LegacyCosmeticCard {
  definitionId: string;
  rarity: string;
  name: string;
  description: string;
  artKey: string;
}

const light = (
  definitionId: string,
  name: string,
  artKey: string,
  level: SpectrumLevel,
  description: string,
  sophPlacementEffects: CardEffect[],
): LightCardDefinition => {
  const ainBase = getSpectrumAinBase('Eternal', level, 'boss');
  const sophBase = getSpectrumSophBase('Eternal', level, 'boss');
  return {
    definitionId,
    type: 'Light',
    rarity: 'Eternal',
    spectrumLevel: level,
    name,
    description,
    artKey,
    ainAttack: {
      id: `${definitionId}:ain-attack`, label: 'Ain', name: 'Ain Attack',
      description: `${formatSpectrumNumber(ainBase)} base Divine Light with Collection Power scaling.`, baseDivineLight: ainBase,
      cooldownCards: 3, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(ainBase) }, tags: ['eternal', 'ain-attack'],
    },
    sophAttack: {
      id: `${definitionId}:soph-attack`, label: 'Soph', name: 'Soph Attack',
      description: `${formatSpectrumNumber(sophBase)} base Divine Light with Collection Power scaling; consumes 3 Limitless Light Stacks.`, baseDivineLight: sophBase,
      cooldownCards: 4, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(sophBase) },
      stackCost: { kind: 'fixed', value: 3 }, tags: ['eternal', 'soph-attack'],
    },
    sophPlacementEffects,
    sacrificeStackRate: 80,
  };
};

const dark = (
  definitionId: string,
  name: string,
  artKey: string,
  level: SpectrumLevel,
  description: string,
  sophEffects: CardEffect[],
  fate: DarkCardDefinition['postActivationFate'],
): DarkCardDefinition => ({
  definitionId,
  type: 'Dark',
  rarity: 'Eternal',
  spectrumLevel: level,
  name,
  description,
  artKey,
  sophEffects, activationCost: { kind: 'fixed', value: 2 },
  postActivationFate: fate,
  sacrificeStackRate: 85,
});

const asa = (
  definitionId: string,
  name: string,
  artKey: string,
  level: SpectrumLevel,
  materials: number,
): AinSophAurDefinition => {
  const baseDivineLight = getSpectrumBridgeBase('Eternal', level, 'boss');
  const summonDivineLight = getSpectrumFlatDivineLight('Eternal', level, 'boss', 0.15);
  return {
    definitionId,
    type: 'AinSophAur',
    rarity: 'Eternal',
    spectrumLevel: level,
    name,
    description: `Sacrifice ${materials} back-row cards to summon and gain ${formatSpectrumNumber(summonDivineLight)} Divine Light, then use Bridge the Light for a Collection Power-scaled Divine Light payout.`,
    artKey,
    summonMaterialCount: materials,
    summonMaterials: definitionId === 'btei-axiom-of-oblivion'
      ? [{ definitionIds: ['btei-voids-reaping'], count: 1 }, { definitionIds: ['btei-null-edict'], count: 1 }, { definitionIds: ['btei-temporal-ruin'], count: 1 }]
      : definitionId === 'btei-sovereign-domain'
        ? [{ definitionIds: ['btei-convergence-of-eternity'], count: 1 }, { definitionIds: ['btei-omniscient-fracture'], count: 1 }]
        : [{ definitionIds: ['btei-neutrality-prime-equilibrium'], count: 1 }, { definitionIds: ['btei-null-edict'], count: 1 }],
    onSummonEffects: [{ type: 'divine_light_flat', value: summonDivineLight }],
    bridgeAttack: {
      id: `${definitionId}:bridge-the-light`, name: 'Bridge the Light',
      description: `${formatSpectrumNumber(baseDivineLight)} base Divine Light with Collection Power scaling.`, baseDivineLight,
      cooldownCards: 4, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(baseDivineLight) },
      consumesStacks: { kind: 'fixed', value: 4 },
    },
  };
};

const pearlBridge = getSpectrumBridgeBase('Eternal', 4, 'boss');

export const eternalCards: CardDefinition[] = [
  light('btei-voids-reaping', 'The Harrowing of the Last Dawn', 'btei_voids_reaping', 2,
    'Soph placement: discard 2 cards, draw 4, and gain 1,500 Divine Light.',
    [{ type: 'discard_draw', discard: 2, draw: 4 }, { type: 'divine_light_flat', value: 1_500 }]),
  dark('btei-temporal-ruin', 'The Ruin of Hours', 'btei_temporal_ruin', 2,
    'For 2 Limitless Light Stacks: discard 1 card and draw 3, then return this card to your hand.',
    [{ type: 'discard_draw', discard: 1, draw: 3 }], 'hand'),
  dark('btei-null-edict', 'The Null Verdict', 'btei_null_edict', 3,
    'For 2 Limitless Light Stacks: search for 1 Light and 1 Dark card and gain 4 Limitless Light Stacks, then return this card to your hand.',
    [{ type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }, { type: 'light_stacks_flat', value: 4 }], 'hand'),
  asa('btei-axiom-of-oblivion', 'The Axiom of Nothing', 'btei_axiom_of_oblivion', 4, 3),
  asa('btei-sovereign-domain', 'The Sovereign Quiet', 'btei_sovereign_domain', 3, 2),
  light('btei-convergence-of-eternity', 'The Convergence Beyond Time', 'btei_convergence_of_eternity', 3,
    'Soph placement: exchange the top and bottom cards of your deck, look at the top 4 and take 2, then gain 4 Limitless Light Stacks.',
    [{ type: 'exchange_deck_ends' }, { type: 'look_top_take', look: 4, take: 2 }, { type: 'light_stacks_flat', value: 4 }]),
  light('btei-omniscient-fracture', 'The Fracture of Knowing', 'btei_omniscient_fracture', 2,
    'Soph placement: draw 2 cards; if any is a Dark card, draw 2 more. Then shuffle your discard pile into your deck.',
    [{ type: 'draw_with_type_bonus', value: 2, filter: ['Dark'], bonusDraw: 2 }, { type: 'shuffle_discard' }]),
  asa('btei-neutrality-void-throne', 'The Throne of Equilibrium', 'btei_neutrality_void_throne', 3, 2),
  light('btei-neutrality-prime-equilibrium', 'The Prime Judge of Silence', 'btei_neutrality_prime_equilibrium', 3,
    'Soph placement: search for 1 Light and 1 Dark card; if you hold 6+ Limitless Light Stacks, gain 3,000 Divine Light.',
    [{ type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }, { type: 'conditional', condition: { type: 'light_stacks_gte', value: 6 }, then: [{ type: 'divine_light_flat', value: 3_000 }] }]),
  light('btei-causality-first-cause', 'The First Cause Unwritten', 'causality_eternal_first_cause', 3,
    'Soph placement: gain 5 Cosmos, exchange the top and bottom cards of your deck, then draw 2 cards.',
    [{ type: 'cosmos_flat', value: 5 }, { type: 'exchange_deck_ends' }, { type: 'draw', value: 2 }]),
  light('btei-causality-last-horizon', 'The Last Horizon Remembered', 'causality_eternal_last_horizon', 4,
    'Soph placement: search for a Dark card; if you hold 4+ Cosmos, gain 10 Limitless Light Stacks and 4,000 Divine Light.',
    [{ type: 'search_deck_by_type', filter: ['Dark'] }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 4 }, then: [{ type: 'light_stacks_flat', value: 10 }, { type: 'divine_light_flat', value: 4_000 }] }]),
  {
    ...dark('btei-causality-ink-sovereign', 'Sovereign Ink of the Black Sun', 'causality_eternal_ink_sovereign', 3,
      'Inspect the top 5 cards and keep 2; consume 2 Cosmos to draw 3 more and gain 8 Light Stacks.',
      [{ type: 'look_top_take', look: 5, take: 2 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 2 }, then: [{ type: 'consume_cosmos', value: 2 }, { type: 'draw', value: 3 }, { type: 'light_stacks_flat', value: 8 }] }],
      'hand'),
    persistent: true, cooldownCardsPlayed: 4,
  },
  dark('btei-causality-chromatic-verdict', 'Chromatic Verdict of Elsewhen', 'causality_eternal_chromatic_verdict', 4,
    'Recover a Light and Dark card; consume 3 Cosmos for 7,500 base Divine Light and shuffle discard into the deck.',
    [{ type: 'salvage_by_type_count', filter: ['Light', 'Dark'], count: 2 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 3 }, then: [{ type: 'consume_cosmos', value: 3 }, { type: 'divine_light_flat', value: 7_500 }, { type: 'shuffle_discard' }] }],
    'deck'),
  {
    ...asa('btei-causality-pearl-engine', 'Pearlescent Engine Beyond Sequence', 'causality_eternal_pearl_engine', 4, 2),
    description: 'Sacrifice The First Cause Unwritten and Sovereign Ink of the Black Sun to summon this chromatic apex.',
    summonMaterials: [{ definitionIds: ['btei-causality-first-cause'], count: 1 }, { definitionIds: ['btei-causality-ink-sovereign'], count: 1 }],
    onSummonEffects: [{ type: 'cosmos_flat', value: 5 }, { type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }],
    bridgeAttack: { id: 'btei-causality-pearl-engine:bridge-the-light', name: 'Bridge the Light', description: `${formatSpectrumNumber(pearlBridge)} base Divine Light with extreme Collection Power scaling; consumes 5 Limitless Light Stacks.`, baseDivineLight: pearlBridge, cooldownCards: 3, scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(pearlBridge) }, consumesStacks: { kind: 'fixed', value: 5 } },
  },
] as const;
