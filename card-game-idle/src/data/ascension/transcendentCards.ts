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
export const TRANSCENDENT_ABILITY = 'Transcendent Ability: If this card is in your deck, your maximum hand size is now 10.';

const transcendentLight: CardDefinition = {
	definitionId: 'tx-neutral-starbound-glimmer', type: 'Light', rarity: 'Transcendent',
	name: 'Light Before the First Star',
	description: `${TRANSCENDENT_ABILITY} When this card is placed on its Soph side, draw 3 cards. If at least 2 drawn cards are Light, draw 1 additional card; if at least 2 drawn cards are Dark, gain 8,000 Divine Light with Collection Power scaling.`,
	artKey: 'tx_neutral_starbound_glimmer',
	sacrificeStackRate: 100,
	ainAttack: { id: 'tx-neutral-starbound-glimmer:ain-attack', label: 'Ain', name: 'The First Dawn', description: '50,000 base Divine Light. No resource scaling.', baseDivineLight: 50_000, cooldownCards: 2, scaling: { kind: 'constant', value: 0 }, tags: ['transcendent', 'ain-attack'] },
	sophAttack: { id: 'tx-neutral-starbound-glimmer:soph-attack', label: 'Soph', name: 'Before Any Star', description: '90,000 base Divine Light. No resource cost or set-specific scaling.', baseDivineLight: 90_000, cooldownCards: 3, scaling: { kind: 'constant', value: 0 }, tags: ['transcendent', 'soph-attack'] },
	sophPlacementEffects: [{ type: 'draw_with_type_bonuses', value: 3, drawFilter: 'Light', drawThreshold: 2, bonusDraw: 1, gainFilter: 'Dark', gainThreshold: 2, gainDivineLight: 8_000 }],
};

const transcendentDark: CardDefinition[] = [
	{
		definitionId: 'tx-neutral-null-catalyst', type: 'Dark', rarity: 'Transcendent', name: 'The First Catalyst',
		description: `${TRANSCENDENT_ABILITY} Look at the top and bottom card of your deck, exchange their positions, then draw 2 cards. If at least 1 drawn card is Dark, draw 1 additional card.`,
		artKey: 'tx_neutral_null_catalyst',
		sophEffects: [{ type: 'exchange_deck_ends' }, { type: 'draw_with_type_bonus', value: 2, filter: ['Dark'], bonusDraw: 1 }],
		activationCost: { kind: 'fixed', value: 0 }, cooldownCardsPlayed: 0, postActivationFate: 'discard', sacrificeStackRate: 100, persistent: false,
	},
	{
		definitionId: 'tx-neutral-void-reliquary', type: 'Dark', rarity: 'Transcendent', name: 'The Reliquary of All and Nothing',
		description: `${TRANSCENDENT_ABILITY} Salvage either 2 Light cards or 2 Dark cards from your discard pile. Salvaging 2 Light cards grants 3 Limitless Light Stacks; salvaging 2 Dark cards searches your deck for 1 Light or Dark card.`,
		artKey: 'tx_neutral_void_reliquary',
		sophEffects: [{ type: 'salvage_either_light_or_dark', count: 2, lightStacks: 3 }],
		activationCost: { kind: 'fixed', value: 0 }, cooldownCardsPlayed: 0, postActivationFate: 'discard', sacrificeStackRate: 100, persistent: false,
	},
];

const transcendentAur: CardDefinition = {
	definitionId: 'tx-angel-starbound-null-archangel', type: 'AinSophAur', rarity: 'Transcendent', name: 'The Bridge Between Light and Life',
	description: `${TRANSCENDENT_ABILITY} When summoned, draw 4 cards and search your deck for 1 Light card, 1 Dark card, and 1 Ain Soph Aur card.`,
	artKey: 'tx_angel_starbound_null_archangel',
	summonMaterialCount: 3, onSummonEffects: [{ type: 'draw', value: 4 }, { type: 'search_deck_distinct_types', filter: ['Light', 'Dark', 'AinSophAur'], takePerType: 1 }],
	summonMaterials: [{ cardTypes: ['Light'], count: 2 }, { cardTypes: ['Dark'], count: 1 }],
	bridgeAttack: { id: 'tx-angel-starbound-null-archangel:bridge-the-light', name: 'Bridge the Light', description: '150,000 base Divine Light. No resource cost or set-specific scaling.', baseDivineLight: 150_000, cooldownCards: 2, scaling: { kind: 'constant', value: 0 } },
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

