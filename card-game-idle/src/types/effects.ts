export type BoardEffectType =
  | 'score_multiplier'
  | 'seraphim_bonus_amplifier';

export type BoardEffect =
  | { type: 'score_multiplier'; value: number }
  | { type: 'seraphim_bonus_amplifier'; value: number };

export type CardSubtypeFilter = 'Seraphim' | 'Cherubim' | 'Ophanim' | 'Angel';

export type ImmediateEffect =
  | { type: 'oblivion_flat'; value: number }
  | { type: 'score_flat'; value: number }
  | { type: 'draw'; value: number }
  | { type: 'discard_choice'; value: number }
  | { type: 'discard_draw'; discard: number; draw: number }
  | { type: 'shuffle_discard' }
  | { type: 'copy_last_hr' }
  | { type: 'look_top_take'; look: number; take: number }
  | { type: 'look_top_take_drop'; look: number; take: number; drop: number }
  | { type: 'look_top_take_type'; look: number; filter: CardSubtypeFilter[]; take?: number }
  | { type: 'search_deck_by_type'; filter: CardSubtypeFilter[] }
  | { type: 'search_deck_distinct_types'; filter: CardSubtypeFilter[]; takePerType?: number }
  | { type: 'salvage_by_type'; filter: CardSubtypeFilter[] }
  | { type: 'salvage_by_type_count'; filter: CardSubtypeFilter[]; count: number }
  | { type: 'salvage_any' }
  | { type: 'salvage_by_id'; targetId: string; label?: string }
  | { type: 'patience_gain_all'; value: number }
  | { type: 'patience_double_all' }
  | { type: 'neutrality_equilibrium_sigil_gain'; value: number }
  | {
      type: 'neutrality_equilibrium_starbound_cashout';
      oblivionPerSigil: number;
      patientLightPerSigils?: number;
      spendAll?: boolean;
    }
  | {
      type: 'neutrality_equilibrium_tactical_spend';
      spend: number;
      burstOblivion: number;
      restorePercent: number;
      patientLightGain?: number;
    }
  | { type: 'neutrality_patient_light_gain'; value: number }
  | { type: 'neutrality_attack_preserve'; percent: number };

export type EffectCondition =
  | { type: 'seraphim_played_this_turn' }
  | { type: 'seraphim_not_played_this_turn' }
  | { type: 'cards_played_gte'; value: number }
  | { type: 'seraphim_active_gte'; value: number }
  | { type: 'cherubim_active_gte'; value: number }
  | { type: 'first_card_this_turn' }
  | { type: 'equilibrium_sigils_gte'; value: number };

export interface ConditionalEffect {
  type: 'conditional';
  condition: EffectCondition;
  then: CardEffect[];
}

export type CherubimPassiveEffect =
  | { type: 'cherubim_oblivion_per_card'; value: number }
  | { type: 'cherubim_ophanim_bonus'; value: number }
  | { type: 'cherubim_seraphim_amp'; value: number }
  | { type: 'cherubim_draw_per_card'; value: number }
  | { type: 'cherubim_adjacent_seraphim_bonus'; value: number; bonusType: 'oblivion' | 'draw' }
  | { type: 'cherubim_on_discard'; value: number }
  | { type: 'cherubim_conditional_buff'; condition: EffectCondition; value: number }
  | { type: 'cherubim_patience_per_card'; value: number }
  | {
      type: 'cherubim_attack_buff';
      targetUnitType: 'Seraphim' | 'Angel' | 'Any';
      targetDefinitionIds?: string[];
      targetTags?: string[];
      condition?: EffectCondition;
      bonusBaseOblivion?: number;
      cooldownDeltaCards?: number;
      multiplier?: number;
    }
  | { type: 'cherubim_global_oblivion_mult'; value: number };

export type CoreCardEffect = BoardEffect | ImmediateEffect | ConditionalEffect;

export type CardEffect = CoreCardEffect;

export interface ActiveBoardEffect {
  type: BoardEffectType;
  value: number;
}
