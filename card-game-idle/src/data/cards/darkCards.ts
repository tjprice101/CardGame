import type { DarkCardDefinition } from '@/types/cards';
import type { CardEffect } from '@/types/effects';

const darkNames = [
  'Null Compass', 'Void Archive', 'Balance Engine', 'Equilibrium Map', 'Stillness Chapel',
  'Measured Path', 'Seraphic Recall', 'Neutral Cycle', 'Deep Survey', 'Paradox Lens',
  'Axiom Reservoir', 'Horizon Atlas', 'Silent Exchange', 'Glass Archive', 'Night Orchard',
  'Unlit Gate', 'Black Sun Reliquary', 'The Long Pause', 'Void Cartograph', 'Last Equation',
  'World Without Echo', 'Oblivion Key', 'The Patient Star', 'Absolute Archive', 'Dark Origin',
] as const;

const artKeys = [
  'seek_neutral_null_seek', 'seek_neutral_seraph_recall', 'seek_neutral_neutral_cycle', 'seek_neutral_measured_seek', 'seek_neutral_void_surge',
  'seek_neutral_still_pulse', 'seek_neutral_chain_pulse', 'seek_neutral_cherubim_recall', 'seek_neutral_deep_seek', 'seek_neutral_grand_seek',
  'seek_neutral_echo_pulse', 'seek_neutral_seraph_hunt', 'seek_neutral_nullfall', 'enig_neutralistic_flame', 'enig_equilibriums_bane',
  'seek_neutral_null_seek', 'seek_neutral_seraph_recall', 'seek_neutral_neutral_cycle', 'seek_neutral_measured_seek', 'seek_neutral_void_surge',
  'seek_neutral_still_pulse', 'seek_neutral_chain_pulse', 'seek_neutral_cherubim_recall', 'seek_neutral_deep_seek', 'seek_neutral_grand_seek',
] as const;

export const darkCards: DarkCardDefinition[] = darkNames.map((name, index) => {
  const id = `dark-neutrality-${index + 1}`;
  const draw = 1 + (index % 3);
  const utilityEffects: CardEffect[] = [
    { type: 'search_deck_by_type', filter: ['Light'] },
    { type: 'look_top_take', look: 3, take: 1 },
    { type: 'discard_draw', discard: 1, draw: 2 },
    { type: 'salvage_by_type', filter: ['Light'] },
    { type: 'shuffle_discard' },
    { type: 'look_top_take_drop', look: 4, take: 1, drop: 1 },
    { type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 },
    { type: 'salvage_any' },
    { type: 'draw', value: draw },
    { type: 'look_top_take_type', look: 5, filter: ['Light'], take: 1 },
    { type: 'salvage_by_type_count', filter: ['Light'], count: 1 },
    { type: 'search_deck_by_type', filter: ['Dark'] },
    { type: 'discard_choice', value: 1 },
    { type: 'draw', value: 2 },
    { type: 'shuffle_discard' },
    { type: 'look_top_take', look: 5, take: 2 },
    { type: 'discard_draw', discard: 2, draw: 3 },
    { type: 'salvage_by_type', filter: ['Dark'] },
    { type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 },
    { type: 'look_top_take_drop', look: 6, take: 2, drop: 1 },
    { type: 'salvage_by_id', targetId: 'light-neutrality-1', label: 'Null Sentinel' },
    { type: 'search_deck_by_type', filter: ['AinSophAur'] },
    { type: 'draw', value: 3 },
    { type: 'salvage_any' },
    { type: 'discard_draw', discard: 1, draw: 3 },
  ];
  const effects = utilityEffects[index];
  const effectText = effects.type === 'draw' ? `draw ${effects.value}` : effects.type.replace(/_/g, ' ');
  return {
    definitionId: id,
    type: 'Dark',
    rarity: index < 8 ? 'Common' : index < 15 ? 'Rare' : index < 21 ? 'Epic' : index < 24 ? 'Legendary' : 'Eternal',
    name,
    description: `Dark utility. ${index % 2 === 0 ? 'May be cast from hand or placed face-down as Soph.' : 'Place face-down as Soph, then flip to Ain.'} Utility: ${effectText}; costs ${1 + (index % 6)} Limitless Light Stack${1 + (index % 6) === 1 ? '' : 's'}; ${1 + (index % 7)}-play cooldown; resolves to ${index % 3 === 0 ? 'hand' : index % 3 === 1 ? 'deck' : 'discard'}.`,
    artKey: artKeys[index],
    sophEffects: [effects],
    activationCost: { kind: 'fixed', value: 1 + (index % 6) },
    cooldownCardsPlayed: 1 + (index % 7),
    postActivationFate: index % 3 === 0 ? 'hand' : index % 3 === 1 ? 'deck' : 'discard',
    allowHandCast: index % 2 === 0,
    sacrificeOblivionRate: 20 + index * 5,
  };
});
