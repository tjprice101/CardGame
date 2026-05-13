// Board effects: persist on the board until end of turn, accumulated across all played cards
export type BoardEffectType =
  | 'power_flat'            // legacy (Light compat)
  | 'power_percent'         // legacy (Light compat)
  | 'score_multiplier'      // legacy (Light compat)
  | 'seraphim_bonus_amplifier'; // legacy (Light compat)

export type BoardEffect =
  | { type: 'power_flat'; value: number }
  | { type: 'power_percent'; value: number }
  | { type: 'score_multiplier'; value: number }
  | { type: 'seraphim_bonus_amplifier'; value: number };

// Filter for search and salvage effects
export type CardSubtypeFilter = 'Seraphim' | 'Chaos' | 'Seeker';

// Immediate effects: fire once when card is played, no board persistence
export type ImmediateEffect =
  | { type: 'oblivion_flat'; value: number }        // direct Oblivion addition beyond chain calc
  | { type: 'set_chain_floor'; value: number }       // set minimum chain multiplier for the turn
  | { type: 'chain_multiplier_set'; value: number }  // force-set chain multiplier to value
  | { type: 'score_flat'; value: number }            // legacy (Light compat)
  | { type: 'radiance_gain'; value: number }
  | { type: 'radiance_spend'; value: number }
  | { type: 'ember_gain'; value: number }
  | { type: 'ember_spend'; value: number }     // 9999 = drain all
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
  | { type: 'dominant_stack_gain'; value: number }    // give value Embers if embers >= radiance, else give value Radiance
  | { type: 'trail_gain'; value: number }             // Thornbound mechanic: gain Trail
  | { type: 'trail_spend'; value: number }            // spend Trail (9999 = drain all)
  | { type: 'strain_gain'; value: number }            // Mechanical Dreams mechanic: gain Strain
  | { type: 'strain_vent'; value: number }            // remove Strain (9999 = vent all)
  | { type: 'overclock'; strain: number; then: CardEffect[] }; // apply stronger mode effects and add Strain

// Condition for conditional effects
export type EffectCondition =
  | { type: 'radiance_gte'; value: number }
  | { type: 'cards_played_gte'; value: number }
  | { type: 'seraphim_active_gte'; value: number }
  | { type: 'chaos_active_gte'; value: number }     // N or more Chaos cards in backSlots
  | { type: 'first_card_this_turn' }
  | { type: 'ember_gte'; value: number }
  | { type: 'trail_gte'; value: number }
  | { type: 'strain_gte'; value: number }
  | { type: 'strain_lte'; value: number };

// Conditional wrapper: evaluate condition, then run effects if met
export interface ConditionalEffect {
  type: 'conditional';
  condition: EffectCondition;
  then: CardEffect[];
}

// Chaos passive effects: applied while the Chaos card is in a back slot
// Each effect benefits each adjacent active Seraphim (frontSlots[i] and frontSlots[i+1])
export type ChaosPassiveEffect =
  | { type: 'chaos_oblivion_per_card'; value: number }  // +N Oblivion per card to adjacent Seraphim
  | { type: 'chaos_seeker_bonus'; value: number }        // +N Oblivion on Seeker plays to adjacent Seraphim
  | { type: 'chaos_chain_bonus'; value: number }         // +N chain growth rate to adjacent Seraphim
  | { type: 'chaos_seraphim_amp'; value: number }        // multiply adjacent Seraphim's oblivion_per_card by N
  | { type: 'chaos_ember_gain'; value: number };         // +N Embers per card to adjacent Seraphim (Pyroabyss)

export type CardEffect = BoardEffect | ImmediateEffect | ConditionalEffect;

// Chaos ritual effects — used only in ChaosDefinition.enthalpy / ChaosDefinition.entropy
// Extends CardEffect with two Chaos-exclusive effects handled directly in the store
export type ChaosRitualEffect =
  | CardEffect
  | { type: 'search_adjacent_seraphim' }          // search deck for a Seraphim in an adjacent front slot
  | { type: 'chaos_sacrifice_oblivion'; value: number }; // remove self from board + gain value Oblivion

// Flattened board effect entry (stored in board.activeBoardEffects)
export interface ActiveBoardEffect {
  type: BoardEffectType;
  value: number;
}
