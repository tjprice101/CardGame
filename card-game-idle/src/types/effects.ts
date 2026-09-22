export type BoardEffectType =
  | 'score_multiplier';

export type BoardEffect =
  | { type: 'score_multiplier'; value: number };

export type CardSubtypeFilter = 'AinSophAur' | 'Light' | 'Dark';

export type ImmediateEffect =
  | { type: 'divine_light_flat'; value: number }
  | { type: 'cosmos_flat'; value: number }
  | { type: 'convert_light_to_cosmos'; lightCost: number; cosmosGain: number }
  | { type: 'consume_cosmos'; value: number }
  | { type: 'light_stacks_flat'; value: number }
  | { type: 'score_flat'; value: number }
  | { type: 'draw'; value: number }
  | { type: 'draw_with_type_bonus'; value: number; filter: CardSubtypeFilter[]; bonusDraw: number }
  | { type: 'draw_with_type_bonuses'; value: number; drawFilter: CardSubtypeFilter; drawThreshold: number; bonusDraw: number; gainFilter: CardSubtypeFilter; gainThreshold: number; gainDivineLight: number }
  | { type: 'exchange_deck_ends' }
  | { type: 'discard_choice'; value: number }
  | { type: 'discard_draw'; discard: number; draw: number }
  | { type: 'exchange_hand_for_opposite' }
  | { type: 'shuffle_discard' }
  | { type: 'look_top_take'; look: number; take: number }
  | { type: 'look_top_take_drop'; look: number; take: number; drop: number }
  | { type: 'look_top_take_type'; look: number; filter: CardSubtypeFilter[]; take?: number }
  | { type: 'search_deck_by_type'; filter: CardSubtypeFilter[] }
  | { type: 'search_deck_distinct_types'; filter: CardSubtypeFilter[]; takePerType?: number }
  | { type: 'salvage_by_type'; filter: CardSubtypeFilter[] }
  | { type: 'salvage_by_type_count'; filter: CardSubtypeFilter[]; count: number }
  | { type: 'salvage_either_light_or_dark'; count: number; lightStacks: number }
  | { type: 'salvage_any' }
  | { type: 'salvage_by_id'; targetId: string; label?: string };

export type EffectCondition =
  | { type: 'cards_played_gte'; value: number }
  | { type: 'first_card_this_turn' }
  | { type: 'light_stacks_gte'; value: number }
  | { type: 'cosmos_gte'; value: number };

export interface ConditionalEffect {
  type: 'conditional';
  condition: EffectCondition;
  then: CardEffect[];
}

export type CoreCardEffect = BoardEffect | ImmediateEffect | ConditionalEffect;

export type CardEffect = CoreCardEffect;

export interface ActiveBoardEffect {
  type: BoardEffectType;
  value: number;
}
