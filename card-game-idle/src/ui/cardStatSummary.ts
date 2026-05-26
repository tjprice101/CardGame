import type {
  AngelDefinition,
  AttackCost,
  CardDefinition,
  CherubimDefinition,
  SeraphimDefinition,
} from '@/types/cards';
import type { CardEffect, CardSubtypeFilter, CherubimPassiveEffect, EffectCondition } from '@/types/effects';
import { getLateGameAttackIdentity } from '@/systems/cards/LateGameAttackIdentity';
import { CardRegistry } from '@/cards/CardRegistry';
import { formatDisplayCardText } from '@/ui/preferences';

export interface CardSummarySection {
  title: string;
  lines: string[];
}

export type AbilityTextMode = 'authored' | 'canonical' | 'infinite-eternal-canonical';

export interface CardSummaryOptions {
  abilityTextMode?: AbilityTextMode;
}

function formatExactValue(value: number): string {
  if (Number.isInteger(value)) return `${value}.0`;

  const rounded = value.toFixed(2);
  return rounded.endsWith('0') ? rounded.slice(0, -1) : rounded;
}

function formatCount(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${Math.abs(value) === 1 ? singular : plural}`;
}

function formatSubtypeList(filters: ReadonlyArray<CardSubtypeFilter>): string {
  if (filters.length === 0) return 'card';
  if (filters.length === 1) return filters[0];
  if (filters.length === 2) return `${filters[0]} or ${filters[1]}`;
  return `${filters.slice(0, -1).join(', ')}, or ${filters[filters.length - 1]}`;
}

const ETERNAL_STACK_LABELS: Record<string, { singular: string; plural: string }> = {
  pyro: { singular: 'Inferno Tier', plural: 'Inferno Tiers' },
  light: { singular: 'Halo Crown', plural: 'Halo Crowns' },
  thorn: { singular: 'Thorncrown', plural: 'Thorncrowns' },
  glass: { singular: 'Eclipse Mark', plural: 'Eclipse Marks' },
  snow: { singular: 'Voltage Surge', plural: 'Voltage Surges' },
  mech: { singular: 'Reactor Core', plural: 'Reactor Cores' },
  prism: { singular: 'Mirror Chain link', plural: 'Mirror Chain links' },
  absol: { singular: 'Proof Cascade', plural: 'Proof Cascades' },
  garden: { singular: 'Ember Bloom', plural: 'Ember Blooms' },
  flutter: { singular: 'Wing Resonance', plural: 'Wing Resonances' },
  tide: { singular: 'Tide Crown', plural: 'Tide Crowns' },
  forge: { singular: 'Forge Crown', plural: 'Forge Crowns' },
  pyre: { singular: 'Pyre Ember', plural: 'Pyre Embers' },
  wuas: { singular: 'Star Crown', plural: 'Star Crowns' },
};

function formatEternalStack(stack: string, value: number): string {
  const labels = ETERNAL_STACK_LABELS[stack] ?? { singular: stack, plural: `${stack}s` };
  return `${value} ${Math.abs(value) === 1 ? labels.singular : labels.plural}`;
}

function eternalStackName(stack: string, plural = true): string {
  const labels = ETERNAL_STACK_LABELS[stack] ?? { singular: stack, plural: `${stack}s` };
  return plural ? labels.plural : labels.singular;
}

const SET_SECONDARY_LABELS: Record<string, { singular: string; plural: string }> = {
  pyro: { singular: 'Cinder Echo', plural: 'Cinder Echoes' },
  light: { singular: 'Halo Cascade', plural: 'Halo Cascades' },
  thorn: { singular: 'Briar Spiral', plural: 'Briar Spirals' },
  glass: { singular: 'Veil Shard', plural: 'Veil Shards' },
  snow: { singular: 'Static Pulse', plural: 'Static Pulses' },
  mech: { singular: 'Reactor Flux', plural: 'Reactor Flux' },
  prism: { singular: 'Spectrum Echo', plural: 'Spectrum Echoes' },
  absol: { singular: 'Cascade Proof', plural: 'Cascade Proofs' },
  garden: { singular: 'Wild Pollen', plural: 'Wild Pollen' },
  flutter: { singular: 'Wing Pulse', plural: 'Wing Pulses' },
  tide: { singular: 'Tide Echo', plural: 'Tide Echoes' },
  pyre: { singular: 'Cinder Crown', plural: 'Cinder Crowns' },
};

function formatSetSecondary(kind: string, value: number): string {
  const labels = SET_SECONDARY_LABELS[kind] ?? { singular: kind, plural: `${kind}s` };
  return `${value} ${Math.abs(value) === 1 ? labels.singular : labels.plural}`;
}

function setSecondaryName(kind: string, plural = true): string {
  const labels = SET_SECONDARY_LABELS[kind] ?? { singular: kind, plural: `${kind}s` };
  return plural ? labels.plural : labels.singular;
}

function formatAttackCost(cost: AttackCost): string {
  switch (cost.type) {
    case 'discard_from_hand':
      return `discard ${formatCount(cost.value, 'card')}`;
    case 'sacrifice_seraphim':
      return `sacrifice ${formatCount(cost.value, 'Seraphim')}`;
    case 'sacrifice_angel':
      return `sacrifice ${formatCount(cost.value, 'Angel')}`;
    case 'spend_embers':
      return `spend ${cost.value} ${cost.value === 1 ? 'Ember' : 'Embers'}`;
    case 'spend_radiance':
      return `spend ${cost.value} Radiance`;
    case 'spend_trail':
      return `spend ${cost.value} Trail`;
    case 'spend_strain':
      return `spend ${cost.value} Strain`;
    default:
      return `${(cost as { type: string; value: number }).type.replace(/_/g, ' ')} ${(cost as { type: string; value: number }).value}`;
  }
}

function formatCosts(costs: ReadonlyArray<AttackCost> | undefined): string {
  if (!costs || costs.length === 0) return 'none';
  return costs.map(formatAttackCost).join(', ');
}

function formatEffectsInline(effects: CardEffect[]): string {
  if (effects.length === 0) return 'none';
  return effects.map(formatEffect).join('; ');
}

function formatSummonCondition(condition: NonNullable<AngelDefinition['extraSummonConditions']>[number]): string {
  if (condition.type === 'cherubim_active_gte') return `${condition.value}+ active Cherubim`;
  if (condition.type === 'seraphim_on_board_gte') return `${condition.value}+ Seraphim on board`;
  return 'special condition';
}

function formatContinuousBonus(
  bonusType: AngelDefinition['baseStats']['bonusType'] | SeraphimDefinition['baseStats']['bonusType'],
  bonusValue: number,
  scope: 'while active' | 'while on board',
): string {
  switch (bonusType) {
    case 'oblivion_per_card':
      return `+${bonusValue} Oblivion per card played ${scope}`;
    case 'chain_bonus':
      return `Chain grows +${bonusValue} per card played ${scope}`;
    case 'ophanim_bonus':
      return `+${bonusValue} Oblivion whenever you play an Ophanim ${scope}`;
    case 'cherubim_extra_plays':
      return `Each new Cherubim summoned ${scope} gains +${bonusValue} durability`;
    case 'cherubim_expire_bonus':
      return `Gain +${bonusValue} Oblivion when a Cherubim expires ${scope}`;
    case 'ember_per_card':
      return `Gain ${bonusValue} ${bonusValue === 1 ? 'Ember' : 'Embers'} per card played ${scope}`;
    case 'power_amplifier':
      return `Your board's power is amplified by x${formatExactValue(bonusValue)} ${scope}`;
    case 'score_per_second':
      return `Gain +${bonusValue} Oblivion per second ${scope}`;
    case 'resource_generation':
      return `Resource generation +${bonusValue} ${scope}`;
    case 'tick_acceleration':
      return `Tick speed +${bonusValue} ${scope}`;
    case 'power_per_seraphim':
      return `+${bonusValue} power for each Seraphim on board ${scope}`;
    case 'oblivion_per_seraphim':
      return `+${bonusValue} Oblivion for each Seraphim on board ${scope}`;
    default:
      return `${String(bonusType).replace(/_/g, ' ')} +${bonusValue} ${scope}`;
  }
}

