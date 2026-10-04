export type BoardEffectType =
  | 'score_multiplier';

export type BoardEffect =
  | { type: 'score_multiplier'; value: number };

export type CardSubtypeFilter = 'AinSophAur' | 'Light' | 'Dark';

export type ImmediateEffect =
  | { type: 'neutrality_stack_resonance'; perStack: number; cap: number }
  | { type: 'neutrality_abyss_reclaim'; count: number }
  | { type: 'neutrality_charge_release'; cap: number; divineLightPerCharge: number }
  | { type: 'neutrality_charge_grant'; value: number }
  | { type: 'neutrality_cooldown_reduction'; value: number; stackPerCard: number; cap: number }
  | { type: 'neutrality_equilibrium'; divineLightPerPair: number; stacksPerPair: number }
  | { type: 'inferno_gain'; value: number }
  | { type: 'inferno_board_kindle'; perCard: number; side: 'ain' | 'soph' | 'any' }
  | { type: 'inferno_embers'; value: number }
  | { type: 'inferno_charge_forge'; charge: number; perCharged: number }
  | { type: 'inferno_ash_cycle'; count: number; perCard: number }
  | { type: 'inferno_recall'; count: number; minInferno: number; perCard: number }
  | { type: 'inferno_threshold_draw'; threshold: number; belowGain: number; draw: number }
  | { type: 'inferno_rekindle'; fraction: number; minimum: number }
  | { type: 'inferno_next_gain'; multiplier: number; kindle: number }
  | { type: 'inferno_pressure'; divisor: number; perStep: number; cap: number }
  | { type: 'inferno_temper'; perStack: number; cap: number }
  | { type: 'inferno_balance'; perPair: number; unmatchedGain: number }
  | { type: 'inferno_eruption'; threshold: number; divineLight: number; kindle: number }
  | { type: 'inferno_memory'; perDistinct: number; cap: number }
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
  | { type: 'salvage_by_id'; targetId: string; label?: string }
  | { type: 'consume_limitless_light_stacks'; value: number };

export type EffectCondition =
  | { type: 'cards_played_gte'; value: number }
  | { type: 'first_card_this_turn' }
  | { type: 'light_stacks_gte'; value: number }
  | { type: 'cosmos_gte'; value: number };

export interface ConditionalEffect {
  type: 'conditional';
  condition: EffectCondition;
  then: CardEffect[];
  else?: CardEffect[];
}

export type CoreCardEffect = BoardEffect | ImmediateEffect | ConditionalEffect;

export type CardEffect = CoreCardEffect;

export interface ActiveBoardEffect {
  type: BoardEffectType;
  value: number;
}
