import type { DarkCardDefinition, LightCardDefinition } from '@/types/cards';

export const enigmaRewardCards: Array<LightCardDefinition | DarkCardDefinition> = [
  {
    definitionId: 'enig-neutral-lumen-genesis', type: 'Light', rarity: 'Legendary', name: 'Lumen Genesis',
    description: 'Enigmatic Light. Ain Attack: 720 base Oblivion, +620 triune scaling. Soph Attack: 980 base Oblivion, +820 triune scaling; consumes 2 stacks.',
    artKey: 'enig_neutral_lumen_genesis',
    ainAttack: { id: 'enig-neutral-lumen-genesis:ain-attack', label: 'Ain', name: 'Ain Attack', description: '720 base Oblivion with triune scaling.', baseOblivion: 720, cooldownCards: 3, scaling: { kind: 'triune', amount: 620 }, tags: ['enigma', 'ain-attack'] },
    sophAttack: { id: 'enig-neutral-lumen-genesis:soph-attack', label: 'Soph', name: 'Soph Attack', description: '980 base Oblivion with triune scaling; consumes 2 stacks.', baseOblivion: 980, cooldownCards: 3, scaling: { kind: 'triune', amount: 820 }, stackCost: { kind: 'fixed', value: 2 }, tags: ['enigma', 'soph-attack'] },
    sacrificeOblivionRate: 65,
  },
  {
    definitionId: 'enig-neutral-null-catechism', type: 'Dark', rarity: 'Legendary', name: 'Null Catechism',
    description: 'Enigmatic Dark utility. Search an Ain Soph Aur from the deck and return this card to your hand.',
    artKey: 'enig_neutral_null_catechism',
    sophEffects: [{ type: 'search_deck_by_type', filter: ['AinSophAur'] }], activationCost: { kind: 'fixed', value: 3 },
    cooldownCardsPlayed: 2, postActivationFate: 'hand', allowHandCast: true, sacrificeOblivionRate: 70,
  },
];