function formatAngelBoardBonus(baseStats: AngelDefinition['baseStats']): string {
  return formatContinuousBonus(baseStats.bonusType, baseStats.bonusValue, 'while on board');
}

function formatCondition(condition: EffectCondition): string {
  switch (condition.type) {
    case 'first_card_this_turn':
      return 'this is the first card you played this turn';
    case 'radiance_gte':
      return `you have ${condition.value}+ Radiance`;
    case 'cards_played_gte':
      return `you have played ${condition.value}+ cards this turn`;
    case 'seraphim_active_gte':
      return `you control ${condition.value}+ active Seraphim`;
    case 'cherubim_active_gte':
      return `you control ${condition.value}+ active Cherubim`;
    case 'ember_gte':
      return `you have ${condition.value}+ Embers`;
    case 'trail_gte':
      return `you have ${condition.value}+ Trail`;
    case 'strain_gte':
      return `you have ${condition.value}+ Strain`;
    case 'strain_lte':
      return `you have ${condition.value} or less Strain`;
    case 'prismatic_light_gte':
      return `you have ${condition.value}+ Prismatic Light`;
    case 'prismatic_refraction_depth_gte':
      return `Refraction Depth is ${condition.value}+`;
    case 'prismatic_node_charges_gte':
      return `you have ${condition.value}+ Node Charges`;
    case 'prismatic_memory_shards_gte':
      return `you have ${condition.value}+ Memory Shards`;
    case 'prismatic_distinct_channels_gte':
      return `you have played ${condition.value}+ distinct channels this turn`;
    case 'shards_gte':
      return `you have ${condition.value}+ Monochromatic Shards`;
    case 'arctic_charge_gte':
      return `you have ${condition.value}+ Arctic Charge`;
    case 'proof_gte':
      return `you have ${condition.value}+ Proof`;
    case 'bloom_gte':
      return `you have ${condition.value}+ Bloom`;
    case 'burn_phase_cards_gte':
      return `you have ${condition.value}+ Burn-phase cards`;
    case 'grove_cards_gte':
      return `you have ${condition.value}+ cards in the Grove`;
    case 'eternal_stack_gte':
      return `you have ${condition.value}+ ${eternalStackName(condition.stack)}`;
    case 'set_secondary_gte':
      return `you have ${condition.value}+ ${setSecondaryName(condition.kind)}`;
    case 'pyro_furnace_pressure_gte':
      return `Furnace Pressure is ${condition.value}+`;
    case 'pyro_abyss_fault_gte':
      return `Abyss Fault is ${condition.value}+`;
    case 'pyro_ruin_window_gte':
      return `you have ${condition.value}+ Ruin Windows open`;
    case 'pyro_pressure_higher':
      return 'Furnace Pressure exceeds Abyss Fault';
    case 'pyro_fault_higher':
      return 'Abyss Fault exceeds Furnace Pressure';
    case 'pyro_pools_balanced':
      return 'Pressure and Fault are balanced';
    case 'light_chorus_anchors_gte':
      return `you have ${condition.value}+ Chorus Anchors`;
    case 'light_resonance_gte':
      return `you have ${condition.value}+ Resonance`;
    case 'black_glass_white_flame_gte':
      return `you have ${condition.value}+ White Flame`;
    case 'black_glass_black_flame_gte':
      return `you have ${condition.value}+ Black Flame`;
    case 'black_glass_flames_equal':
      return 'White Flame equals Black Flame';
    case 'black_glass_fracture_gte':
      return `Fracture is ${condition.value}+`;
    case 'starlight_gte':
      return `you have ${condition.value}+ Starlight Charges`;
    case 'dream_lattice_gte':
      return `you have ${condition.value}+ Dream Lattice`;
    default:
      return `${(condition as { type: string; value?: number }).type.replace(/_/g, ' ')} ${'value' in (condition as { value?: number }) ? (condition as { value?: number }).value ?? '' : ''}`.trim();
  }
}

