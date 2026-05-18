export type BoardEffectType =
  | 'power_flat'
  | 'power_percent'
  | 'score_multiplier'
  | 'seraphim_bonus_amplifier';

export type BoardEffect =
  | { type: 'power_flat'; value: number }
  | { type: 'power_percent'; value: number }
  | { type: 'score_multiplier'; value: number }
  | { type: 'seraphim_bonus_amplifier'; value: number };

export type CardSubtypeFilter = 'Seraphim' | 'Cherubim' | 'Ophanim';

export type ImmediateEffect =
  | { type: 'oblivion_flat'; value: number }
  | { type: 'set_chain_floor'; value: number }
  | { type: 'chain_multiplier_set'; value: number }
  | { type: 'score_flat'; value: number }
  | { type: 'radiance_gain'; value: number }
  | { type: 'radiance_spend'; value: number }
  | { type: 'ember_gain'; value: number }
  | { type: 'ember_spend'; value: number }
  | { type: 'draw'; value: number }
  | { type: 'discard_choice'; value: number }
  | { type: 'discard_draw'; discard: number; draw: number }
  | { type: 'shuffle_discard' }
  | { type: 'copy_last_hr' }
  | { type: 'multiply_next' }
  | { type: 'look_top_take'; look: number; take: number }
  | { type: 'look_top_take_drop'; look: number; take: number; drop: number }
  | { type: 'look_top_take_type'; look: number; filter: CardSubtypeFilter[] }
  | { type: 'search_deck_by_type'; filter: CardSubtypeFilter[] }
  | { type: 'salvage_by_type'; filter: CardSubtypeFilter[] }
  | { type: 'salvage_any' }
  | { type: 'radiance_double' }
  | { type: 'sacred_covenant' }
  | { type: 'dominant_stack_gain'; value: number }
  | { type: 'trail_gain'; value: number }
  | { type: 'trail_spend'; value: number }
  | { type: 'strain_gain'; value: number }
  | { type: 'strain_vent'; value: number }
  | { type: 'overclock'; strain: number; then: CardEffect[] };

export type EffectCondition =
  | { type: 'radiance_gte'; value: number }
  | { type: 'cards_played_gte'; value: number }
  | { type: 'seraphim_active_gte'; value: number }
  | { type: 'cherubim_active_gte'; value: number }
  | { type: 'first_card_this_turn' }
  | { type: 'ember_gte'; value: number }
  | { type: 'trail_gte'; value: number }
  | { type: 'strain_gte'; value: number }
  | { type: 'strain_lte'; value: number };

export interface ConditionalEffect {
  type: 'conditional';
  condition: EffectCondition;
  then: CardEffect[];
}

export type CherubimPassiveEffect =
  | { type: 'cherubim_oblivion_per_card'; value: number }
  | { type: 'cherubim_ophanim_bonus'; value: number }
  | { type: 'cherubim_chain_bonus'; value: number }
  | { type: 'cherubim_seraphim_amp'; value: number }
  | { type: 'cherubim_ember_gain'; value: number }
  | { type: 'cherubim_draw_per_card'; value: number }
  | { type: 'cherubim_resource_per_card'; resource: 'ember' | 'radiance' | 'trail' | 'strain'; value: number }
  | { type: 'cherubim_adjacent_seraphim_bonus'; value: number; bonusType: 'oblivion' | 'draw' | 'chain' }
  | { type: 'cherubim_conditional_buff'; condition: EffectCondition; value: number }
  | {
      type: 'cherubim_attack_buff';
      targetUnitType: 'Seraphim' | 'Angel' | 'Any';
      targetDefinitionIds?: string[];
      targetTags?: string[];
      bonusBaseOblivion?: number;
      bonusChainScaling?: number;
      cooldownDeltaCards?: number;
      multiplier?: number;
    };

export type CardEffect = BoardEffect | ImmediateEffect | ConditionalEffect;

export interface ActiveBoardEffect {
  type: BoardEffectType;
  value: number;
}
