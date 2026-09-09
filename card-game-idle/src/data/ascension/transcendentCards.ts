import type { CardDefinition } from '@/types/cards';

const transcendentLight: CardDefinition = {
	definitionId: 'tx-neutral-starbound-glimmer', type: 'Light', rarity: 'Transcendent',
	name: 'Starbound Glimmer',
	description: 'Two apex attacks with exceptional triune scaling and a high-impact Soph burst.',
	artKey: 'tx_neutral_starbound_glimmer',
	ainAttack: { id: 'tx-neutral-starbound-glimmer:ain-attack', label: 'Ain', name: 'Ain Attack', description: '1250 base Divine Light with triune scaling.', baseOblivion: 1250, cooldownCards: 4, scaling: { kind: 'triune', amount: 900 }, tags: ['transcendent', 'ain-attack'] },
	sophAttack: { id: 'tx-neutral-starbound-glimmer:soph-attack', label: 'Soph', name: 'Soph Attack', description: '1900 base Divine Light with triune scaling; consumes 5 stacks.', baseOblivion: 1900, cooldownCards: 5, scaling: { kind: 'triune', amount: 1200 }, stackCost: { kind: 'fixed', value: 5 }, tags: ['transcendent', 'soph-attack'] },
	sacrificeOblivionRate: 120,
};

const transcendentDark: CardDefinition[] = [
	{
		definitionId: 'tx-neutral-null-catalyst', type: 'Dark', rarity: 'Transcendent', name: 'Null Catalyst',
		description: 'Search a Light card and a Dark card. When activated from the board, this card remains in play and can be used again after its cooldown.', artKey: 'tx_neutral_null_catalyst',
		sophEffects: [{ type: 'search_deck_distinct_types', filter: ['Light', 'Dark'], takePerType: 1 }], activationCost: { kind: 'fixed', value: 5 }, cooldownCardsPlayed: 3, postActivationFate: 'hand', allowHandCast: true, sacrificeOblivionRate: 125, persistent: true,
	},
	{
		definitionId: 'tx-neutral-void-reliquary', type: 'Dark', rarity: 'Transcendent', name: 'Void Reliquary',
		description: 'Recover any card from the discard pile. This card remains in play after board activation and can be used again after its cooldown.', artKey: 'tx_neutral_void_reliquary',
		sophEffects: [{ type: 'salvage_any' }], activationCost: { kind: 'fixed', value: 6 }, cooldownCardsPlayed: 4, postActivationFate: 'deck', allowHandCast: false, sacrificeOblivionRate: 135, persistent: true,
	},
];

const transcendentAur: CardDefinition = {
	definitionId: 'tx-angel-starbound-null-archangel', type: 'AinSophAur', rarity: 'Transcendent', name: 'Starbound Null Archangel',
	description: 'Sacrifice 3 back-row cards to summon, then use Bridge the Light for an apex triune Divine Light payout.', artKey: 'tx_angel_starbound_null_archangel',
	summonCost: ['light-neutrality-1', 'light-neutrality-2', 'dark-neutrality-1'], onSummonEffects: [{ type: 'oblivion_flat', value: 300 }],
	bridgeAttack: { id: 'tx-angel-starbound-null-archangel:bridge-the-light', name: 'Bridge the Light', description: '2400 base Divine Light with triune scaling; consumes 6 stacks.', baseOblivion: 2400, cooldownCards: 5, scaling: { kind: 'triune', amount: 1800 }, consumesStacks: { kind: 'fixed', value: 6 } },
	attacks: { primary: { id: 'tx-angel-starbound-null-archangel:bridge', label: 'Primary', name: 'Bridge the Light', description: '2400 base Divine Light', baseOblivion: 2400, cooldownCards: 5, tags: ['transcendent', 'bridge'] } },
	baseStats: { basePower: 150, bonusType: 'oblivion_per_card', bonusValue: 40 },
};

export const transcendentCardDefinitions: CardDefinition[] = [transcendentLight, ...transcendentDark, transcendentAur];
export const TRANSCENDENT_ANGEL_IDS: ReadonlySet<string> = new Set(transcendentCardDefinitions.map(card => card.definitionId));
export const TRANSCENDENT_SHOP_IDS: ReadonlySet<string> = new Set(['tx-neutral-starbound-glimmer', 'tx-neutral-null-catalyst', 'tx-neutral-void-reliquary']);
export const TRANSCENDENT_SHOP_COSTS: Readonly<Record<string, number>> = {
	'tx-neutral-starbound-glimmer': 1200,
	'tx-neutral-null-catalyst': 1000,
	'tx-neutral-void-reliquary': 1400,
};
