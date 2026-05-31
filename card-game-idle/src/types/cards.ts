import type { Element } from './elements';
import type { CardEffect, CherubimPassiveEffect, EternalStackKind, SetSecondaryKind } from './effects';
import type { SnowboundPhase } from './game';

export type CardType = 'Ophanim' | 'Cherubim' | 'Seraphim' | 'Angel';
export type CardRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Eternal' | 'Infinite';
export type CardFinish = 'normal' | 'holo';
export type CardFaceState = 'front' | 'back';
export type PrismaticDepth = 1 | 2 | 3 | 4 | 5;
export type BurningGardenPhase = 'Bloom' | 'Burn';

export const SERAPHIM_BONUS_TYPES = [
  'oblivion_per_card',
  'ophanim_bonus',
  'cherubim_extra_plays',
  'cherubim_expire_bonus',
  'ember_per_card',
  'power_amplifier',
  'score_per_second',
  'resource_generation',
  'tick_acceleration',
] as const;
export type SeraphimBonusType = typeof SERAPHIM_BONUS_TYPES[number];
export type AngelBonusType = SeraphimBonusType | 'power_per_seraphim' | 'oblivion_per_card' | 'oblivion_per_seraphim';

export interface AngelBoardStats {
  basePower: number;
  bonusType: AngelBonusType;
  bonusValue: number;
}

export interface AngelActivatedAbility {
  readonly name: string;
  readonly cardsPlayedRequirement: number;
  readonly description: string;
  readonly effects: CardEffect[];
}

export type AttackCostType =
  | 'discard_from_hand'
  | 'sacrifice_seraphim'
  | 'sacrifice_angel'
  | 'spend_embers'
  | 'spend_radiance'
  | 'spend_trail'
  | 'spend_strain';

export interface AttackCost {
  readonly type: AttackCostType;
  readonly value: number;
}

export type SeraphimAttackLabel = 'Synergized' | 'Unsynergized';
export type AngelAttackLabel = 'Primary' | 'Exalted';

export interface AttackDefinition<TLabel extends string = string> {
  readonly id: string;
  readonly label: TLabel;
  readonly name: string;
  readonly description: string;
  readonly baseOblivion: number;
  readonly cooldownCards: number;
  readonly costs?: AttackCost[];
  readonly requiresAngelOnBoard?: boolean;
  readonly tags?: string[];
}

export interface SeraphimAttackSet {
  readonly unsynergized: AttackDefinition<SeraphimAttackLabel>;
  readonly synergized: AttackDefinition<SeraphimAttackLabel>;
}

export interface AngelAttackSet {
  readonly primary: AttackDefinition<AngelAttackLabel>;
  readonly exalted: AttackDefinition<AngelAttackLabel>;
}

export type SummonCondition =
  | { type: 'cherubim_active_gte'; value: number }
  | { type: 'seraphim_on_board_gte'; value: number }
  | { type: 'board_definition_gte'; definitionId: string; value: number }
  | { type: 'equilibrium_sigils_gte'; value: number }
  | { type: 'pyro_heat_gte'; value: number }
  | { type: 'eternal_stack_gte'; stack: EternalStackKind; value: number }
  | { type: 'set_secondary_gte'; kind: SetSecondaryKind; value: number };

export interface AngelDefinition {
  readonly definitionId: string;
  readonly type: 'Angel';
  readonly element: Element;
  readonly rarity: CardRarity;
  readonly snowboundPhase?: SnowboundPhase;
  readonly prismaticDepth?: PrismaticDepth;
  readonly name: string;
  readonly description: string;
  readonly artKey: string;
  readonly summonCost: string[];
  readonly extraSummonConditions?: SummonCondition[];
  readonly onSummonEffects: CardEffect[];
  readonly activatedAbility: AngelActivatedAbility;
  readonly attacks?: AngelAttackSet;
  readonly attackTags?: string[];
  readonly baseStats: AngelBoardStats;
}

export interface AngelInstance {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly type: 'Angel';
  readonly element: Element;
  readonly rarity: CardRarity;
  readonly finish: CardFinish;
  faceState?: CardFaceState;
  prismaticDepth?: PrismaticDepth;
  spectrumTokens?: number;
  burningGardenPhase?: BurningGardenPhase;
  chromaticCounters?: number;
  chromaticSources?: string[];
  burnTurnsRemaining?: number;
  isEcho?: boolean;
  level: number;
  cardsPlayedSinceSummon: number;
  activated: boolean;
  attackCooldowns: Record<string, number>;
  boardSlot: 0 | 1 | 2 | 3 | 4 | null;
  patienceStacks?: number;
}