function formatEffect(effect: CardEffect): string {
  switch (effect.type) {
    case 'oblivion_flat': return `+${effect.value} Oblivion`;
    case 'chain_gain': return `Amplify Chain by +x${formatExactValue(effect.value)}`;
    case 'chain_multiplier_set': return `Set chain multiplier to x${formatExactValue(effect.value)}`;
    case 'score_flat': return `+${effect.value}% total Oblivion this turn`;
    case 'radiance_gain': return `Gain ${effect.value} Radiance`;
    case 'radiance_spend': return `Spend ${effect.value} Radiance`;
    case 'ember_gain': return `Gain ${effect.value} ${effect.value === 1 ? 'Ember' : 'Embers'}`;
    case 'ember_spend': return `Spend ${effect.value} ${effect.value === 1 ? 'Ember' : 'Embers'}`;
    case 'draw': return `Draw ${formatCount(effect.value, 'card')}`;
    case 'discard_choice': return `Choose and discard ${formatCount(effect.value, 'card')}`;
    case 'discard_draw': return `Discard ${formatCount(effect.discard, 'card')}, then draw ${formatCount(effect.draw, 'card')}`;
    case 'shuffle_discard': return 'Shuffle discard into deck';
    case 'copy_last_hr': return 'Replay last Ophanim played this turn';
    case 'multiply_next': return 'Empower the next card you play';
    case 'look_top_take': return `Look at the top ${formatCount(effect.look, 'card')}, take ${formatCount(effect.take, 'card')}, and put the rest on the bottom`;
    case 'look_top_take_drop': return `Look at the top ${formatCount(effect.look, 'card')}, take ${formatCount(effect.take, 'card')}, put ${formatCount(effect.drop, 'card')} on the bottom, and discard the rest`;
    case 'look_top_take_type': return `Look at the top ${formatCount(effect.look, 'card')} and take 1 matching ${formatSubtypeList(effect.filter)}`;
    case 'search_deck_by_type': return `Search your deck for 1 matching ${formatSubtypeList(effect.filter)}`;
    case 'salvage_by_type': return `Salvage ${formatCount(effect.filter.length > 1 ? effect.filter.length : 1, 'card')} matching ${formatSubtypeList(effect.filter)}`;
    case 'salvage_any': return 'Salvage any 1 card';
    case 'radiance_double': return 'Double current Radiance';
    case 'sacred_covenant': return 'Sacred Covenant';
    case 'prismatic_light_gain': return `Gain ${effect.value} Prismatic Light`;
    case 'prismatic_light_spend': return `Spend ${effect.value} Prismatic Light`;
    case 'channel_lock_gain': return `Look at top ${formatCount(effect.look, 'card')}; gain up to ${effect.max} Channel Lock tokens from Prismatic cards`;
    case 'memory_shard_gain': return `Gain ${effect.value} Memory Shard${effect.value === 1 ? '' : 's'}${effect.max !== undefined ? ` (max ${effect.max})` : ''}`;
    case 'channel_memory_init': return 'Initialize channel memory for switch-depth marking';
    case 'accord_channel_set': return 'Choose an Accord Channel';
    case 'refraction_echo_gain': return `Gain Refraction Echo tokens from distinct channels (max ${effect.max})`;
    case 'refraction_echo_cascade': return 'Arm Refraction Echo cascade at end of turn';
    case 'chord_token_gain': return `Gain Chord Tokens from Cherubim on board (max ${effect.max})`;
    case 'chord_token_multiplier': return 'Chord Tokens increase this unit attack power and chain scaling';
    case 'chord_amplify_chain': return 'Amplify chain based on Chord Tokens';
    case 'refraction_depth_sync': return 'Synchronize Refraction Depth with current channel state';
    case 'refraction_spike_init': return `Initialize Refraction Spikes (max ${effect.max})`;
    case 'prismatic_search_ophanim_cherubim': return `Search deck for up to ${effect.maxTake} Ophanim/Cherubim based on Node Charges`;
    case 'sentencing_cast': return `Cast Sentencing: chosen card gains +${formatExactValue(effect.chainGainIfAccordMatch)} chain gain on Accord match and draws ${effect.draw}${effect.drawPerfect ? ` (${effect.drawPerfect} at perfect verdict)` : ''}`;
    case 'monochromatic_shards_gain': return `Gain ${effect.value} Monochromatic Shards`;
    case 'monochromatic_shards_spend': return `Spend ${effect.value} Monochromatic Shards`;
    case 'arctic_charge_gain': return `Gain ${effect.value} Arctic Charge`;
    case 'arctic_charge_discharge': return 'Discharge Arctic Charge';
    case 'proof_gain': return `Gain ${effect.value} Proof`;
    case 'proof_spend': return `Spend ${effect.value} Proof`;
    case 'bloom_gain': return `Gain ${effect.value} Bloom`;
    case 'bloom_harvest': return 'Harvest Bloom';
    case 'trail_gain': return `Gain ${effect.value} Trail`;
    case 'trail_spend': return `Spend ${effect.value} Trail`;
    case 'strain_gain': return `Gain ${effect.value} Strain`;
    case 'strain_vent': return `Vent ${effect.value} Strain`;
    case 'power_flat': return `Your board gains +${effect.value} power`;
    case 'power_percent': return `Your board gains +${effect.value}% power`;
    case 'score_multiplier': return `Gain +${effect.value}% total Oblivion this turn`;
    case 'seraphim_bonus_amplifier': return `Seraphim bonuses are amplified by +${effect.value}`;
    case 'patience_gain_all': return `All Seraphim on board gain +${effect.value} Patience`;
    case 'patience_double_all': return 'Double all Patience on the board';
    case 'neutrality_designate_vessel': return 'Designate the Seraphim with the highest Patience as your Vessel';
    case 'neutrality_vessel_copy_gain': return `Your Vessel copies ${effect.percent}% of Patience gained by other Seraphim this turn`;
    case 'neutrality_vessel_redistribute': return `Redistribute up to ${effect.value} Vessel Patience across your other Seraphim`;
    case 'neutrality_mark_hand': return `Mark up to ${effect.count} other cards in hand; marked cards grant +${effect.patience} Patience to all Seraphim when played`;
    case 'neutrality_attack_preserve': return `Seraphim attacks preserve ${effect.percent}% of consumed Patience this turn`;
    case 'neutrality_attack_restore': return `After each Seraphim attack this turn, restore ${effect.percent}% of consumed Patience to that attacker`;
    case 'neutrality_linked_mode': return `Link Seraphim this turn: patience gains grant +${effect.gain} extra to all linked Seraphim and non-attacking linked Seraphim retain ${effect.retainPercent}% Patience after each linked attack`;
    case 'overclock':
      return `Overclock: gain ${effect.strain} Strain, then ${effect.then.map(formatEffect).join('; ')}`;
    case 'conditional':
      return `If ${formatCondition(effect.condition)}, ${effect.then.map(formatEffect).join('; ')}`;
    case 'set_chain_floor': return `Set chain floor to x${formatExactValue(effect.value)}`;
    case 'pyro_furnace_pressure_gain': return `Stoke ${effect.value} Furnace Pressure`;
    case 'pyro_furnace_pressure_spend': return `Spend ${effect.value} Furnace Pressure`;
    case 'pyro_abyss_fault_gain': return `Forge ${effect.value} Abyss Fault`;
    case 'pyro_abyss_fault_spend': return `Spend ${effect.value} Abyss Fault`;
    case 'pyro_ruin_window_gain': return `Open ${formatCount(effect.value, 'Ruin Window')}`;
    case 'pyro_convert_pressure_to_fault':
      return `Convert Pressure to Fault (${effect.pressurePerFault} Pressure per Fault, gain ${effect.faultGain}${effect.maxFaultGain !== undefined ? ` up to ${effect.maxFaultGain}` : ''})`;
    case 'pyro_window_cashout': {
      const parts: string[] = [`+${effect.oblivionPerWindow} Oblivion`];
      if ((effect.chainPerWindow ?? 0) > 0) parts.push(`+${formatExactValue(effect.chainPerWindow!)} chain`);
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Cash out ${scope} Ruin Windows (${parts.join(', ')} per window)`;
    }
    case 'pyro_balance_bonus': return `If pools are balanced, +${effect.oblivionPerPair} Oblivion per Pressure-Fault pair`;
    case 'eternal_stack_gain':
      return `Gain ${formatEternalStack(effect.stack, effect.value)}`;
    case 'eternal_stack_spend':
      return effect.value >= 9999
        ? `Spend all ${eternalStackName(effect.stack)}`
        : `Spend ${formatEternalStack(effect.stack, effect.value)}`;
    case 'eternal_stack_cashout': {
      const parts: string[] = [`+${effect.oblivionPerStack} Oblivion`];
      if ((effect.chainPerStack ?? 0) > 0) parts.push(`+${formatExactValue(effect.chainPerStack!)} chain`);
      if ((effect.drawPerStack ?? 0) > 0) parts.push(`+${formatExactValue(effect.drawPerStack!)} draw`);
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Cash out ${scope} ${eternalStackName(effect.stack)} (${parts.join(', ')} per stack)`;
    }
    case 'set_secondary_gain':
      return `Gain ${formatSetSecondary(effect.kind, effect.value)}`;
    case 'set_secondary_spend':
      return effect.value >= 9999
        ? `Spend all ${setSecondaryName(effect.kind)}`
        : `Spend ${formatSetSecondary(effect.kind, effect.value)}`;
    case 'pyro_cinder_echo_ignite': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Ignite ${scope} ${setSecondaryName('pyro')} (+${formatExactValue(effect.oblivionPerEchoSquared)} Oblivion × echoes²)`;
    }
    case 'light_halo_cascade_resound': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Resound ${scope} ${setSecondaryName('light')} (+${formatExactValue(effect.chainFloorPerCascade)} chain floor per cascade)`;
    }
    case 'thorn_briar_spiral_bloom': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Bloom ${scope} ${setSecondaryName('thorn')} (+${effect.trailPerSpiral} Trail per spiral, then +${formatExactValue(effect.chainPerTrail)} chain × current Trail)`;
    }
    case 'mech_reactor_flux_vent': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Vent ${scope} ${setSecondaryName('mech')} (consume matching Strain: +${formatExactValue(effect.oblivionPerFlux)} Oblivion per Strain vented, +${formatExactValue(effect.scoreMultPerFlux)}% score per flux)`;
    }
    case 'prism_spectrum_echo_refract': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Refract ${scope} ${setSecondaryName('prism')} (+${formatExactValue(effect.oblivionPerEchoPerChannel)} Oblivion per echo × distinct channels)`;
    }
    case 'glass_veil_shard_swap': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Shatter ${scope} ${setSecondaryName('glass')} (swap flames, +${formatExactValue(effect.oblivionPerHigherFlame)} Oblivion per higher flame per shard)`;
    }
    case 'snow_static_pulse_discharge': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Discharge ${scope} ${setSecondaryName('snow')} (Voltage: +${formatExactValue(effect.voltageOblivionPerPulse)} Oblivion per pulse · Frost: +${formatExactValue(effect.frostDrawPerPulse)} draw per pulse)`;
    }
    case 'absol_cascade_proof_amplify': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Amplify ${scope} ${setSecondaryName('absol')} (+${formatExactValue(effect.chainPerProofDepth)} chain per proof)`;
    }
    case 'garden_wild_pollen_seed': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Seed ${scope} ${setSecondaryName('garden')} (+${formatExactValue(effect.embersPerPollen)} Embers per pollen, +${formatExactValue(effect.scoreMultPerBloom)}% score per Bloom)`;
    }
    case 'flutter_wing_pulse_amplify': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Amplify ${scope} ${setSecondaryName('flutter')} (double next ${effect.doubleNextGains} spectrum gain${effect.doubleNextGains === 1 ? '' : 's'} per pulse)`;
    }
    case 'tide_echo_resolve': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Resolve ${scope} ${setSecondaryName('tide')} (White polarity: +${formatExactValue(effect.chainPerPositive)} chain per echo · Black polarity: +${formatExactValue(effect.oblivionPerNegative)} Oblivion per echo)`;
    }
    case 'light_resonance_gain': return `Gain ${effect.value} Resonance`;
    case 'butterfly_spectrum_gain': return `Gain ${effect.value} Spectrum`;
    case 'butterfly_tune': return `Tune stance to ${effect.stance}`;
    case 'butterfly_release': {
      const parts: string[] = [`+${effect.oblivionPerSpectrum} Oblivion`];
      if ((effect.chainPerSpectrum ?? 0) > 0) parts.push(`+${formatExactValue(effect.chainPerSpectrum!)} chain`);
      const scope = effect.spend >= 9999 ? 'all' : `up to ${effect.spend}`;
      return `Release ${scope} Spectrum (${parts.join(', ')} per spectrum)`;
    }
    case 'seas_current_gain': return `Gain ${effect.value} Current`;
    case 'seas_polarity_shift': return `Shift polarity to ${effect.polarity}`;
    case 'seas_release': {
      const parts: string[] = [`+${effect.oblivionPerCurrent} Oblivion`];
      if ((effect.chainPerCurrent ?? 0) > 0) parts.push(`+${formatExactValue(effect.chainPerCurrent!)} chain`);
      const scope = effect.spend >= 9999 ? 'all' : `up to ${effect.spend}`;
      return `Release ${scope} Current (${parts.join(', ')} per current)`;
    }
    case 'light_anchor_gain': return `Gain ${effect.value} Anchor`;
    case 'black_glass_white_flame_gain': return `Gain ${effect.value} White Flame`;
    case 'black_glass_black_flame_gain': return `Gain ${effect.value} Black Flame`;
    case 'black_glass_fracture_gain': return `Gain ${effect.value} Fracture`;
    case 'black_glass_flames_swap': return 'Swap White Flame and Black Flame';
    case 'black_glass_fracture_collapse': return `Fracture collapses by ${effect.value}`;
    case 'black_glass_register_state':
      return `Register state: ${effect.key === 'grief_oaths' ? 'Grief Oaths' : effect.key === 'collapse_pending' ? 'Collapse Pending' : 'Last Payoff'} += ${effect.value}`;
    case 'set_garden_law': return `Set Garden Law to ${effect.law} if unset`;
    case 'effect_plus': return `Increase linked effect value by ${effect.value}`;
    case 'choose_lineage': return `Choose a lineage, then ${formatEffect(effect.effect)}`;
    case 'burn_phase_seed_on_other_lineage_play': return `Burn-phase cards gain ${effect.value} Seed when you play a different lineage`;
    case 'echo_effect_double': return `Echo effects are doubled for ${formatCount(effect.duration, 'turn')}`;
    case 'sigil_on_burn_play': return `Gain ${effect.value} Sun Sigil when you play a Burn-phase card`;
    case 'sigil_threshold_echo_return': return `At ${effect.threshold}+ Sigils, Burn-phase cards return as Echoes`;
    case 'sigil_draw_on_gain': return `Draw ${formatCount(effect.value, 'card')} whenever you gain Sigils`;
    case 'choose_burn_card': return `Choose a Burn-phase card, then ${formatEffect(effect.effect)}`;
    case 'archive_crown_on_new_lineage': return `Archive ${effect.value} Crown on new lineage; at ${effect.threshold} trigger ${effect.trigger.replace(/_/g, ' ')}`;
    case 'burn_attack_all': return 'Trigger all Burn-phase attacks';
    case 'burn_cooldown_reduction_per_crown': return `Burn-phase cards gain cooldown reduction per Crown (+${effect.value} each)`;
    case 'char_to_memory_echo': return `When matching cards char, copy into Grove as Memory Echo (${effect.value})`;
    case 'memory_echo_buff': return `Memory Echoes gain: ${formatEffect(effect.effect)}`;
    case 'memory_echo_cost_reduction': return `Memory Echo play cost is reduced by ${effect.value}`;
    case 'replay_last_burn_card': return 'Replay the last Burn-phase card played this turn';
    case 'ignite_units_burn': return `Ignite up to ${formatCount(effect.count, 'unit')} into Burn`;
    case 'mini_final_chord_on_diff_lineages': return `If ignited units are different lineages: ${formatEffect(effect.effect)}`;
    case 'echo_on_burn_play': return `Gain ${effect.value} Echo when you play a Burn-phase card`;
    case 'snapshot_burn_lineages': return 'Snapshot current Burn-phase lineages';
    case 'incandescent_chorus_on_new_lineage': return `On new lineage: ${formatEffect(effect.effect)}`;
    case 'burn_lineage_echo_and_cooldown': return `Burn cards of the lineage gain +${effect.echo} Echo and ${effect.cooldown} cooldown reduction`;
    case 'final_chord_bloom_if_all_lineages': return `If all lineages are present (${effect.trigger.replace(/_/g, ' ')}): ${formatEffect(effect.effect)}`;
    case 'bloom_all_lineages': return `Bloom all lineages at ${Math.round(effect.multiplier * 100)}% effect`;
    case 'seed_grove_with_worldflower': return `Seed Grove with ${effect.per_burn} Worldflower token per Burn card`;
    case 'worldflower_echo_on_char': return `Worldflower tokens become Echoes on char for ${formatCount(effect.duration, 'turn')}`;
    case 'worldflower_bonus_on_three': return `If 3 Worldflowers are played this turn, all Burn effects gain +${effect.bonus}`;
    case 'choose_burn_cards': return `Choose up to ${formatCount(effect.count, 'Burn card')}, then ${formatEffect(effect.effect)}`;
    case 'char_revive_echo_double': return `On char, revive as Echo with doubled effects for ${formatCount(effect.duration, 'turn')}`;
    case 'echo_persistence_bonus': return `Echoes persist for ${formatCount(effect.duration, 'turn')}`;
    case 'geometry_mode_on_new_lineage': return `On new lineage, Geometry Mode applies: ${formatEffect(effect.effect)}`;
    case 'burn_all_effects_plus': return `All Burn-phase effects gain +${effect.value}${effect.cooldown ? ` and cooldown reduction ${effect.cooldown}` : ''}`;
    case 'geometry_mode_next_turn_on_three_lineages': return 'If 3 lineages are played, Geometry Mode applies next turn';
    case 'gate_payoff': return `For each fulfilled gate: ${effect.gates.map(g => `if ${formatCondition(g.condition)} then ${formatEffect(g.payoff)}`).join('; ')}`;
    case 'zenith_on_all_gates': return `If all gates are fulfilled, apply Zenith for ${formatCount(effect.duration, 'turn')}: ${formatEffect(effect.effect)}`;
    case 'gain_echo': return `Gain ${effect.value} Echo`;
    case 'burn_attack': return `Trigger ${effect.value} Burn-phase attack`;
    case 'salvage_burn_from_discard': return 'Salvage a Burn-phase card from discard';
    case 'copy_garden_law_to_sky_law': return `Copy Garden Law to Sky Law (${effect.effects.map(e => `${e.law}: ${formatEffect(e.effect)}`).join('; ')})`;
    case 'burn_return_to_hand_as_echo': return `Burn cards return to hand as Echoes for ${formatCount(effect.duration, 'turn')}`;
    case 'burn_cooldown_reduction': return `Burn cards gain ${effect.value} cooldown reduction for ${formatCount(effect.duration, 'turn')}`;
    case 'forge_reforge_charge_gain': return `Gain ${formatCount(effect.value, 'Reforge Charge')}`;
    case 'forge_reforge_charge_cap_raise': return `Raise Reforge Charge cap by ${effect.value}`;
    case 'forge_pearl_drop': return `Drop ${formatCount(effect.value, 'Pearl')}`;
    case 'forge_pearl_cashout': {
      const parts: string[] = [`+${effect.oblivionPerPearl} Oblivion`];
      if ((effect.chainPerPearl ?? 0) > 0) parts.push(`+${formatExactValue(effect.chainPerPearl!)} chain`);
      return `Spend ${formatCount(effect.spend, 'Pearl')} (${parts.join(', ')} per Pearl)`;
    }
    case 'forge_recast_last': return `Recast last card at ${Math.round(effect.power * 100)}% power`;
    case 'forge_recast_last_n': return `Recast last ${formatCount(effect.count, 'card')} at ${Math.round(effect.power * 100)}% power`;
    case 'forge_recast_random': return `Recast ${formatCount(effect.count ?? 1, 'random played card')} at ${Math.round(effect.power * 100)}% power`;
    case 'forge_nacre_recast': {
      const target = effect.targetMode === 'last' ? 'last card' : `last ${formatCount(effect.count ?? 1, 'card')}`;
      return `Nacre-Recast ${target} at ${Math.round(effect.power * 100)}% power`;
    }
    case 'forge_ouroboric_recast': return `Ouroboric Recast at ${Math.round(effect.power * 100)}% power`;
    case 'forge_temper': {
      const target = effect.targetMode === 'self' ? 'this card' : effect.targetMode === 'last_played' ? 'last played card' : 'all Seraphim on board';
      return `Temper ${target}: x${formatExactValue(effect.factor)} power`;
    }
    case 'forge_anvil_seal': {
      const target = effect.target === 'self' ? 'this card' : 'last played card';
      return `Anvil-Seal ${target} (+${effect.burstOblivion} Oblivion, +${formatExactValue(effect.burstChain)} chain on next play)`;
    }
    case 'forge_nacre_coat': return `Nacre-Coat ${effect.targetMode === 'all_played' ? 'all played cards' : 'last played card'}`;
    case 'forge_unrecorded_ignite': return 'Ignite the Unrecorded Hue';
    case 'forge_crown_cashout': {
      const parts: string[] = [`+${effect.oblivionPerCrown} Oblivion`];
      if ((effect.chainPerCrown ?? 0) > 0) parts.push(`+${formatExactValue(effect.chainPerCrown!)} chain`);
      return `Cash out all Forge Crowns (${parts.join(', ')} per crown)`;
    }
    case 'dfh_crown_cashout': {
      const parts: string[] = [`+${effect.oblivionPerCrown} Oblivion`];
      if ((effect.chainPerCrown ?? 0) > 0) parts.push(`+${formatExactValue(effect.chainPerCrown!)} chain`);
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Cash out ${scope} Cinder Crowns (${parts.join(', ')} per crown)`;
    }
    case 'starlight_gain':
      return `Gain ${formatCount(effect.amount, 'Starlight Charge')}`;
    case 'dream_lattice_gain':
      return `Gain ${formatCount(effect.amount, 'Dream Lattice stack')}`;
    case 'wuas_nova_wish_burst':
      return `Nova Wish Burst (Oblivion = Starlight × (1 + Dream × ${effect.dreamMultiplier ?? 0.4}))${effect.consumeStarlight ? '; consumes all Starlight' : ''}`;
    case 'wuas_constellation_lock_release': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Cash out ${scope} Star Crowns (+${effect.oblivionPerStack} Oblivion per Crown, +${formatExactValue(effect.chainPerDream ?? 0)} chain per Dream Lattice)`;
    }
    case 'wuas_infinite_starbirth': {
      const parts: string[] = [`Ob = Seraphim × Starlight × ${effect.oblivionPerSeraphimPerStarlight}`];
      if ((effect.drawPerDream ?? 0) > 0) parts.push(`draw ${effect.drawPerDream} per Dream Lattice`);
      return `Infinite Starbirth (${parts.join('; ')})`;
    }
    default:
      return (effect as { type: string }).type;
  }
}

function formatSeraphimPassive(
  bonusType: SeraphimDefinition['baseStats']['bonusType'],
  bonusValue: number,
): string {
  return formatContinuousBonus(bonusType, bonusValue, 'while active');
}

function formatCherubimPassive(effect: CherubimPassiveEffect): string {
  switch (effect.type) {
    case 'cherubim_oblivion_per_card': return `+${effect.value} Oblivion per card played`;
    case 'cherubim_ophanim_bonus': return `Ophanim plays gain +${effect.value} Oblivion`;
    case 'cherubim_chain_bonus': return `Chain grows +${effect.value} per card played`;
    case 'cherubim_seraphim_amp': return `Seraphim bonuses are amplified by +${effect.value}`;
    case 'cherubim_ember_gain': return `Gain ${effect.value} ${effect.value === 1 ? 'Ember' : 'Embers'} per card played`;
    case 'cherubim_draw_per_card': return `Draw ${formatCount(effect.value, 'card')} per card played`;
    case 'cherubim_resource_per_card': return `Gain ${effect.value} ${effect.resource === 'ember' && effect.value === 1 ? 'Ember' : effect.resource === 'ember' ? 'Embers' : effect.resource === 'radiance' ? 'Radiance' : effect.resource === 'trail' ? 'Trail' : 'Strain'} per card played`;
    case 'cherubim_adjacent_seraphim_bonus': {
      switch (effect.bonusType) {
        case 'oblivion':
          return `Adjacent active Seraphim gain +${effect.value} Oblivion per card played`;
        case 'draw':
          return `Each adjacent active Seraphim adds ${formatCount(effect.value, 'extra card')} whenever you play a card`;
        case 'chain':
          return `Adjacent active Seraphim gain +${effect.value} chain growth`;
        default:
          return `Adjacent active Seraphim ${effect.bonusType} +${effect.value}`;
      }
    }
    case 'cherubim_conditional_buff': return `If ${formatCondition(effect.condition)}, this Cherubim grants +${effect.value} bonus power`;
    case 'cherubim_patience_per_card': return `Adjacent Seraphim gain +${effect.value} Patience per card played`;
    case 'cherubim_attack_buff': {
      const parts: string[] = [];
      if (effect.bonusBaseOblivion !== undefined) parts.push(`base +${effect.bonusBaseOblivion}`);
      if (effect.bonusChainScaling !== undefined) parts.push(`chain bonus +${effect.bonusChainScaling.toFixed(2)}`);
      if (effect.cooldownDeltaCards !== undefined) parts.push(`cooldown ${effect.cooldownDeltaCards >= 0 ? '+' : ''}${effect.cooldownDeltaCards}`);
      if (effect.multiplier !== undefined) parts.push(`multiplier x${effect.multiplier.toFixed(2)}`);
      if (effect.condition) parts.push(`when ${formatCondition(effect.condition)}`);
      return `Buffs ${effect.targetUnitType === 'Any' ? 'Seraphim and Angel' : effect.targetUnitType} attacks: ${parts.join(', ') || 'none'}`;
    }
    case 'set_garden_law':
    case 'effect_plus':
    case 'choose_lineage':
    case 'burn_phase_seed_on_other_lineage_play':
    case 'echo_effect_double':
    case 'sigil_on_burn_play':
    case 'sigil_threshold_echo_return':
    case 'sigil_draw_on_gain':
    case 'choose_burn_card':
    case 'archive_crown_on_new_lineage':
    case 'burn_attack_all':
    case 'burn_cooldown_reduction_per_crown':
    case 'char_to_memory_echo':
    case 'memory_echo_buff':
    case 'memory_echo_cost_reduction':
    case 'replay_last_burn_card':
    case 'ignite_units_burn':
    case 'mini_final_chord_on_diff_lineages':
    case 'echo_on_burn_play':
    case 'snapshot_burn_lineages':
    case 'incandescent_chorus_on_new_lineage':
    case 'burn_lineage_echo_and_cooldown':
    case 'final_chord_bloom_if_all_lineages':
    case 'bloom_all_lineages':
    case 'seed_grove_with_worldflower':
    case 'worldflower_echo_on_char':
    case 'worldflower_bonus_on_three':
    case 'choose_burn_cards':
    case 'char_revive_echo_double':
    case 'echo_persistence_bonus':
    case 'geometry_mode_on_new_lineage':
    case 'burn_all_effects_plus':
    case 'geometry_mode_next_turn_on_three_lineages':
    case 'gate_payoff':
    case 'zenith_on_all_gates':
    case 'gain_echo':
    case 'burn_attack':
    case 'salvage_burn_from_discard':
    case 'copy_garden_law_to_sky_law':
    case 'burn_return_to_hand_as_echo':
    case 'burn_cooldown_reduction':
      return formatEffect(effect as unknown as CardEffect);
    // Abyssal Forge — recast-aware passives
    case 'cherubim_charge_per_n_cards': return `Gain 1 Reforge Charge every ${effect.n} cards played`;
    case 'cherubim_temper_on_next_seraphim': return `Auto-Temper the next Seraphim played (+${Math.round(effect.factor * 100)}%)`;
    case 'cherubim_recast_chain_bonus': return `+${effect.value} chain per recast event this turn`;
    case 'cherubim_pearl_per_recast_bonus': return `+${effect.value} extra Pearl per recast event`;
    case 'cherubim_recast_oblivion_bonus': return `+${effect.value} Oblivion per recast event`;
    case 'cherubim_seraphim_recast_amp': return `Seraphim recasts fire at +${Math.round(effect.value * 100)}% power`;
    default:
      return (effect as { type: string }).type;
  }
}

export function getCanonicalCardDescription(card: CardDefinition): string {
  if (card.type === 'Ophanim') {
    return formatEffectsInline(card.effects);
  }

  if (card.type === 'Cherubim') {
    const cherubim = card as CherubimDefinition;
    const parts: string[] = [];
    if (cherubim.onPlayEffects.length > 0) {
      parts.push(`On play: ${formatEffectsInline(cherubim.onPlayEffects)}`);
    }
    if (cherubim.effects.length > 0) {
      parts.push(`While on board: ${cherubim.effects.map(formatCherubimPassive).join('; ')}`);
    }
    return parts.join('. ');
  }

  if (card.type === 'Seraphim') {
    const seraphim = card as SeraphimDefinition;
    const parts: string[] = [];
    if (seraphim.onPlayEffects.length > 0) {
      parts.push(`On play: ${formatEffectsInline(seraphim.onPlayEffects)}`);
    }
    parts.push(`While on board: ${formatSeraphimPassive(seraphim.baseStats.bonusType, seraphim.baseStats.bonusValue)}`);
    if (seraphim.patienceThreshold !== undefined) {
      const drawText = seraphim.patienceThresholdDraw && seraphim.patienceThresholdDraw > 0
        ? `; if Patience ≥ ${seraphim.patienceThreshold} on attack, also draw ${formatCount(seraphim.patienceThresholdDraw, 'card')}`
        : '';
      parts.push(`Patience: +1 stack per card played; on attack, each stack → +15 Oblivion${drawText}`);
    }
    return parts.join('. ');
  }

  const angel = card as AngelDefinition;
  const parts: string[] = [];
  if (angel.onSummonEffects.length > 0) {
    parts.push(`On summon: ${formatEffectsInline(angel.onSummonEffects)}`);
  }
  parts.push(`After ${formatCount(angel.activatedAbility.cardsPlayedRequirement, 'card')} played: ${getCanonicalActivatedAbilityDescription(angel)}`);
  parts.push(`While on board: ${formatAngelBoardBonus(angel.baseStats)}`);
  return parts.join('. ');
}

export function getCanonicalActivatedAbilityDescription(card: AngelDefinition): string {
  return formatEffectsInline(card.activatedAbility.effects);
}

function pushEffectBlock(lines: string[], label: string, effects: CardEffect[]): void {
  if (effects.length === 0) {
    lines.push(`${label}: none`);
    return;
  }
  lines.push(`${label}:`);
  for (const effect of effects) {
    lines.push(`- ${formatEffect(effect)}`);
  }
}

function pushLateGameIdentity(
  lines: string[],
  definitionId: string,
  rarity: CardDefinition['rarity'],
  attackLabel: string,
): void {
  const identity = getLateGameAttackIdentity(definitionId, rarity, attackLabel);
  if (!identity) return;
  lines.push(`  Proc · +${Math.round(identity.bonusBaseMultiplier * 100)}% +${identity.bonusFlatOblivion} flat · draw ${identity.drawCards} · chain-gain +${identity.chainGainBonus.toFixed(2)} · dominant +${identity.dominantResourceGain} · cd -${identity.cooldownReduction}`);
}

function pushSummarySection(sections: CardSummarySection[], title: string, lines: string[]): void {
  const filtered = lines
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (filtered.length === 0) return;
  sections.push({ title, lines: filtered });
}

function formatAttackSummary(
  label: string,
  attack: {
    name: string;
    baseOblivion: number;
    cooldownCards: number;
    chainScaling: number;
    costs?: ReadonlyArray<AttackCost>;
    requiresAngelOnBoard?: boolean;
  },
): string {
  const parts = [
    `${label}: ${attack.name}`,
    getCanonicalAttackDescription(attack),
  ];

  return parts.join(', ');
}

export function getCanonicalAttackDescription(attack: {
  name: string;
  baseOblivion: number;
  cooldownCards: number;
  chainScaling: number;
  costs?: ReadonlyArray<AttackCost>;
  requiresAngelOnBoard?: boolean;
}): string {
  const costText = (attack.costs && attack.costs.length > 0) ? ` · Cost: ${formatCosts(attack.costs)}` : '';
  const angelText = attack.requiresAngelOnBoard ? ' · Requires Angel' : '';
  return `${attack.baseOblivion} base Oblivion · ${formatCount(attack.cooldownCards, 'card')} cooldown · chain +${attack.chainScaling.toFixed(2)}${angelText}${costText}`;
}

function normalizePreviewFingerprint(text: string): string {
  return formatDisplayCardText(text)
    .replace(/^[A-Za-z ]+:\s*/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function shouldUseCanonicalAbility(card: CardDefinition): boolean {
  return card.rarity === 'Infinite' || card.rarity === 'Eternal';
}

function resolveAbilityDescription(card: CardDefinition, options?: CardSummaryOptions): string {
  const canonicalDescription = getCanonicalCardDescription(card);
  const mode = options?.abilityTextMode ?? 'infinite-eternal-canonical';

  if (mode === 'canonical') return canonicalDescription;
  if (mode === 'authored') return formatDisplayCardText(card.description);
  return shouldUseCanonicalAbility(card)
    ? canonicalDescription
    : formatDisplayCardText(card.description);
}

export function getCardSummarySections(card: CardDefinition, options?: CardSummaryOptions): CardSummarySection[] {
  const sections: CardSummarySection[] = [];
  const hooks: string[] = [];
  const canonicalDescription = getCanonicalCardDescription(card);
  const authoredDescription = resolveAbilityDescription(card, options);

  pushSummarySection(sections, 'Ability', [authoredDescription]);

  if (normalizePreviewFingerprint(authoredDescription) !== normalizePreviewFingerprint(canonicalDescription)) {
    pushSummarySection(sections, 'Rules', [canonicalDescription]);
  }

  if (card.prismaticDepth !== undefined) {
    hooks.push(`Prismatic depth ${card.prismaticDepth}`);
  }

  if (card.type === 'Ophanim') {
    pushSummarySection(sections, 'Play', card.effects.map(formatEffect));
  }

  if (card.type === 'Cherubim') {
    const cherubim = card as CherubimDefinition;
    if (cherubim.maxDurability !== undefined) {
      hooks.push(`Durability ${cherubim.maxDurability}`);
    }
    if (cherubim.discardCondition) {
      hooks.push(`Auto-discard: ${formatDisplayCardText(cherubim.discardCondition.description)}`);
    }
    pushSummarySection(sections, 'Passive', cherubim.effects.map(formatCherubimPassive));
    pushSummarySection(sections, 'On Play', cherubim.onPlayEffects.map(formatEffect));
  }

  if (card.type === 'Seraphim') {
    const seraphim = card as SeraphimDefinition;
    pushSummarySection(sections, 'On Play', seraphim.onPlayEffects.map(formatEffect));
    pushSummarySection(sections, 'On Board', [
      formatSeraphimPassive(seraphim.baseStats.bonusType, seraphim.baseStats.bonusValue),
      `Synergy element ${seraphim.baseStats.synergyRequirement}`,
    ]);
    if (seraphim.patienceThreshold !== undefined) {
      const patienceLines = [
        `Accumulates +1 Patience per card played`,
        `On attack: each Patience stack grants +15 Oblivion (stacks then reset)`,
      ];
      if (seraphim.patienceThresholdDraw && seraphim.patienceThresholdDraw > 0) {
        patienceLines.push(`If Patience ≥ ${seraphim.patienceThreshold} on attack, also draw ${formatCount(seraphim.patienceThresholdDraw, 'card')}`);
      }
      pushSummarySection(sections, 'Patience', patienceLines);
    }
    if (seraphim.attacks) {
      pushSummarySection(sections, 'Attacks', [
        formatAttackSummary('Unsynergized', seraphim.attacks.unsynergized),
        formatAttackSummary('Synergized', seraphim.attacks.synergized),
      ]);
    }
  }

  if (card.type === 'Angel') {
    const angel = card as AngelDefinition;
    const summonCostText = angel.summonCost.length > 0
      ? angel.summonCost.map(id => CardRegistry.get(id)?.name ?? id).join(', ')
      : 'none';
    const summonLines = [`Materials: ${summonCostText}`];
    if (angel.extraSummonConditions && angel.extraSummonConditions.length > 0) {
      summonLines.push(`Extra: ${angel.extraSummonConditions.map(formatSummonCondition).join('; ')}`);
    }
    pushSummarySection(sections, 'Summon', summonLines);
    pushSummarySection(sections, 'On Summon', angel.onSummonEffects.map(formatEffect));
    pushSummarySection(sections, 'Awaken', [
      `${angel.activatedAbility.name}: ${getCanonicalActivatedAbilityDescription(angel)}`,
      ...angel.activatedAbility.effects.map(formatEffect),
    ]);
    pushSummarySection(sections, 'On Board', [formatAngelBoardBonus(angel.baseStats)]);
    if (angel.attacks) {
      pushSummarySection(sections, 'Attacks', [
        formatAttackSummary('Primary', angel.attacks.primary),
        formatAttackSummary('Exalted', angel.attacks.exalted),
      ]);
    }
  }

  if (hooks.length > 0) {
    sections.splice(1, 0, { title: 'Hooks', lines: hooks });
  }

  return sections;
}

export function getCardPreviewLines(card: CardDefinition, limit = 3): string[] {
  const preview: string[] = [];
  const seenFingerprints: string[] = [];

  const sections = [
    ...getCardSummarySections(card).filter(section => section.title === 'Ability'),
    ...getCardSummarySections(card).filter(section => section.title !== 'Ability'),
  ];

  const isOphanim = card.type === 'Ophanim';

  for (const section of sections) {
    for (const [index, line] of section.lines.entries()) {
      const candidate = section.title === 'Ability' && index === 0
        ? (isOphanim ? `Play: ${line}` : line)
        : `${section.title}: ${line}`;
      const fingerprint = normalizePreviewFingerprint(candidate);
      if (
        fingerprint.length > 0
        && seenFingerprints.some(existing => existing === fingerprint || existing.includes(fingerprint) || fingerprint.includes(existing))
      ) {
        continue;
      }

      preview.push(candidate);
      if (fingerprint.length > 0) {
        seenFingerprints.push(fingerprint);
      }
      if (preview.length >= limit) return preview;
    }
  }

  return preview;
}

export function getCardPreviewText(card: CardDefinition, limit = 3): string {
  return getCardPreviewLines(card, limit).join('; ');
}

export function getCardFullStatLines(card: CardDefinition): string[] {
  const lines: string[] = [
    `${card.name}`,
    `${card.type} | ${card.element} | ${card.rarity}`,
    formatDisplayCardText(card.description),
  ];

  if (card.type === 'Ophanim') {
    if (card.prismaticDepth !== undefined) {
      lines.push(`Prismatic Depth: ${card.prismaticDepth}`);
    }
    return lines;
  }

  if (card.type === 'Cherubim') {
    const cherubim = card as CherubimDefinition;
    if (cherubim.prismaticDepth !== undefined) {
      lines.push(`Prismatic Depth: ${cherubim.prismaticDepth}`);
    }
    if (cherubim.maxDurability !== undefined) {
      lines.push(`Durability: ${cherubim.maxDurability}`);
    }
    if (cherubim.discardCondition) {
      lines.push(`Discard Condition: ${formatDisplayCardText(cherubim.discardCondition.description)}`);
    }
    if (cherubim.effects.length > 0) {
      lines.push('Passive Effects:');
      for (const passive of cherubim.effects) {
        lines.push(`- ${formatCherubimPassive(passive)}`);
      }
    } else {
      lines.push('Passive Effects: none');
    }
    pushEffectBlock(lines, 'On Play', cherubim.onPlayEffects);
  }

  if (card.type === 'Seraphim') {
    const seraphim = card as SeraphimDefinition;
    lines.push(`On Play: ${formatEffectsInline(seraphim.onPlayEffects)}`);
    lines.push(`On Board: ${formatSeraphimPassive(seraphim.baseStats.bonusType, seraphim.baseStats.bonusValue)}`);
    lines.push(`Synergy Requirement: ${seraphim.baseStats.synergyRequirement}`);
    if (seraphim.prismaticDepth !== undefined) {
      lines.push(`Prismatic Depth: ${seraphim.prismaticDepth}`);
    }

    if (seraphim.attacks) {
      lines.push('Attacks:');
      lines.push(`- Unsynergized · ${seraphim.attacks.unsynergized.name}`);
      lines.push(`  Base ${seraphim.attacks.unsynergized.baseOblivion} · Cooldown ${seraphim.attacks.unsynergized.cooldownCards} cards · Chain +${seraphim.attacks.unsynergized.chainScaling.toFixed(2)} · Cost ${formatCosts(seraphim.attacks.unsynergized.costs)}`);
      pushLateGameIdentity(lines, seraphim.definitionId, seraphim.rarity, seraphim.attacks.unsynergized.label);

      lines.push(`- Synergized · ${seraphim.attacks.synergized.name}`);
      lines.push(`  Base ${seraphim.attacks.synergized.baseOblivion} · Cooldown ${seraphim.attacks.synergized.cooldownCards} cards · Chain +${seraphim.attacks.synergized.chainScaling.toFixed(2)}`);
      lines.push(`  Requires Angel ${seraphim.attacks.synergized.requiresAngelOnBoard ? 'yes' : 'no'} · Cost ${formatCosts(seraphim.attacks.synergized.costs)}`);
      pushLateGameIdentity(lines, seraphim.definitionId, seraphim.rarity, seraphim.attacks.synergized.label);
    } else {
      lines.push('Attacks: none');
    }
  }

  if (card.type === 'Angel') {
    const angel = card as AngelDefinition;
    const summonCostText = angel.summonCost.length > 0
      ? angel.summonCost.map(id => CardRegistry.get(id)?.name ?? id).join(', ')
      : 'none';
    if (angel.prismaticDepth !== undefined) {
      lines.push(`Prismatic Depth: ${angel.prismaticDepth}`);
    }
    lines.push(`Summon Cost: ${summonCostText}`);
    if (angel.extraSummonConditions && angel.extraSummonConditions.length > 0) {
      lines.push(`Extra Summon Conditions: ${angel.extraSummonConditions.map(formatSummonCondition).join('; ')}`);
    }
    lines.push(`On Summon: ${formatEffectsInline(angel.onSummonEffects)}`);
    lines.push(`Awaken (${angel.activatedAbility.cardsPlayedRequirement} cards) · ${angel.activatedAbility.name}: ${formatEffectsInline(angel.activatedAbility.effects)}`);
    lines.push(`On Board: ${formatAngelBoardBonus(angel.baseStats)}`);

    if (angel.attacks) {
      lines.push('Attacks:');
      lines.push(`- Primary · ${angel.attacks.primary.name}`);
      lines.push(`  Base ${angel.attacks.primary.baseOblivion} · Cooldown ${angel.attacks.primary.cooldownCards} cards · Chain +${angel.attacks.primary.chainScaling.toFixed(2)} · Cost ${formatCosts(angel.attacks.primary.costs)}`);
      pushLateGameIdentity(lines, angel.definitionId, angel.rarity, angel.attacks.primary.label);

      lines.push(`- Exalted · ${angel.attacks.exalted.name}`);
      lines.push(`  Base ${angel.attacks.exalted.baseOblivion} · Cooldown ${angel.attacks.exalted.cooldownCards} cards · Chain +${angel.attacks.exalted.chainScaling.toFixed(2)} · Cost ${formatCosts(angel.attacks.exalted.costs)}`);
      pushLateGameIdentity(lines, angel.definitionId, angel.rarity, angel.attacks.exalted.label);
    } else {
      lines.push('Attacks: none');
    }
  }

  return lines;
}

export function getCardFullStatText(card: CardDefinition): string {
  return getCardFullStatLines(card).join('\n');
}
