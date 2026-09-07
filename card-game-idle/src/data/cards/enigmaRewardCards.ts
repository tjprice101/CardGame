import type { DarkCardDefinition, LightCardDefinition } from '@/types/cards';

export const enigmaRewardCards: Array<LightCardDefinition | DarkCardDefinition> = [
  {
    definitionId: 'enig-neutral-lumen-genesis', type: 'Light', rarity: 'Enigmatic', name: 'Lumen Genesis',
    description: 'Enigmatic Light. Ain Attack: 720 base Divine Light, +620 triune scaling. Soph Attack: 980 base Divine Light, +820 triune scaling; consumes 2 stacks.',
    artKey: 'enig_neutral_lumen_genesis',
    ainAttack: { id: 'enig-neutral-lumen-genesis:ain-attack', label: 'Ain', name: 'Ain Attack', description: '720 base Divine Light with triune scaling.', baseOblivion: 720, cooldownCards: 3, scaling: { kind: 'triune', amount: 620 }, tags: ['enigma', 'ain-attack'] },
    sophAttack: { id: 'enig-neutral-lumen-genesis:soph-attack', label: 'Soph', name: 'Soph Attack', description: '980 base Divine Light with triune scaling; consumes 2 stacks.', baseOblivion: 980, cooldownCards: 3, scaling: { kind: 'triune', amount: 820 }, stackCost: { kind: 'fixed', value: 2 }, tags: ['enigma', 'soph-attack'] },
    sacrificeOblivionRate: 65,
  },
  {
    definitionId: 'enig-neutral-null-catechism', type: 'Dark', rarity: 'Enigmatic', name: 'Null Catechism',
    description: 'Enigmatic Dark utility. Search your Main Deck for a Light card and return this card to your hand.',
    artKey: 'enig_neutral_null_catechism',
    sophEffects: [{ type: 'search_deck_by_type', filter: ['Light'] }], activationCost: { kind: 'fixed', value: 3 },
    cooldownCardsPlayed: 2, postActivationFate: 'hand', allowHandCast: true, sacrificeOblivionRate: 70,
  },
];