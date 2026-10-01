import type { LightCardDefinition, SpectrumLevel } from '@/types/cards';
import type { CardEffect } from '@/types/effects';
import {
  formatSpectrumNumber,
  getSpectrumAinBase,
  getSpectrumScaling,
  getSpectrumSophBase,
} from './spectrumPower';

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

interface LightIdentity {
  readonly level: SpectrumLevel;
  readonly description: string;
  readonly soph: CardEffect[];
}

// Every Neutrality Light has a distinct Soph placement; stronger tricks sit at higher Spectrum Levels.
const LIGHT_IDENTITIES: readonly LightIdentity[] = [
  { level: 0, description: 'Soph placement: gain 1 Limitless Light Stack and draw 1 card.', soph: [{ type: 'light_stacks_flat', value: 1 }, { type: 'draw', value: 1 }] },
  { level: 0, description: 'Soph placement: look at the top 2 cards and take 1.', soph: [{ type: 'look_top_take', look: 2, take: 1 }] },
  { level: 0, description: 'Soph placement: gain 40 Divine Light and shuffle your discard pile into your deck.', soph: [{ type: 'divine_light_flat', value: 40 }, { type: 'shuffle_discard' }] },
  { level: 0, description: 'Soph placement: discard 1 card, then draw 2.', soph: [{ type: 'discard_draw', discard: 1, draw: 2 }] },
  { level: 0, description: 'Soph placement: look at the top 3 cards and take a Dark card.', soph: [{ type: 'look_top_take_type', look: 3, filter: ['Dark'], take: 1 }] },
  { level: 0, description: 'Soph placement: salvage 1 Dark card from your discard pile.', soph: [{ type: 'salvage_by_type_count', filter: ['Dark'], count: 1 }] },
  { level: 1, description: 'Soph placement: if this is your first card this turn, gain 3 Limitless Light Stacks; then draw 1 card.', soph: [{ type: 'conditional', condition: { type: 'first_card_this_turn' }, then: [{ type: 'light_stacks_flat', value: 3 }] }, { type: 'draw', value: 1 }] },
  { level: 1, description: 'Soph placement: exchange the top and bottom cards of your deck, then draw 1 card.', soph: [{ type: 'exchange_deck_ends' }, { type: 'draw', value: 1 }] },
  { level: 1, description: 'Soph placement: gain 120 Divine Light; if you have played 3+ cards this turn, draw 2 cards.', soph: [{ type: 'divine_light_flat', value: 120 }, { type: 'conditional', condition: { type: 'cards_played_gte', value: 3 }, then: [{ type: 'draw', value: 2 }] }] },
  { level: 1, description: 'Soph placement: gain 2 Limitless Light Stacks and 100 Divine Light.', soph: [{ type: 'light_stacks_flat', value: 2 }, { type: 'divine_light_flat', value: 100 }] },
  { level: 1, description: 'Soph placement: look at the top 4 cards, take 1, put 1 on the bottom, and discard the rest.', soph: [{ type: 'look_top_take_drop', look: 4, take: 1, drop: 1 }] },
  { level: 1, description: 'Soph placement: exchange a Light or Dark card in hand for an opposite-type card, then gain 1 Limitless Light Stack.', soph: [{ type: 'exchange_hand_for_opposite' }, { type: 'light_stacks_flat', value: 1 }] },
  { level: 2, description: 'Soph placement: draw 2 cards; if any is a Light card, draw 1 more.', soph: [{ type: 'draw_with_type_bonus', value: 2, filter: ['Light'], bonusDraw: 1 }] },
  { level: 2, description: 'Soph placement: search your deck for a Light card and gain 200 Divine Light.', soph: [{ type: 'search_deck_by_type', filter: ['Light'] }, { type: 'divine_light_flat', value: 200 }] },
  { level: 2, description: 'Soph placement: draw 1 card; if you hold 4+ Limitless Light Stacks, gain 400 Divine Light.', soph: [{ type: 'draw', value: 1 }, { type: 'conditional', condition: { type: 'light_stacks_gte', value: 4 }, then: [{ type: 'divine_light_flat', value: 400 }] }] },
  { level: 2, description: 'Soph placement: salvage either 1 Light card (gaining 2 Limitless Light Stacks) or 1 Dark card (searching for a Light or Dark card).', soph: [{ type: 'salvage_either_light_or_dark', count: 1, lightStacks: 2 }] },
  { level: 2, description: 'Soph placement: discard 1 card to gain 4 Limitless Light Stacks.', soph: [{ type: 'discard_choice', value: 1 }, { type: 'light_stacks_flat', value: 4 }] },
  { level: 2, description: 'Soph placement: search your deck for a Dark card and gain 2 Limitless Light Stacks.', soph: [{ type: 'search_deck_by_type', filter: ['Dark'] }, { type: 'light_stacks_flat', value: 2 }] },
  { level: 3, description: 'Soph placement: draw 3 cards; with 2+ Dark draws, draw 1 more; with 2+ Light draws, gain 600 Divine Light.', soph: [{ type: 'draw_with_type_bonuses', value: 3, drawFilter: 'Dark', drawThreshold: 2, bonusDraw: 1, gainFilter: 'Light', gainThreshold: 2, gainDivineLight: 600 }] },
  { level: 3, description: 'Soph placement: salvage any 1 card and gain 3 Limitless Light Stacks.', soph: [{ type: 'salvage_any' }, { type: 'light_stacks_flat', value: 3 }] },
  { level: 3, description: 'Soph placement: search for 1 Light and 1 Dark card, then discard 1 card.', soph: [{ type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }, { type: 'discard_choice', value: 1 }] },
  { level: 4, description: 'Soph placement: gain 800 Divine Light; if you have played 4+ cards this turn, gain 6 Limitless Light Stacks and draw 2 cards.', soph: [{ type: 'divine_light_flat', value: 800 }, { type: 'conditional', condition: { type: 'cards_played_gte', value: 4 }, then: [{ type: 'light_stacks_flat', value: 6 }, { type: 'draw', value: 2 }] }] },
  { level: 4, description: 'Soph placement: look at the top 6 cards, take 2, and gain 3 Limitless Light Stacks.', soph: [{ type: 'look_top_take', look: 6, take: 2 }, { type: 'light_stacks_flat', value: 3 }] },
  { level: 5, description: 'Soph placement: salvage 2 Light or Dark cards, draw 2 cards, and gain 5 Limitless Light Stacks.', soph: [{ type: 'salvage_by_type_count', filter: ['Light', 'Dark'], count: 2 }, { type: 'draw', value: 2 }, { type: 'light_stacks_flat', value: 5 }] },
];

