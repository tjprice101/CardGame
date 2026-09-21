import type { CardDefinition } from '@/types/cards';

// ── Forge of Transcendence — the 4 live Transcendent-rarity cards (2026-09) ──
// These no longer belong to any playable set/board flow; they are gallery
// pieces inside the Forge of Transcendence. IDs are kept stable for save
// compatibility with `transcendentCollection`. See
// src/data/forge/forgeDefinitions.ts for lore and
// "Midjourney Art/Forge of Transcendence Prompts.md" for the art brief.
//
// All 4 share one innate passive, restated verbatim on every card instead of
// a unique wall of text: if the card is anywhere in your deck or Extra Deck,
// your maximum hand size becomes 10 (up from 8). That check lives in
// `getMaxHandSize` in src/state/store.ts, keyed off `TRANSCENDENT_ANGEL_IDS`.
const TRANSCENDENT_ABILITY = 'Transcendent Ability: If this card is in your deck, your maximum hand size is now 10.';

const transcendentLight: CardDefinition = {
	definitionId: 'tx-neutral-starbound-glimmer', type: 'Light', rarity: 'Transcendent',
	name: 'Light Before the First Star',
	description: `${TRANSCENDENT_ABILITY} The first light that was not born of any star.`,
	artKey: 'tx_neutral_starbound_glimmer',
	sacrificeStackRate: 100,
	ainAttack: { id: 'tx-neutral-starbound-glimmer:ain-attack', label: 'Ain', name: 'The First Dawn', description: '45,000 base Divine Light with extreme triune scaling.', baseDivineLight: 45_000, cooldownCards: 2, scaling: { kind: 'triune', amount: 28_000 }, tags: ['transcendent', 'ain-attack'] },
	sophAttack: { id: 'tx-neutral-starbound-glimmer:soph-attack', label: 'Soph', name: 'Before Any Star', description: '75,000 base Divine Light with extreme triune scaling; consumes 8 stacks.', baseDivineLight: 75_000, cooldownCards: 3, scaling: { kind: 'triune', amount: 48_000 }, stackCost: { kind: 'fixed', value: 8 }, tags: ['transcendent', 'soph-attack'] },
	sophPlacementEffects: [{ type: 'light_stacks_flat', value: 6 }],
};

const transcendentDark: CardDefinition[] = [
	{
		definitionId: 'tx-neutral-null-catalyst', type: 'Dark', rarity: 'Transcendent', name: 'The First Catalyst',
		description: `${TRANSCENDENT_ABILITY} Draw 2; consume 3 Cosmos for 55,000 Divine Light and 12 Light Stacks.`,
		artKey: 'tx_neutral_null_catalyst',
		sophEffects: [{ type: 'draw', value: 2 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 3 }, then: [{ type: 'consume_cosmos', value: 3 }, { type: 'divine_light_flat', value: 55_000 }, { type: 'light_stacks_flat', value: 12 }] }],
		activationCost: { kind: 'fixed', value: 3 }, cooldownCardsPlayed: 5, postActivationFate: 'hand', sacrificeStackRate: 100, persistent: true,
	},
	{
		definitionId: 'tx-neutral-void-reliquary', type: 'Dark', rarity: 'Transcendent', name: 'The Reliquary of All and Nothing',
		description: `${TRANSCENDENT_ABILITY} Recover one card of every family; consume 3 Cosmos to search all three families and gain 65,000 Divine Light.`,
		artKey: 'tx_neutral_void_reliquary',
		sophEffects: [{ type: 'salvage_by_type_count', filter: ['Light', 'Dark', 'AinSophAur'], count: 3 }, { type: 'conditional', condition: { type: 'cosmos_gte', value: 3 }, then: [{ type: 'consume_cosmos', value: 3 }, { type: 'search_deck_distinct_types', filter: ['Light', 'Dark', 'AinSophAur'], takePerType: 1 }, { type: 'divine_light_flat', value: 65_000 }] }],
		activationCost: { kind: 'fixed', value: 3 }, cooldownCardsPlayed: 6, postActivationFate: 'hand', sacrificeStackRate: 100, persistent: true,
	},
];

const transcendentAur: CardDefinition = {
	definitionId: 'tx-angel-starbound-null-archangel', type: 'AinSophAur', rarity: 'Transcendent', name: 'The Bridge Between Light and Life',
	description: `${TRANSCENDENT_ABILITY} The one that bridged the light so life could exist at all.`,
	artKey: 'tx_angel_starbound_null_archangel',
	summonMaterialCount: 3, onSummonEffects: [{ type: 'light_stacks_flat', value: 10 }],
	summonMaterials: [{ cardTypes: ['Light'], count: 2 }, { cardTypes: ['Dark'], count: 1 }],
	bridgeAttack: { id: 'tx-angel-starbound-null-archangel:bridge-the-light', name: 'Bridge the Light', description: '120,000 base Divine Light with overwhelming triune scaling; consumes 10 stacks.', baseDivineLight: 120_000, cooldownCards: 2, scaling: { kind: 'triune', amount: 75_000 }, consumesStacks: { kind: 'fixed', value: 10 } },
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

