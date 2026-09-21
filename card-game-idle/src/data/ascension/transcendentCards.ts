import type { CardDefinition } from '@/types/cards';

// ── Forge of Transcendence — blank-slate placeholders (2026-09) ──────────
// These 4 definitions are the only live Transcendent-rarity cards. They no
// longer belong to any playable set/board flow; they are gallery pieces
// inside the Forge of Transcendence, pending final name/art/lore/effects.
// IDs are kept stable for save compatibility with `transcendentCollection`.
// See src/data/forge/forgeDefinitions.ts for lore stubs and
// "Midjourney Art/Forge of Transcendence Prompts.md" for the art brief.

const transcendentLight: CardDefinition = {
	definitionId: 'tx-neutral-starbound-glimmer', type: 'Light', rarity: 'Transcendent',
	name: '[PH] Card 1',
	description: 'To be redesigned.',
	artKey: 'tx_neutral_starbound_glimmer',
	sacrificeStackRate: 0,
	ainAttack: { id: 'tx-neutral-starbound-glimmer:ain-attack', label: 'Ain', name: 'Ain Attack', description: 'To be redesigned.', baseDivineLight: 0, cooldownCards: 99, scaling: { kind: 'constant', value: 0 }, tags: ['transcendent', 'ain-attack'] },
	sophAttack: { id: 'tx-neutral-starbound-glimmer:soph-attack', label: 'Soph', name: 'Soph Attack', description: 'To be redesigned.', baseDivineLight: 0, cooldownCards: 99, scaling: { kind: 'constant', value: 0 }, tags: ['transcendent', 'soph-attack'] },
};

const transcendentDark: CardDefinition[] = [
	{
		definitionId: 'tx-neutral-null-catalyst', type: 'Dark', rarity: 'Transcendent', name: '[PH] Card 2',
		description: 'To be redesigned.', artKey: 'tx_neutral_null_catalyst',
		sophEffects: [], activationCost: { kind: 'fixed', value: 0 }, cooldownCardsPlayed: 99, postActivationFate: 'hand', sacrificeStackRate: 0, persistent: true,
	},
	{
		definitionId: 'tx-neutral-void-reliquary', type: 'Dark', rarity: 'Transcendent', name: '[PH] Card 3',
		description: 'To be redesigned.', artKey: 'tx_neutral_void_reliquary',
		sophEffects: [], activationCost: { kind: 'fixed', value: 0 }, cooldownCardsPlayed: 99, postActivationFate: 'deck', sacrificeStackRate: 0, persistent: true,
	},
];

const transcendentAur: CardDefinition = {
	definitionId: 'tx-angel-starbound-null-archangel', type: 'AinSophAur', rarity: 'Transcendent', name: '[PH] Card 4',
	description: 'To be redesigned.', artKey: 'tx_angel_starbound_null_archangel',
	summonMaterialCount: 3, onSummonEffects: [],
	summonMaterials: [{ cardTypes: ['Light'], count: 2 }, { cardTypes: ['Dark'], count: 1 }],
	bridgeAttack: { id: 'tx-angel-starbound-null-archangel:bridge-the-light', name: 'Bridge the Light', description: 'To be redesigned.', baseDivineLight: 0, cooldownCards: 99, scaling: { kind: 'constant', value: 0 } },
};

export const transcendentCardDefinitions: CardDefinition[] = [transcendentLight, ...transcendentDark, transcendentAur];
export const TRANSCENDENT_ANGEL_IDS: ReadonlySet<string> = new Set(transcendentCardDefinitions.map(card => card.definitionId));
// Legacy Ascension/Null Raid shop wiring — kept only so store.ts/AscensionHub.tsx
// keep compiling until that mode is fully removed in a dedicated follow-up pass.
export const TRANSCENDENT_SHOP_IDS: ReadonlySet<string> = new Set(['tx-neutral-starbound-glimmer', 'tx-neutral-null-catalyst', 'tx-neutral-void-reliquary']);
export const TRANSCENDENT_SHOP_COSTS: Readonly<Record<string, number>> = {
	'tx-neutral-starbound-glimmer': 1200,
	'tx-neutral-null-catalyst': 1000,
	'tx-neutral-void-reliquary': 1400,
};