export interface SeraphimStats {
  bonusType: SeraphimBonusType;
  bonusValue: number;
  synergyRequirement: Element;
}

export interface SeraphimDefinition {
  readonly definitionId: string;
  readonly type: 'Seraphim';
  readonly element: Element;
  readonly rarity: CardRarity;
  readonly snowboundPhase?: SnowboundPhase;
  readonly prismaticDepth?: PrismaticDepth;
  readonly name: string;
  readonly description: string;
  readonly artKey: string;
  readonly baseStats: SeraphimStats;
  readonly attacks?: SeraphimAttackSet;
  readonly attackTags?: string[];
  readonly onPlayEffects: CardEffect[];
  readonly patienceThreshold?: number;
  readonly patienceThresholdDraw?: number;
}

export interface SeraphimInstance {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly type: 'Seraphim';
  readonly element: Element;
  readonly rarity: CardRarity;
  readonly finish: CardFinish;
  faceState?: CardFaceState;
  prismaticDepth?: PrismaticDepth;
  spectrumTokens?: number;
  burningGardenPhase?: BurningGardenPhase;
  chromaticCounters?: number;
  chromaticSources?: string[];
  burnTurnsRemaining?: number;
  isEcho?: boolean;
  level: number;
  isActive: boolean;
  attackCooldowns: Record<string, number>;
  boardSlot: 0 | 1 | 2 | 3 | 4 | null;
  patienceStacks?: number;
}

export interface CherubimDiscardCondition {
  readonly type: 'hand_size_lte' | 'chain_lte' | 'oblivion_lte' | 'embers_lte' | 'radiance_lte' | 'cards_played_gte' | 'seraphim_count_lte' | 'trail_lte' | 'strain_gte';
  readonly value: number;
  readonly description: string;
}

export interface CherubimDefinition {
  readonly definitionId: string;
  readonly type: 'Cherubim';
  readonly element: Element;
  readonly rarity: CardRarity;
  readonly snowboundPhase?: SnowboundPhase;
  readonly prismaticDepth?: PrismaticDepth;
  readonly name: string;
  readonly description: string;
  readonly artKey: string;
  readonly effects: CherubimPassiveEffect[];
  readonly onPlayEffects: CardEffect[];
  readonly maxDurability?: number;
  readonly discardCondition?: CherubimDiscardCondition;
}

export interface CherubimInstance {
  instanceId: string;
  definitionId: string;
  readonly type: 'Cherubim';
  readonly element: Element;
  readonly rarity: CardRarity;
  readonly finish: CardFinish;
  faceState?: CardFaceState;
  prismaticDepth?: PrismaticDepth;
  spectrumTokens?: number;
  burningGardenPhase?: BurningGardenPhase;
  chromaticCounters?: number;
  chromaticSources?: string[];
  burnTurnsRemaining?: number;
  isEcho?: boolean;
  readonly level: 1;
  backSlot: 0 | 1 | 2 | 3 | null;
  durability?: number;
  readonly maxDurability?: number;
}

export interface OphanimDefinition {
  readonly definitionId: string;
  readonly type: 'Ophanim';
  readonly element: Element;
  readonly rarity: CardRarity;
  readonly snowboundPhase?: SnowboundPhase;
  readonly prismaticDepth?: PrismaticDepth;
  readonly name: string;
  readonly description: string;
  readonly artKey: string;
  readonly effects: CardEffect[];
}

export interface OphanimInstance {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly type: 'Ophanim';
  readonly element: Element;
  readonly rarity: CardRarity;
  readonly finish: CardFinish;
  faceState?: CardFaceState;
  burningGardenPhase?: BurningGardenPhase;
  chromaticCounters?: number;
  chromaticSources?: string[];
  burnTurnsRemaining?: number;
  isEcho?: boolean;
  level: number;
}

export type CardDefinition = AngelDefinition | OphanimDefinition | CherubimDefinition | SeraphimDefinition;
export type DeckCardInstance = OphanimInstance | SeraphimInstance | CherubimInstance;
