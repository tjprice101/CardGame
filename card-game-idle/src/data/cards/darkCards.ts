import type { DarkCardDefinition, SpectrumLevel } from '@/types/cards';
import type { CardEffect } from '@/types/effects';

const darkNames = [
  'Null Compass', 'Void Archive', 'Balance Engine', 'Equilibrium Map', 'Stillness Chapel',
  'Measured Path', 'Seraphic Recall', 'Neutral Cycle', 'Deep Survey', 'Paradox Lens',
  'Axiom Reservoir', 'Horizon Atlas', 'Silent Exchange', 'Glass Archive', 'Night Orchard',
  'Unlit Gate', 'Black Sun Reliquary', 'The Long Pause', 'Void Cartograph', 'Last Equation',
  'World Without Echo', 'Divine Light Key', 'The Patient Star', 'Absolute Archive',
] as const;

const artKeys = [
  'seek_neutral_null_seek', 'seek_neutral_seraph_recall', 'seek_neutral_neutral_cycle', 'seek_neutral_measured_seek', 'seek_neutral_void_surge',
  'seek_neutral_still_pulse', 'seek_neutral_chain_pulse', 'seek_neutral_cherubim_recall', 'seek_neutral_deep_seek',
  'seek_neutral_echo_pulse', 'seek_neutral_seraph_hunt', 'seek_neutral_nullfall', 'enig_neutralistic_flame', 'enig_equilibriums_bane',
  'seek_neutral_null_seek', 'seek_neutral_seraph_recall', 'seek_neutral_neutral_cycle', 'seek_neutral_measured_seek', 'seek_neutral_void_surge',
  'seek_neutral_still_pulse', 'seek_neutral_chain_pulse', 'seek_neutral_cherubim_recall', 'seek_neutral_deep_seek', 'seek_neutral_grand_seek',
] as const;

interface DarkIdentity {
  readonly level: SpectrumLevel;
  readonly text: string;
  readonly effects: CardEffect[];
}

// Utilities escalate with Spectrum Level; each Neutrality Dark resolves a distinct utility.
const DARK_IDENTITIES: readonly DarkIdentity[] = [
  { level: 0, text: 'search your deck for a Light card', effects: [{ type: 'search_deck_by_type', filter: ['Light'] }] },
  { level: 0, text: 'look at the top 3 cards and take 1', effects: [{ type: 'look_top_take', look: 3, take: 1 }] },
  { level: 0, text: 'discard 1 card, then draw 2', effects: [{ type: 'discard_draw', discard: 1, draw: 2 }] },
  { level: 0, text: 'salvage a Light card from your discard pile', effects: [{ type: 'salvage_by_type', filter: ['Light'] }] },
  { level: 0, text: 'shuffle your discard pile into your deck, then draw 1', effects: [{ type: 'shuffle_discard' }, { type: 'draw', value: 1 }] },
  { level: 0, text: 'look at the top 4 cards, take 1, put 1 on the bottom, and discard the rest', effects: [{ type: 'look_top_take_drop', look: 4, take: 1, drop: 1 }] },
  { level: 1, text: 'search for 1 Light and 1 Dark card', effects: [{ type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }] },
  { level: 1, text: 'salvage any 1 card', effects: [{ type: 'salvage_any' }] },
  { level: 1, text: 'draw 2 cards', effects: [{ type: 'draw', value: 2 }] },
  { level: 1, text: 'look at the top 5 cards and take a Light card', effects: [{ type: 'look_top_take_type', look: 5, filter: ['Light'], take: 1 }] },
  { level: 1, text: 'salvage 1 Light card and gain 2 Limitless Light Stacks', effects: [{ type: 'salvage_by_type_count', filter: ['Light'], count: 1 }, { type: 'light_stacks_flat', value: 2 }] },
  { level: 1, text: 'search your deck for a Dark card', effects: [{ type: 'search_deck_by_type', filter: ['Dark'] }] },
  { level: 2, text: 'exchange a Light or Dark card in hand for an opposite-type card, then draw 1', effects: [{ type: 'exchange_hand_for_opposite' }, { type: 'draw', value: 1 }] },
  { level: 2, text: 'draw 2 cards; if any is a Dark card, draw 1 more', effects: [{ type: 'draw_with_type_bonus', value: 2, filter: ['Dark'], bonusDraw: 1 }] },
  { level: 2, text: 'exchange the top and bottom cards of your deck and gain 3 Limitless Light Stacks', effects: [{ type: 'exchange_deck_ends' }, { type: 'light_stacks_flat', value: 3 }] },
  { level: 2, text: 'look at the top 5 cards and take 2', effects: [{ type: 'look_top_take', look: 5, take: 2 }] },
  { level: 2, text: 'discard 2 cards, then draw 4', effects: [{ type: 'discard_draw', discard: 2, draw: 4 }] },
  { level: 2, text: 'salvage a Dark card from your discard pile and gain 2 Limitless Light Stacks', effects: [{ type: 'salvage_by_type', filter: ['Dark'] }, { type: 'light_stacks_flat', value: 2 }] },
  { level: 3, text: 'search for 1 Light and 1 Dark card, then shuffle your discard pile into your deck', effects: [{ type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }, { type: 'shuffle_discard' }] },
  { level: 3, text: 'look at the top 6 cards, take 2, put 1 on the bottom, and discard the rest', effects: [{ type: 'look_top_take_drop', look: 6, take: 2, drop: 1 }] },
  { level: 3, text: 'salvage either 2 Light cards (gaining 4 Limitless Light Stacks) or 2 Dark cards (searching for a Light or Dark card)', effects: [{ type: 'salvage_either_light_or_dark', count: 2, lightStacks: 4 }] },
  { level: 4, text: 'gain 4 Limitless Light Stacks and draw 2 cards', effects: [{ type: 'light_stacks_flat', value: 4 }, { type: 'draw', value: 2 }] },
  { level: 4, text: 'draw 3 cards; if you have played 4+ cards this turn, gain 6 Limitless Light Stacks', effects: [{ type: 'draw', value: 3 }, { type: 'conditional', condition: { type: 'cards_played_gte', value: 4 }, then: [{ type: 'light_stacks_flat', value: 6 }] }] },
  { level: 5, text: 'salvage any 1 card, search for 1 Light and 1 Dark card, and gain 5 Limitless Light Stacks', effects: [{ type: 'salvage_any' }, { type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }, { type: 'light_stacks_flat', value: 5 }] },
];

export const darkCards: DarkCardDefinition[] = darkNames.map((name, index) => {
  const id = `dark-neutrality-${index + 1}`;
  const identity = DARK_IDENTITIES[index]!;
  const activationCost = identity.level >= 4 ? 1 : 0;
  return {
    definitionId: id,
    type: 'Dark',
    rarity: index < 8 ? 'Common' : index < 15 ? 'Rare' : index < 21 ? 'Epic' : 'Legendary',
    spectrumLevel: identity.level,
    name,
    description: `Activate from the Ain side of the board: ${identity.text}.`,
    artKey: artKeys[index],
    sophEffects: identity.effects,
    activationCost: { kind: 'fixed', value: activationCost },
    postActivationFate: index % 3 === 0 ? 'hand' : index % 3 === 1 ? 'deck' : 'discard',
    sacrificeStackRate: 20 + index * 5,
  };
});
