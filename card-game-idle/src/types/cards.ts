import type { CardEffect } from './effects';

export type CardType = 'AinSophAur' | 'Light' | 'Dark';
export type CardClass = 'light' | 'dark' | 'ain-soph-aur';
export type CardRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Enigmatic' | 'Eternal' | 'Infinite' | 'Transcendent';
export type CardFinish = 'normal' | 'holo';
export type CardFaceState = 'front' | 'back';
export type CardSide = 'ain' | 'soph';

export type CardScalingExpr =
  | { readonly kind: 'constant'; readonly value: number }
  | { readonly kind: 'linear'; readonly reads: 'limitlessLightStacks' | 'asaFrontCount' | 'collectionPower'; readonly multiplier: number; readonly offset?: number }
  | { readonly kind: 'stepped'; readonly reads: 'limitlessLightStacks' | 'asaFrontCount' | 'collectionPower'; readonly step: number; readonly amount: number; readonly offset?: number }
  // Weights Limitless Light Stacks, summoned Ain Soph Aur, and Collection Power equally.
  | { readonly kind: 'triune'; readonly amount: number }
  | { readonly kind: 'custom'; readonly fnId: string };

export interface StackCostDefinition {
  readonly kind: 'fixed' | 'percentage' | 'range';
  readonly value?: number;
  readonly min?: number;
  readonly max?: number;
}

export interface LightAttackDefinition extends AttackDefinition {
  readonly scaling: CardScalingExpr;
  readonly stackCost?: StackCostDefinition;
}

export interface LightCardDefinition {
  readonly definitionId: string;
  readonly type: 'Light';
  readonly rarity: CardRarity;
  readonly name: string;
  readonly description: string;
  readonly artKey: string;
  readonly ainAttack: LightAttackDefinition;
  readonly sophAttack: LightAttackDefinition;
  readonly onFlipEffects?: CardEffect[];
  readonly sacrificeOblivionRate: number;
}

export interface DarkCardDefinition {
  readonly definitionId: string;
  readonly type: 'Dark';
  readonly rarity: CardRarity;
  readonly name: string;
  readonly description: string;
  readonly artKey: string;
  readonly sophEffects: CardEffect[];
  readonly activationCost: StackCostDefinition;
  readonly cooldownCardsPlayed?: number;
  readonly postActivationFate: 'hand' | 'deck' | 'discard';
  readonly allowHandCast: boolean;
  readonly sacrificeOblivionRate: number;
  readonly persistent?: boolean;
}

export interface MainDeckBoardInstance {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly type: 'Light' | 'Dark';
  readonly rarity: CardRarity;
  readonly finish: CardFinish;
  side: CardSide;
  faceState: CardFaceState;
  limitlessCharge: number;
  attackCooldowns: Record<string, number>;
  backSlot: 0 | 1 | 2 | 3 | null;
  readonly durability?: number;
}

export interface AttackCost {
  readonly type: 'discard_from_hand';
  readonly value: number;
}

export interface AttackDefinition<TLabel extends string = string> {
  readonly id: string;
  readonly label: TLabel;
  readonly name: string;
  readonly description: string;
  readonly baseOblivion: number;
  readonly cooldownCards: number;
  readonly costs?: AttackCost[];
  readonly tags?: string[];
}

export interface AinSophAurInstance {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly type: 'AinSophAur';
  readonly rarity: CardRarity;
  readonly finish: CardFinish;
  faceState: CardFaceState;
  side: CardSide;
  cardClass?: CardClass;
  limitlessCharge: number;
  attackCooldowns: Record<string, number>;
  boardSlot: 0 | 1 | 2 | 3 | null;
}

export interface AinSophAurDefinition {
  readonly definitionId: string;
  readonly type: 'AinSophAur';
  readonly rarity: CardRarity;
  readonly name: string;
  readonly description: string;
  readonly artKey: string;
  readonly summonCost: string[];
  readonly effects?: CardEffect[];
  readonly onSummonEffects: CardEffect[];
  readonly onPlayEffects?: CardEffect[];
  readonly attacks?: Record<string, AttackDefinition>;
  readonly bridgeAttack?: {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly baseOblivion: number;
    readonly cooldownCards: number;
    readonly scaling: CardScalingExpr;
    readonly consumesStacks?: StackCostDefinition;
  };
  readonly baseStats?: { basePower: number; bonusType?: string; bonusValue?: number };
}

export type CardDefinition = LightCardDefinition | DarkCardDefinition | AinSophAurDefinition;
export type DeckCardInstance = MainDeckBoardInstance | AinSophAurInstance;