export const lightCards: LightCardDefinition[] = lightNames.map((name, index) => {
  const id = `light-neutrality-${index + 1}`;
  const identity = LIGHT_IDENTITIES[index]!;
  const rarity = index < 8 ? 'Common' : index < 15 ? 'Rare' : index < 21 ? 'Epic' : 'Legendary';
  // Small per-card tie-break keeps same-tier attacks distinct without crossing rarity bands.
  const tieBreak = (index % 8) * 5;
  const ainBase = getSpectrumAinBase(rarity, identity.level, 'base') + tieBreak;
  const sophBase = getSpectrumSophBase(rarity, identity.level, 'base') + tieBreak;
  const sophStackCost = 1 + (index % 5);
  return {
    definitionId: id,
    type: 'Light',
    rarity,
    spectrumLevel: identity.level,
    name,
    description: identity.description,
    artKey: artKeys[index],
    ainAttack: {
      id: `${id}:ain-attack`, label: 'Ain', name: 'Ain Attack',
      description: `${formatSpectrumNumber(ainBase)} base Divine Light; scales with Collection Power.`,
      baseDivineLight: ainBase, cooldownCards: 1 + (index % 4),
      scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(ainBase) },
      tags: ['light', 'ain-attack'],
    },
    sophAttack: {
      id: `${id}:soph-attack`, label: 'Soph', name: 'Soph Attack',
      description: `${formatSpectrumNumber(sophBase)} base Divine Light; scales with Collection Power; consumes ${sophStackCost} Limitless Light Stacks.`,
      baseDivineLight: sophBase, cooldownCards: 2 + (index % 6),
      scaling: { kind: 'linear', reads: 'collectionPower', multiplier: getSpectrumScaling(sophBase) },
      stackCost: { kind: 'fixed', value: sophStackCost },
      tags: ['light', 'soph-attack'],
    },
    sophPlacementEffects: identity.soph,
    sacrificeStackRate: 18 + index * 4,
  };
});
