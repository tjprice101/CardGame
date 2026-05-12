import type { Element } from './elements';
import type { CardEffect, ChaosPassiveEffect, ChaosRitualEffect } from './effects';

export type CardType = 'Seeker' | 'Chaos' | 'Seraphim' | 'Angel';
export type CardRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Eternal';

export const SERAPHIM_BONUS_TYPES = [
  // Neutrality bonus types
  'oblivion_per_card',
  'chain_bonus',
  'seeker_bonus',
  'chaos_extra_plays',
  'chaos_expire_bonus',
  // Pyroabyss bonus types
  'ember_per_card',
  // Legacy Light bonus types (no-op until Light rework)
  'power_amplifier',
  'score_per_second',
  'resource_generation',
  'tick_acceleration',
] as const;
export type SeraphimBonusType = typeof SERAPHIM_BONUS_TYPES[number];
export type AngelBonusType = SeraphimBonusType | 'power_per_seraphim' | 'oblivion_per_card' | 'oblivion_per_seraphim';

// ── Angel (summoned from extra deck, occupies a front board slot) ─────────────

export interface AngelBoardStats {
  basePower: number;       // legacy field; used for on-board Oblivion bonus
  bonusType: AngelBonusType;
  bonusValue: number;
}

export interface AngelActivatedAbility {
  readonly name: string;
  readonly cardsPlayedRequirement: number;
  readonly description: string;
  readonly effects: CardEffect[];
}

export interface AngelDefinition {
  readonly definitionId: string;
  readonly type: 'Angel';
  readonly element: Element;
  readonly rarity: CardRarity;
  readonly name: string;
  readonly description: string;
  readonly artKey: string;
  readonly summonCost: string[];              // front-row definitionIds required on board (dupes = multiple)
  readonly extraSummonConditions?: SummonCondition[];  // additional board conditions beyond Seraphim cost
  readonly onSummonEffects: CardEffect[];     // fires immediately on summoning
  readonly activatedAbility: AngelActivatedAbility;
  readonly baseStats: AngelBoardStats;
}

// Additional summon conditions beyond seraphimIds in summonCost
export type SummonCondition =
  | { type: 'chaos_active_gte'; value: number }   // N or more Chaos cards in backSlots
  | { type: 'seraphim_on_board_gte'; value: number }; // N or more Seraphim on frontSlots (total)

export interface AngelInstance {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly type: 'Angel';
  readonly element: Element;
  readonly rarity: CardRarity;
  level: number;
  cardsPlayedSinceSummon: number;
  activated: boolean;
  boardSlot: 0 | 1 | 2 | 3 | 4 | null;
}

// ── Seraphim stats (passive bonuses when in synergy) ─────────────────────────

export interface SeraphimStats {
  bonusType: SeraphimBonusType;
  bonusValue: number;
  synergyRequirement: Element;
}

// ── Chaos Definition (placed in back row, expires after N card plays) ─────────

export interface ChaosDefinition {
  readonly definitionId: string;
  readonly type: 'Chaos';
  readonly element: Element;
  readonly rarity: CardRarity;
  readonly name: string;
  readonly description: string;
  readonly artKey: string;
  readonly maxDurability: number;   // cards-played until auto-expiry
  readonly effects: ChaosPassiveEffect[];  // passive bonuses applied to adjacent frontSlots Seraphim
  readonly enthalpy?: ChaosRitualEffect[]; // on-play: fires immediately when placed on the back row
  readonly entropy?: ChaosRitualEffect[];  // on-expiration: fires when durability reaches 0
}

export interface ChaosInstance {
  instanceId: string;
  definitionId: string;
  readonly type: 'Chaos';
  readonly element: Element;
  readonly rarity: CardRarity;
  readonly level: 1;
  durability: number;               // remaining plays before expiry
  readonly maxDurability: number;
  backSlot: 0 | 1 | 2 | 3 | null;
}

// ── Seeker Definition (hand-played utility cards, sent to discard after play) ──

export interface SeekerDefinition {
  readonly definitionId: string;
  readonly type: 'Seeker';
  readonly element: Element;
  readonly rarity: CardRarity;
  readonly name: string;
  readonly description: string;
  readonly artKey: string;
  readonly effects: CardEffect[];
}

export interface SeekerInstance {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly type: 'Seeker';
  readonly element: Element;
  readonly rarity: CardRarity;
  level: number;
}

// ── Seraphim Definition ───────────────────────────────────────────────────────

export interface SeraphimDefinition {
  readonly definitionId: string;
  readonly type: 'Seraphim';
  readonly element: Element;
  readonly rarity: CardRarity;
  readonly name: string;
  readonly description: string;
  readonly artKey: string;
  readonly baseStats: SeraphimStats;
  readonly onPlayEffects: CardEffect[];
}

export interface SeraphimInstance {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly type: 'Seraphim';
  readonly element: Element;
  readonly rarity: CardRarity;
  level: number;
  isActive: boolean;
  boardSlot: 0 | 1 | 2 | 3 | 4 | null;
}

export type CardDefinition = AngelDefinition | SeekerDefinition | ChaosDefinition | SeraphimDefinition;

export type DeckCardInstance = SeekerInstance | SeraphimInstance;
