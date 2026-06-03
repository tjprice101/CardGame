import type {
  AngelDefinition,
  AttackCost,
  CardDefinition,
  CherubimDefinition,
  SeraphimDefinition,
} from '@/types/cards';
import type { CardEffect, CardSubtypeFilter, CherubimPassiveEffect, EffectCondition } from '@/types/effects';
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
  pyro: { singular: 'Furnace Heat', plural: 'Furnace Heat' },
  light: { singular: 'Halo', plural: 'Halo' },
  thorn: { singular: 'Thorncrown', plural: 'Thorncrowns' },
  glass: { singular: 'Eclipse', plural: 'Eclipse' },
  snow: { singular: 'Voltage Surge', plural: 'Voltage Surges' },
  mech: { singular: 'Reactor Core', plural: 'Reactor Cores' },
  prism: { singular: 'Mirror Chain link', plural: 'Mirror Chain links' },
  absol: { singular: 'Proof Cascade', plural: 'Proof Cascades' },
  garden: { singular: 'Garden Bloom', plural: 'Garden Blooms' },
  flutter: { singular: 'Wing Resonance', plural: 'Wing Resonances' },
  deepwake: { singular: 'Deepwake', plural: 'Deepwake' },
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
  pyro: { singular: 'Chroma Ember', plural: 'Chroma Embers' },
  light: { singular: 'Halo Resonance', plural: 'Halo Resonances' },
  thorn: { singular: 'Briar Spiral', plural: 'Briar Spirals' },
  glass: { singular: 'Veil Shard', plural: 'Veil Shards' },
  snow: { singular: 'Polar Capacitor', plural: 'Polar Capacitors' },
  mech: { singular: 'Reactor Core', plural: 'Reactor Cores' },
  prism: { singular: 'Spectrum Echo', plural: 'Spectrum Echoes' },
  absol: { singular: 'Refraction Charge', plural: 'Refraction Charges' },
  garden: { singular: 'Wild Pollen', plural: 'Wild Pollen' },
  flutter: { singular: 'Wing Pulse', plural: 'Wing Pulses' },
  deepwake: { singular: 'Deepwake', plural: 'Deepwake' },
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
    case 'spend_pyro_heat':
      return `spend ${cost.value} Heat`;
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
  const lines = formatEffectLines(effects);
  if (lines.length === 0) return 'none';
  return lines.join('; ');
}

function normalizeSummaryLine(line: string): string {
  return formatDisplayCardText(line)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function formatEffectLines(effects: CardEffect[]): string[] {
  if (effects.length === 0) return [];

  let radianceGainTotal = 0;
  const lines: string[] = [];
  const seen = new Set<string>();

  for (const effect of effects.filter(Boolean)) {
    if (effect.type === 'radiance_gain') {
      radianceGainTotal += effect.value;
      continue;
    }

    const line = formatEffect(effect).trim();
    if (!line || seen.has(line)) continue;
    seen.add(line);
    lines.push(line);
  }

  if (radianceGainTotal > 0) {
    lines.unshift(`Gain ${radianceGainTotal} Radiance`);
  }

  return lines;
}

function formatSummonCondition(condition: NonNullable<AngelDefinition['extraSummonConditions']>[number]): string {
  if (condition.type === 'cherubim_active_gte') return `${condition.value}+ active Cherubim`;
  if (condition.type === 'seraphim_on_board_gte') return `${condition.value}+ Seraphim on board`;
  if (condition.type === 'board_definition_gte') {
    const def = CardRegistry.get(condition.definitionId);
    return `${condition.value}+ ${def?.name ?? condition.definitionId} on board`;
  }
  if (condition.type === 'equilibrium_sigils_gte') return `${condition.value}+ Equilibrium Sigils`;
  if (condition.type === 'pyro_heat_gte') return `${condition.value}+ Heat`;
  if (condition.type === 'eternal_stack_gte') return `${condition.value}+ ${eternalStackName(condition.stack)}`;
  if (condition.type === 'set_secondary_gte') return `${condition.value}+ ${setSecondaryName(condition.kind)}`;
  return 'special condition';
}

function getDisplayableSummonConditions(
  angel: AngelDefinition,
): NonNullable<AngelDefinition['extraSummonConditions']> {
  const conditions = angel.extraSummonConditions ?? [];
  if (conditions.length === 0) return [];

  const summonMaterialCounts = angel.summonCost.reduce<Record<string, number>>((acc, definitionId) => {
    acc[definitionId] = (acc[definitionId] ?? 0) + 1;
    return acc;
  }, {});

  return conditions.filter((condition) => {
    if (condition.type === 'board_definition_gte') {
      const materialCopiesRequired = summonMaterialCounts[condition.definitionId] ?? 0;
      return materialCopiesRequired < condition.value;
    }

    return true;
  });
}

function formatContinuousBonus(
  bonusType: AngelDefinition['baseStats']['bonusType'] | SeraphimDefinition['baseStats']['bonusType'],
  bonusValue: number,
  scope: 'while active' | 'while on board',
): string {
  switch (bonusType) {
    case 'oblivion_per_card':
      return `+${bonusValue} Oblivion per card played ${scope}`;
    case 'ophanim_bonus':
      return `+${bonusValue} Oblivion whenever you play an Ophanim ${scope}`;
    case 'cherubim_extra_plays':
      return `Each new Cherubim summoned ${scope} gains +${bonusValue} durability`;
    case 'cherubim_expire_bonus':
      return `Gain +${bonusValue} Oblivion when a Cherubim expires ${scope}`;
    case 'pyro_heat_per_card':
      return `Gain ${bonusValue} Heat per card played ${scope}`;
    case 'power_amplifier':
      return `Your board's power is amplified by x${formatExactValue(bonusValue)} ${scope}`;
    case 'score_per_second':
      return `Gain +${bonusValue} Oblivion per second ${scope}`;
    case 'resource_generation':
      return `Resource generation +${bonusValue} ${scope}`;
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
    case 'pyro_heat_gte':
      return `you have ${condition.value}+ Heat`;
    case 'trail_gte':
      return `you have ${condition.value}+ Trail`;
    case 'scar_count_gte':
      return `you have ${condition.value}+ Scar`;
    case 'equilibrium_sigils_gte':
      return `you have ${condition.value}+ Equilibrium Sigils`;
    case 'strain_gte':
      return `you have ${condition.value}+ Strain`;
    case 'strain_lte':
      return `you have ${condition.value} or less Strain`;
    case 'resonance_charge_gte':
      return `you have ${condition.value}+ Resonance Charge`;
    case 'prismatic_refraction_depth_gte':
      return `Refraction Depth is ${condition.value}+`;
    case 'prismatic_node_charges_gte':
      return `you have ${condition.value}+ Prism Charges`;
    case 'prismatic_distinct_channels_gte':
      return `you have played ${condition.value}+ distinct channels this turn`;
    case 'burn_phase_cards_gte':
      return `you have ${condition.value}+ Burn-phase cards`;
    case 'grove_cards_gte':
      return `you have ${condition.value}+ cards in the Grove`;
    case 'eternal_stack_gte':
      return `you have ${condition.value}+ ${eternalStackName(condition.stack)}`;
    case 'set_secondary_gte':
      return `you have ${condition.value}+ ${setSecondaryName(condition.kind)}`;
    case 'light_resonance_gte':
      return `you have ${condition.value}+ Cadence`;
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
  if (!effect || typeof effect !== 'object' || !("type" in effect)) return 'Unknown effect';
  switch (effect.type) {
    case 'oblivion_flat': return `+${effect.value} Oblivion`;
    case 'score_flat': return `+${effect.value}% total Oblivion this turn`;
    case 'radiance_gain': return `Gain ${effect.value} Radiance`;
    case 'radiance_spend': return `Spend ${effect.value} Radiance`;
    case 'pyro_heat_gain': return `Gain ${effect.value} Heat`;
    case 'pyro_heat_spend': return effect.value >= 9999 ? 'Spend all Heat' : `Spend ${effect.value} Heat`;
    case 'pyro_heat_burst': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Burst ${scope} Heat (+${formatExactValue(effect.oblivionPerHeat)} Oblivion per Heat)`;
    }
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
    case 'prismatic_light_gain': return `Gain ${effect.value} Prismatic Light`;
    case 'prismatic_light_spend': return `Spend ${effect.value} Prismatic Light`;
    case 'resonance_charge_gain': return `Gain ${effect.value} Resonance Charge`;
    case 'resonance_charge_spend': return `Spend ${effect.value} Resonance Charge`;
    case 'prismatic_charge_spend': return `Spend ${effect.value} Prism Charge${effect.value === 1 ? '' : 's'}`;
    case 'monochromatic_shards_gain': return `Gain ${effect.value} Monochromatic Shards`;
    case 'monochromatic_shards_spend': return `Spend ${effect.value} Monochromatic Shards`;
    case 'arctic_charge_gain': return `Gain ${effect.value} Arctic Charge`;
    case 'arctic_charge_discharge': return 'Discharge Arctic Charge';
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
    case 'neutrality_equilibrium_sigil_gain': return `Gain ${effect.value} Equilibrium Sigil${effect.value === 1 ? '' : 's'}`;
    case 'neutrality_equilibrium_starbound_cashout': return `Spend all Equilibrium Sigils: double all Patience and gain +${effect.oblivionPerSigil} Oblivion per Sigil spent`;
    case 'neutrality_equilibrium_tactical_spend': return `If you have ${effect.spend}+ Equilibrium Sigils, spend ${effect.spend} for either +${effect.burstOblivion} Oblivion burst or ${effect.restorePercent}% team Patience restore`;
    case 'neutrality_patient_light_gain': return `Grant ${effect.value} Patient Light stack${effect.value === 1 ? '' : 's'} (boosts card-play Patience gain with diminishing returns at high stacks)`;
    case 'neutrality_designate_vessel': return 'Designate the Seraphim with the highest Patience as your Vessel';
    case 'neutrality_attack_preserve': return `Seraphim attacks preserve ${effect.percent}% of consumed Patience this turn`;
    case 'overclock':
      return `Overclock: gain ${effect.strain} Strain, then ${formatEffectsInline(effect.then.filter(Boolean))}`;
    case 'conditional':
      return `If ${formatCondition(effect.condition)}, ${formatEffectsInline(effect.then.filter(Boolean))}`;
    case 'eternal_stack_gain':
      return `Gain ${formatEternalStack(effect.stack, effect.value)}`;
    case 'eternal_stack_spend':
      return effect.value >= 9999
        ? `Spend all ${eternalStackName(effect.stack)}`
        : `Spend ${formatEternalStack(effect.stack, effect.value)}`;
    case 'eternal_stack_cashout': {
      const parts: string[] = [`+${effect.oblivionPerStack} Oblivion`];
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
    case 'pyro_transcendent_confluence': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      const extras: string[] = [];
      if ((effect.gainInfernoPerPair ?? 0) > 0) extras.push(`+${effect.gainInfernoPerPair} Heat per pair`);
      if ((effect.gainChromaPerPair ?? 0) > 0) extras.push(`+${effect.gainChromaPerPair} Chroma Ember per pair`);
      if ((effect.drawAtPairs ?? 0) > 0) extras.push(`draw 1 per ${effect.drawAtPairs} pair${effect.drawAtPairs === 1 ? '' : 's'}`);
      if ((effect.empowerAtPairs ?? 0) > 0) extras.push(`empower next card at ${effect.empowerAtPairs}+ pair${effect.empowerAtPairs === 1 ? '' : 's'}`);
      const suffix = extras.length > 0 ? `; ${extras.join('; ')}` : '';
      return `Confluence ${scope} matched Heat and Chroma Ember pairs (+${formatExactValue(effect.oblivionPerPair)} Oblivion per pair${suffix})`;
    }
    case 'light_transcendent_duality_choice': {
      const formula = `${effect.baseOblivion} + ${effect.resonanceScale}xResonance + ${effect.haloScale}xHalo + ${effect.distinctNoteScale}xDistinct Notes + ${effect.thresholdScale}xfloor((Resonance + Halo)/${effect.thresholdDivisor})`;
      return `Duality: choose Discard 1, draw 2; or gain Oblivion (${formula})`;
    }
    case 'thorn_briar_spiral_bloom': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Bloom ${scope} ${setSecondaryName('thorn')} (+${effect.trailPerSpiral} Trail per spiral)`;
    }
    case 'snow_polar_capacitor_release': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Release ${scope} ${setSecondaryName('snow')} (Voltage: +${formatExactValue(effect.voltageOblivionPerCapacitor)} Oblivion per capacitor · Frost: +${formatExactValue(effect.frostArcticChargePerCapacitor)} Arctic Charge per capacitor)`;
    }
    case 'absol_cascade_proof_amplify': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Amplify ${scope} ${setSecondaryName('absol')} (+${effect.oblivionPerProofDepth} Oblivion per proof)`;
    }
    case 'garden_wild_pollen_seed': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Seed ${scope} ${setSecondaryName('garden')} (+${formatExactValue(effect.oblivionPerPollen)} Oblivion per pollen, +${formatExactValue(effect.scoreMultPerBloom)}% score per Bloom)`;
    }
    case 'flutter_wing_pulse_amplify': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Amplify ${scope} ${setSecondaryName('flutter')} (double next ${effect.doubleNextGains} spectrum gain${effect.doubleNextGains === 1 ? '' : 's'} per pulse)`;
    }
    case 'flutter_resonance_harmonize': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      const parts: string[] = [];
      if ((effect.spectrumPerResonance ?? 0) > 0) parts.push(`+${formatExactValue(effect.spectrumPerResonance ?? 0)} Spectrum per resonance`);
      if ((effect.oblivionPerResonance ?? 0) > 0) parts.push(`+${formatExactValue(effect.oblivionPerResonance ?? 0)} Oblivion per resonance`);
      if ((effect.oblivionPerFormation ?? 0) > 0) parts.push(`+${formatExactValue(effect.oblivionPerFormation ?? 0)} Oblivion per Formation`);
      if ((effect.drawPerResonance ?? 0) > 0) parts.push(`+${formatExactValue(effect.drawPerResonance ?? 0)} draw per resonance`);
      if (effect.empowerNext) parts.push('empower your next card');
      return `Harmonize ${scope} ${eternalStackName('flutter')} (${parts.join(', ')})`;
    }
    case 'flutter_resonance_apex': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      const parts = [
        `+${formatExactValue(effect.oblivionPerResonance)} Oblivion per resonance`,
        `+${formatExactValue(effect.oblivionPerSpectrum)} Oblivion per current Spectrum`,
        `+${formatExactValue(effect.oblivionPerFormation)} Oblivion per Formation`,
      ];
      if ((effect.drawPerFormation ?? 0) > 0) parts.push(`+${formatExactValue(effect.drawPerFormation ?? 0)} draw per Formation`);
      if ((effect.empowerAtFormation ?? 0) > 0) parts.push(`empower your next card at Formation ${effect.empowerAtFormation}+`);
      return `Apex ${scope} ${eternalStackName('flutter')} (${parts.join(', ')})`;
    }
    case 'butterfly_release': {
      const scope = effect.spend >= 9999 ? 'all' : `up to ${effect.spend}`;
      return `Release ${scope} Spectrum (+${effect.oblivionPerSpectrum} Oblivion per Spectrum)`;
    }
    case 'seas_undertow_gain': return `Gain ${effect.value} Undertow`;
    case 'seas_foam_gain': return `Gain ${effect.value} Foam`;
    case 'seas_undertow_release': {
      const scope = effect.spend >= 9999 ? 'all' : `up to ${effect.spend}`;
      const foamText = (effect.foamPerSpent ?? 0) > 0 ? `; +${effect.foamPerSpent} Foam per Undertow spent` : '';
      return `Release ${scope} Undertow (+${effect.oblivionPerUndertow} Oblivion per Undertow${foamText})`;
    }
    case 'seas_deepwake_surge': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      const releaseScope = effect.releaseSpend === undefined
        ? 'all gained Undertow'
        : effect.releaseSpend >= 9999
          ? 'all Undertow'
          : `up to ${effect.releaseSpend} Undertow`;
      const foamText = (effect.foamPerDeepwake ?? 0) > 0
        ? `; +${effect.foamPerDeepwake} Foam per Deepwake`
        : '';
      return `Surge ${scope} Deepwake (+${effect.undertowPerDeepwake} Undertow per Deepwake, then release ${releaseScope} at +${effect.oblivionPerUndertow} Oblivion per Undertow with +${effect.oblivionPerDeepwakeBonus} per Deepwake${foamText})`;
    }
    case 'butterfly_spectrum_gain': return `Gain ${effect.value} Flutter Spectrum`;
    case 'black_glass_white_flame_gain': return `Gain ${effect.value} White Flame`;
    case 'black_glass_black_flame_gain': return `Gain ${effect.value} Black Flame`;
    case 'black_glass_fracture_gain': return `Gain ${effect.value} Fracture`;
    case 'black_glass_flames_swap': return 'Swap White Flame and Black Flame';
    case 'black_glass_fracture_collapse': return `Fracture collapses by ${effect.value}`;
    case 'black_glass_eclipse_burst': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      const parts = [`Burst ${scope} Eclipse (+${formatExactValue(effect.oblivionPerEclipse)} Oblivion per Eclipse)`];
      const balanceBonus = effect.balanceBonusPerEclipse;
      if ((balanceBonus ?? 0) > 0) {
        parts.push(`+${formatExactValue(balanceBonus!)} per Eclipse per balance tier`);
      }
      const fractureBonus = effect.fractureBonusPerEclipse;
      if ((fractureBonus ?? 0) > 0) {
        parts.push(`+${formatExactValue(fractureBonus!)} per Eclipse per Fracture`);
      }
      return parts.join('; ');
    }
    case 'set_garden_law': return `Set Garden Law to ${effect.law} if unset`;
    case 'echo_effect_double': return `Echo effects are doubled for ${formatCount(effect.duration, 'turn')}`;
    case 'sigil_on_burn_play': return `Gain ${effect.value} Sun Sigil when you play a Burn-phase card`;
    case 'replay_last_burn_card': return 'Replay the last Burn-phase card played this turn';
    case 'ignite_units_burn': return `Ignite up to ${formatCount(effect.count, 'unit')} into Burn`;
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
    case 'forge_reforge_charge_cap_raise': return `Raise the Reforge Charge cap by ${effect.value}`;
    case 'forge_pearl_drop': return `Drop ${formatCount(effect.value, 'Pearl')}`;
    case 'forge_pearl_cashout': {
      return `Spend ${formatCount(effect.spend, 'Pearl')} (+${effect.oblivionPerPearl} Oblivion per Pearl)`;
    }
    case 'forge_recast_last': return `Recast the last card at ${Math.round(effect.power * 100)}% power`;
    case 'forge_recast_last_n': return `Recast the last ${formatCount(effect.count, 'card')} at ${Math.round(effect.power * 100)}% power`;
    case 'forge_recast_random': return `Recast ${formatCount(effect.count ?? 1, 'random played card')} at ${Math.round(effect.power * 100)}% power`;
    case 'forge_nacre_recast': {
      const target = effect.targetMode === 'last' ? 'the last card' : `the last ${formatCount(effect.count ?? 1, 'card')}`;
      return `Nacre-Recast ${target} at ${Math.round(effect.power * 100)}% power`;
    }
    case 'forge_temper': {
      const target = effect.targetMode === 'self' ? 'this card' : effect.targetMode === 'last_played' ? 'last played card' : 'all Seraphim on board';
      return `Temper ${target}: x${formatExactValue(effect.factor)} power`;
    }
    case 'forge_anvil_seal': {
      const target = effect.target === 'self' ? 'this card' : 'last played card';
      return `Anvil-Seal ${target} (+${effect.burstOblivion} Oblivion on its next play)`;
    }
    case 'forge_imprint_gain': {
      const target = effect.targetMode === 'all_played'
        ? 'all played cards'
        : effect.targetMode === 'last'
          ? 'the last played card'
          : `the last ${formatCount(effect.count ?? 1, 'played card')}`;
      return `Imprint ${target} (+${effect.value} Imprint)`;
    }
    case 'forge_imprint_spend_burst': {
      return `Spend ${formatCount(effect.spend, 'Imprint')} (+${effect.oblivionPerImprint} Oblivion per Imprint)`;
    }
    case 'forge_imprint_spend_recast': {
      const target = effect.targetMode === 'last'
        ? 'the last card'
        : effect.targetMode === 'lastN'
          ? `the last ${formatCount(effect.count ?? 1, 'card')}`
          : `${formatCount(effect.count ?? 1, 'random played card')}`;
      const bonusPower = effect.bonusPowerPerImprint !== undefined
        ? `, +${Math.round(effect.bonusPowerPerImprint * 100)}% power per Imprint spent`
        : '';
      return `Spend ${formatCount(effect.spend, 'Imprint')}: recast ${target} at ${Math.round(effect.power * 100)}% power${bonusPower}`;
    }
    case 'forge_unrecorded_ignite': return 'Ignite the Unrecorded Hue';
    case 'forge_crown_cashout': {
      return `Cash out all Forge Crowns (+${effect.oblivionPerCrown} Oblivion per Crown)`;
    }
    case 'dfh_eternal_veil_rite': {
      return `Gain ${formatCount(effect.marks, 'Veil Mark')}; your next base reveal cashes all Veil Marks (+${effect.oblivionPerMark} Oblivion per mark)`;
    }
    case 'dfh_veil_marks_amplify': {
      return `Amplify current Veil Marks by x${formatExactValue(effect.factor)}`;
    }
    case 'dfh_veil_marks_transmute': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      const source = effect.source === 'pyre' ? 'Pyre Embers' : 'Cinder Crowns';
      return `Transmute ${scope} ${source} into Veil Marks (${formatExactValue(effect.marksPerResource)} marks each)`;
    }
    case 'dfh_veil_marks_cashout': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Cash out ${scope} Veil Marks (+${effect.oblivionPerMark} Oblivion per mark)`;
    }
    case 'dfh_crown_cashout': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Cash out ${scope} Cinder Crowns (+${effect.oblivionPerCrown} Oblivion per crown)`;
    }
    case 'starlight_gain':
      return `Gain ${formatCount(effect.amount, 'Starlight Charge')}`;
    case 'dream_lattice_gain':
      return `Gain ${formatCount(effect.amount, 'Dream Lattice stack')}`;
    case 'wuas_nova_wish_burst':
      return `Nova Wish Burst (Oblivion = Starlight × (1 + Dream × ${effect.dreamMultiplier ?? 0.4}))${effect.consumeStarlight ? '; consumes all Starlight' : ''}`;
    case 'wuas_constellation_lock_release': {
      const scope = effect.consume !== undefined ? `up to ${effect.consume}` : 'all';
      return `Cash out ${scope} Star Crowns (+${effect.oblivionPerStack} Oblivion per Crown)`;
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
    case 'cherubim_seraphim_amp': return `Seraphim bonuses are amplified by +${effect.value}`;
    case 'cherubim_pyro_heat_gain': return `Gain ${effect.value} Heat per card played`;
    case 'cherubim_draw_per_card': return `Draw ${formatCount(effect.value, 'card')} per card played`;
    case 'cherubim_resource_per_card': {
      const resourceLabel =
        effect.resource === 'butterflySpectrum' ? 'Spectrum'
          : effect.resource === 'radiance' ? 'Radiance'
            : effect.resource === 'trail' ? 'Trail'
              : 'Strain';
      return `Gain ${effect.value} ${resourceLabel} per card played`;
    }
    case 'cherubim_adjacent_seraphim_bonus': {
      switch (effect.bonusType) {
        case 'oblivion':
          return `Adjacent active Seraphim gain +${effect.value} Oblivion per card played`;
        case 'draw':
          return `Each adjacent active Seraphim adds ${formatCount(effect.value, 'extra card')} whenever you play a card`;
        default:
          return `Adjacent active Seraphim ${effect.bonusType} +${effect.value}`;
      }
    }
    case 'cherubim_conditional_buff': return `If ${formatCondition(effect.condition)}, this Cherubim grants +${effect.value} bonus power`;
    case 'cherubim_patience_per_card': return `Adjacent Seraphim and Angels gain +${effect.value} Patience per card played`;
    case 'cherubim_global_oblivion_mult': return `All Oblivion gain +${Math.round(effect.value * 100)}%`;
    case 'cherubim_attack_buff': {
      const parts: string[] = [];
      if (effect.bonusBaseOblivion !== undefined) parts.push(`base +${effect.bonusBaseOblivion}`);
      if (effect.cooldownDeltaCards !== undefined) parts.push(`cooldown ${effect.cooldownDeltaCards >= 0 ? '+' : ''}${effect.cooldownDeltaCards}`);
      if (effect.multiplier !== undefined) parts.push(`multiplier x${effect.multiplier.toFixed(2)}`);
      if (effect.condition) parts.push(`when ${formatCondition(effect.condition)}`);
      return `Buffs ${effect.targetUnitType === 'Any' ? 'Seraphim and Angel' : effect.targetUnitType} attacks: ${parts.join(', ') || 'none'}`;
    }
    case 'set_garden_law':
    case 'echo_effect_double':
    case 'sigil_on_burn_play':
    case 'replay_last_burn_card':
    case 'ignite_units_burn':
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
    case 'cherubim_charge_per_n_cards': return `Gain 1 Reforge Charge every ${effect.n} cards you play`;
    case 'cherubim_temper_on_next_seraphim': return `Auto-Temper the next Seraphim you play (+${Math.round(effect.factor * 100)}%)`;
    case 'cherubim_pearl_per_recast_bonus': return `+${effect.value} extra Pearl per recast event`;
    case 'cherubim_recast_oblivion_bonus': return `+${effect.value} Oblivion per recast event`;
    case 'cherubim_seraphim_recast_amp': return `Seraphim recasts fire at +${Math.round(effect.value * 100)}% power`;
    default:
      return (effect as { type: string }).type;
  }
}

export function getCanonicalCardDescription(card: CardDefinition): string {
  const snowboundPrefix = card.snowboundPhase ? `${card.snowboundPhase}. ` : '';

  if (card.type === 'Ophanim') {
    return `${snowboundPrefix}${formatEffectsInline(card.effects)}`.trim();
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
    return `${snowboundPrefix}${parts.join('. ')}`.trim();
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
    return `${snowboundPrefix}${parts.join('. ')}`.trim();
  }

  const angel = card as AngelDefinition;
  const parts: string[] = [];
  if (angel.onSummonEffects.length > 0) {
    parts.push(`On summon: ${formatEffectsInline(angel.onSummonEffects)}`);
  }
  parts.push(`After ${formatCount(angel.activatedAbility.cardsPlayedRequirement, 'card')} played: ${getCanonicalActivatedAbilityDescription(angel)}`);
  parts.push(`While on board: ${formatAngelBoardBonus(angel.baseStats)}`);
  if (angel.element === 'Neutrality') {
    parts.push('Patience: accumulates +1 stack per card played (boosted by Patient Light and adjacent Cherubim); on attack, each stack → +2% base Oblivion (stacks then reset)');
  }
  return `${snowboundPrefix}${parts.join('. ')}`.trim();
}

export function getCanonicalActivatedAbilityDescription(card: AngelDefinition): string {
  return formatEffectsInline(card.activatedAbility.effects);
}

function pushSummarySection(sections: CardSummarySection[], title: string, lines: string[]): void {
  const seen = new Set<string>();
  const filtered = lines
    .map(line => line.trim())
    .filter((line) => {
      if (line.length === 0) return false;
      const key = normalizeSummaryLine(line);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (filtered.length === 0) return;
  sections.push({ title, lines: filtered });
}

/** Collects all play/summon-time CardEffect arrays from a card definition for mechanic detection. */
function collectAllCardEffects(card: CardDefinition): CardEffect[] {
  if (card.type === 'Ophanim') return [...card.effects];
  if (card.type === 'Cherubim') return [...(card as CherubimDefinition).onPlayEffects];
  if (card.type === 'Seraphim') return [...(card as SeraphimDefinition).onPlayEffects];
  const angel = card as AngelDefinition;
  return [...angel.onSummonEffects, ...angel.activatedAbility.effects];
}

function flattenNestedEffects(effects: ReadonlyArray<CardEffect>): CardEffect[] {
  const out: CardEffect[] = [];
  const stack = [...effects.filter(Boolean)];

  while (stack.length > 0) {
    const effect = stack.pop();
    if (!effect) continue;
    out.push(effect);

    if (effect.type === 'conditional') {
      stack.push(...effect.then.filter(Boolean));
      continue;
    }

    if (effect.type === 'gate_payoff') {
      for (const gate of effect.gates) {
        if (gate.payoff) stack.push(gate.payoff);
      }
      continue;
    }

    if ('effect' in effect && effect.effect && typeof effect.effect === 'object') {
      stack.push(effect.effect as CardEffect);
    }

    const nestedEffects = (effect as { effects?: unknown }).effects;
    if (Array.isArray(nestedEffects)) {
      for (const entry of nestedEffects) {
        if (!entry || typeof entry !== 'object') continue;
        if ('type' in entry) {
          stack.push(entry as CardEffect);
          continue;
        }
        if ('effect' in entry && entry.effect && typeof entry.effect === 'object') {
          stack.push(entry.effect as CardEffect);
        }
      }
    }
  }

  return out;
}

function dedupeSections(sections: CardSummarySection[]): CardSummarySection[] {
  const seen = new Set<string>();
  const result: CardSummarySection[] = [];

  for (const section of sections) {
    const dedupedLines = section.lines.filter((line) => {
      const key = normalizeSummaryLine(line);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (dedupedLines.length > 0) {
      result.push({ ...section, lines: dedupedLines });
    }
  }

  return result;
}

function collectMechanicNotes(card: CardDefinition): string[] {
  const notes: string[] = [];
  const seen = new Set<string>();
  const pushNote = (note: string) => {
    const key = normalizeSummaryLine(note);
    if (seen.has(key)) return;
    seen.add(key);
    notes.push(note);
  };

  const allEffects = flattenNestedEffects(collectAllCardEffects(card));
  const stackKinds = new Set<string>();
  const secondaryKinds = new Set<string>();
  const turnResources = new Set<string>();

  const registerCondition = (condition: EffectCondition | undefined) => {
    if (!condition) return;
    if (condition.type === 'eternal_stack_gte') stackKinds.add(condition.stack);
    if (condition.type === 'set_secondary_gte') secondaryKinds.add(condition.kind);
    if (condition.type === 'pyro_heat_gte') turnResources.add('Heat');
    if (condition.type === 'radiance_gte' || condition.type === 'light_resonance_gte') turnResources.add('Radiance');
    if (condition.type === 'trail_gte') turnResources.add('Trail');
    if (condition.type === 'strain_gte' || condition.type === 'strain_lte') turnResources.add('Strain');
    if (condition.type === 'equilibrium_sigils_gte') turnResources.add('Equilibrium Sigils');
    if (condition.type === 'resonance_charge_gte') turnResources.add('Resonance Charge');
    if (condition.type === 'prismatic_node_charges_gte') turnResources.add('Prism Charges');
    if (condition.type === 'black_glass_black_flame_gte' || condition.type === 'black_glass_flames_equal') turnResources.add('Twin Flames');
    if (condition.type === 'black_glass_fracture_gte') turnResources.add('Fracture');
    if (condition.type === 'starlight_gte') turnResources.add('Starlight Charges');
    if (condition.type === 'dream_lattice_gte') turnResources.add('Dream Lattice');
  };

  for (const effect of allEffects) {
    if (effect.type === 'eternal_stack_gain' || effect.type === 'eternal_stack_spend' || effect.type === 'eternal_stack_cashout') {
      stackKinds.add(effect.stack);
      continue;
    }
    if (effect.type === 'set_secondary_gain' || effect.type === 'set_secondary_spend') {
      secondaryKinds.add(effect.kind);
      continue;
    }

    if (effect.type === 'conditional') {
      registerCondition(effect.condition);
      continue;
    }

    if (effect.type === 'gate_payoff') {
      for (const gate of effect.gates) {
        registerCondition(gate.condition);
      }
      continue;
    }

    if (effect.type === 'pyro_heat_gain' || effect.type === 'pyro_heat_spend' || effect.type === 'pyro_heat_burst') turnResources.add('Heat');
    if (effect.type === 'radiance_gain' || effect.type === 'radiance_spend' || effect.type === 'radiance_double') turnResources.add('Radiance');
    if (effect.type === 'trail_gain' || effect.type === 'trail_spend') turnResources.add('Trail');
    if (effect.type === 'strain_gain' || effect.type === 'strain_vent' || effect.type === 'overclock') turnResources.add('Strain');
    if (effect.type === 'neutrality_equilibrium_sigil_gain' || effect.type === 'neutrality_equilibrium_starbound_cashout' || effect.type === 'neutrality_equilibrium_tactical_spend') {
      turnResources.add('Equilibrium Sigils');
    }
    if (effect.type === 'neutrality_patient_light_gain' || effect.type === 'neutrality_designate_vessel' || effect.type === 'neutrality_attack_preserve') {
      turnResources.add('Patient Light and Vessel');
    }
    if (effect.type === 'prismatic_charge_spend') turnResources.add('Prism Charges');
    if (effect.type === 'resonance_charge_gain' || effect.type === 'resonance_charge_spend') turnResources.add('Resonance Charge');
    if (effect.type === 'monochromatic_shards_gain' || effect.type === 'monochromatic_shards_spend') turnResources.add('Monochromatic Shards');
    if (effect.type === 'black_glass_white_flame_gain' || effect.type === 'black_glass_black_flame_gain' || effect.type === 'black_glass_flames_swap') {
      turnResources.add('Twin Flames');
    }
    if (effect.type === 'black_glass_fracture_gain' || effect.type === 'black_glass_fracture_collapse') turnResources.add('Fracture');
    if (effect.type === 'seas_undertow_gain' || effect.type === 'seas_undertow_release') turnResources.add('Undertow');
    if (effect.type === 'seas_foam_gain') turnResources.add('Foam');
    if (effect.type === 'starlight_gain' || effect.type === 'wuas_nova_wish_burst') turnResources.add('Starlight Charges');
    if (effect.type === 'dream_lattice_gain' || effect.type === 'wuas_nova_wish_burst' || effect.type === 'wuas_infinite_starbirth') {
      turnResources.add('Dream Lattice');
    }
    if (effect.type === 'forge_reforge_charge_gain' || effect.type === 'forge_reforge_charge_cap_raise') turnResources.add('Reforge Charge');
    if (effect.type === 'forge_pearl_drop' || effect.type === 'forge_pearl_cashout') turnResources.add('Pearls');
    if (effect.type === 'forge_imprint_gain' || effect.type === 'forge_imprint_spend_burst' || effect.type === 'forge_imprint_spend_recast') {
      turnResources.add('Imprint');
    }
    if (effect.type === 'dfh_eternal_veil_rite' || effect.type === 'dfh_veil_marks_amplify' || effect.type === 'dfh_veil_marks_transmute' || effect.type === 'dfh_veil_marks_cashout') {
      turnResources.add('Veil Marks');
    }
  }

  if (card.type === 'Angel') {
    const angel = card as AngelDefinition;
    for (const condition of angel.extraSummonConditions ?? []) {
      registerCondition(condition as unknown as EffectCondition);
      if (condition.type === 'eternal_stack_gte') stackKinds.add(condition.stack);
      if (condition.type === 'set_secondary_gte') secondaryKinds.add(condition.kind);
    }
  }

  if (card.type === 'Seraphim') {
    const seraphim = card as SeraphimDefinition;
    if (seraphim.patienceThreshold !== undefined) turnResources.add('Patience');
    for (const attack of seraphim.attacks ? [seraphim.attacks.unsynergized, seraphim.attacks.synergized] : []) {
      for (const cost of attack.costs ?? []) {
        if (cost.type === 'spend_pyro_heat') turnResources.add('Heat');
        if (cost.type === 'spend_radiance') turnResources.add('Radiance');
        if (cost.type === 'spend_trail') turnResources.add('Trail');
        if (cost.type === 'spend_strain') turnResources.add('Strain');
      }
    }
  }

  if (card.type === 'Angel') {
    const angel = card as AngelDefinition;
    for (const attack of angel.attacks ? [angel.attacks.primary, angel.attacks.exalted] : []) {
      for (const cost of attack.costs ?? []) {
        if (cost.type === 'spend_pyro_heat') turnResources.add('Heat');
        if (cost.type === 'spend_radiance') turnResources.add('Radiance');
        if (cost.type === 'spend_trail') turnResources.add('Trail');
        if (cost.type === 'spend_strain') turnResources.add('Strain');
      }
    }
  }

  for (const stack of stackKinds) {
    pushNote(`${eternalStackName(stack)}: primary stack resource used by this card's higher-rarity gain/spend/cashout loop.`);
  }

  for (const secondary of secondaryKinds) {
    pushNote(`${setSecondaryName(secondary)}: auxiliary set resource consumed by this card's bespoke payoff pattern.`);
  }

  if (turnResources.has('Heat')) pushNote('Heat: Fire pressure resource used for scaling, costs, or burst conversion.');
  if (turnResources.has('Radiance')) pushNote('Radiance: Light resource used for spend checks and burst formulas.');
  if (turnResources.has('Trail')) pushNote('Trail: Thornbound tempo resource that fuels spend/cashout cards.');
  if (turnResources.has('Strain')) pushNote('Strain: Mechanical overload resource; this card either builds, vents, or spends it.');
  if (turnResources.has('Equilibrium Sigils')) pushNote('Equilibrium Sigils: Neutrality setup currency for tactical spend or full cashout turns.');
  if (turnResources.has('Patient Light and Vessel')) pushNote('Patient Light / Vessel: Neutrality patience enhancer and focus target for attack conversion lines.');
  if (turnResources.has('Patience')) pushNote('Patience: Seraphim combat stacks gained per card play and converted on attack.');
  if (turnResources.has('Resonance Charge')) pushNote('Resonance Charge: Prismatic-Light accumulator used for conditional high-value conversions.');
  if (turnResources.has('Prism Charges')) pushNote('Prism Charges: channel-switch charges spent by advanced Prismatic effects.');
  if (turnResources.has('Monochromatic Shards')) pushNote('Monochromatic Shards: Black Glass setup currency that supports burst timing turns.');
  if (turnResources.has('Twin Flames')) pushNote('Twin Flames: White/Black flame balance state that determines Black Glass payoff strength.');
  if (turnResources.has('Fracture')) pushNote('Fracture: Black Glass instability track that amplifies Eclipse burst payoffs.');
  if (turnResources.has('Undertow')) pushNote('Undertow: Eternal Seas pressure pool released for burst Oblivion turns.');
  if (turnResources.has('Foam')) pushNote('Foam: Eternal Seas side resource generated by Undertow conversion loops.');
  if (turnResources.has('Starlight Charges')) pushNote('Starlight Charges: Wished Upon A Star burst fuel for nova and starbirth effects.');
  if (turnResources.has('Dream Lattice')) pushNote('Dream Lattice: Wished Upon A Star amplifier that scales Starlight payoffs.');
  if (turnResources.has('Reforge Charge')) pushNote('Reforge Charge: Abyssal Forge pacing resource for recast-temper sequences.');
  if (turnResources.has('Pearls')) pushNote('Pearls: Abyssal Forge spend resource used for direct Oblivion cashout.');
  if (turnResources.has('Imprint')) pushNote('Imprint: Abyssal Forge stored value converted into burst or recast power.');
  if (turnResources.has('Veil Marks')) pushNote('Veil Marks: Death-flamed Hell mark stack transmuted into large cashout spikes.');

  if (card.prismaticDepth !== undefined) {
    pushNote(`Prismatic Depth: ${card.prismaticDepth} (controls Glass Absolute refraction links and board-fragment scaling).`);
  }

  return notes;
}

function formatAttackSummary(
  label: string,
  attack: {
    name: string;
    baseOblivion: number;
    cooldownCards: number;
    costs?: ReadonlyArray<AttackCost>;
    requiresAngelOnBoard?: boolean;
    tags?: ReadonlyArray<string>;
  },
  options?: { eternityChrono?: boolean },
): string {
  const parts = [
    `${label}: ${attack.name}`,
    getCanonicalAttackDescription(attack, options),
  ];

  return parts.join(', ');
}

export function getCanonicalAttackDescription(attack: {
  id?: string;
  name: string;
  baseOblivion: number;
  cooldownCards: number;
  costs?: ReadonlyArray<AttackCost>;
  requiresAngelOnBoard?: boolean;
  tags?: ReadonlyArray<string>;
}, options?: { eternityChrono?: boolean }): string {
  const costText = (attack.costs && attack.costs.length > 0) ? ` · Cost: ${formatCosts(attack.costs)}` : '';
  const angelText = attack.requiresAngelOnBoard ? ' · Requires Angel' : '';
  const furnaceText = (attack.tags ?? []).some(tag => tag.toLowerCase() === 'fire')
    ? ' · +2.5% attack per Heat (max +75%) · Spend up to 5 Heat: +1% attack per Heat spent (max +5%)'
    : '';
  const eternalFireAttack = typeof attack.id === 'string' && attack.id.startsWith('btei-pyroabyss-');
  const infiniteFireAttackForChroma = typeof attack.id === 'string' && attack.id.startsWith('inf-') && (attack.tags ?? []).some(tag => tag.toLowerCase() === 'fire');
  const chromaText = eternalFireAttack
    ? ' · +4% attack per Chroma Ember (max +16%, consumed on Eternal Fire attack)'
    : infiniteFireAttackForChroma
      ? ' · +5% attack per Chroma Ember (max +25%, consumed on Infinite Fire attack)'
      : (options?.eternityChrono ? ' · +4% attack per Chroma Ember (max +16%, consumed on Eternal Fire attack)' : '');
  return `${attack.baseOblivion} base Oblivion · ${formatCount(attack.cooldownCards, 'card')} cooldown${angelText}${costText}${furnaceText}${chromaText}`;
}

function normalizePreviewFingerprint(text: string): string {
  return formatDisplayCardText(text)
    .replace(/^[A-Za-z ]+:\s*/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatReadableRuleText(text: string): string {
  return formatDisplayCardText(text)
    .replace(/On play:/g, 'Play:')
    .replace(/On summon:/g, 'Summon:')
    .replace(/After (\d+) cards played:/g, 'After $1 cards:')
    .replace(/Grant (\d+) Patient Light stacks? \(card-play Patience gain becomes 1 \+ Patient Light stacks\)/g, '+$1 Patient Light')
    .replace(/Grant (\d+) Patient Light stack \(card-play Patience gain becomes 1 \+ Patient Light stacks\)/g, '+$1 Patient Light')
    .replace(/card-play Patience gain becomes 1 \+ Patient Light stacks/g, 'card-play Patience = 1 + Patient Light stacks')
    .replace(/All Seraphim on board gain \+/g, 'All Seraphim +')
    .replace(/If this is the first card you played this turn,?/g, 'First card this turn:')
    .replace(/If you have played (\d+)\+ cards this turn/g, 'After $1+ cards:')
    .replace(/If you have played 1\+ cards this turn/g, 'After 1+ cards:')
    .replace(/On board:/g, 'Board:')
    .replace(/While on board:/g, 'Board:')
    .replace(/On attack, each Patience stack grants \+15 Oblivion \(stacks then reset\)/g, 'Attack: each Patience stack +15 Oblivion, then reset')
    .replace(/;\s*;+/g, '; ')
    .replace(/\s{2,}/g, ' ')
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
    pushSummarySection(sections, 'Play', formatEffectLines(card.effects));
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
    pushSummarySection(sections, 'On Play', formatEffectLines(cherubim.onPlayEffects));
  }

  if (card.type === 'Seraphim') {
    const seraphim = card as SeraphimDefinition;
    pushSummarySection(sections, 'On Play', formatEffectLines(seraphim.onPlayEffects));
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
      const eternityChrono = seraphim.element === 'Fire' && seraphim.rarity === 'Eternal';
      pushSummarySection(sections, 'Attacks', [
        formatAttackSummary('Unsynergized', seraphim.attacks.unsynergized, { eternityChrono }),
        formatAttackSummary('Synergized', seraphim.attacks.synergized, { eternityChrono }),
      ]);
    }
  }

  if (card.type === 'Angel') {
    const angel = card as AngelDefinition;
    const summonCostText = angel.summonCost.length > 0
      ? angel.summonCost.map(id => CardRegistry.get(id)?.name ?? id).join(', ')
      : 'none';
    const summonLines = [`Materials: ${summonCostText}`];
    const displayableSummonConditions = getDisplayableSummonConditions(angel);
    if (displayableSummonConditions.length > 0) {
      summonLines.push(`Extra: ${displayableSummonConditions.map(formatSummonCondition).join('; ')}`);
    }
    pushSummarySection(sections, 'Summon', summonLines);
    pushSummarySection(sections, 'On Summon', formatEffectLines(angel.onSummonEffects));
    pushSummarySection(sections, 'Awaken', [
      `${angel.activatedAbility.name}: ${getCanonicalActivatedAbilityDescription(angel)}`,
    ]);
    pushSummarySection(sections, 'On Board', [formatAngelBoardBonus(angel.baseStats)]);
    if (angel.element === 'Neutrality') {
      pushSummarySection(sections, 'Patience', [
        'Accumulates +1 Patience per card played (boosted by Patient Light stacks and adjacent Patience Cherubim)',
        'On attack: each Patience stack grants +2% base Oblivion (stacks then reset)',
      ]);
    }
    if (angel.attacks) {
      const eternityChrono = angel.element === 'Fire' && angel.rarity === 'Eternal';
      pushSummarySection(sections, 'Attacks', [
        formatAttackSummary('Primary', angel.attacks.primary, { eternityChrono }),
        formatAttackSummary('Exalted', angel.attacks.exalted, { eternityChrono }),
      ]);
    }
  }

  if (hooks.length > 0) {
    sections.splice(1, 0, { title: 'Hooks', lines: hooks });
  }

  // Add a Duality section for Heavenly Light Transcendent cards so the choice mechanic
  // is explained in plain terms separately from the per-effect formula lines.
  if (collectAllCardEffects(card).some(e => e.type === 'light_transcendent_duality_choice')) {
    pushSummarySection(sections, 'Duality', [
      'When triggered, choose one: Discard 1 card and draw 2; ' +
      'or gain Oblivion scaled by your current Radiance, Halo, Resonance, and distinct Light notes.',
    ]);
  }

  pushSummarySection(sections, 'Mechanics', collectMechanicNotes(card));

  return dedupeSections(sections);
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
      const readableCandidate = formatReadableRuleText(candidate);
      const fingerprint = normalizePreviewFingerprint(readableCandidate);
      if (
        fingerprint.length > 0
        && seenFingerprints.some(existing => existing === fingerprint || existing.includes(fingerprint) || fingerprint.includes(existing))
      ) {
        continue;
      }

      preview.push(readableCandidate);
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
  ];

  const sections = getCardSummarySections(card, { abilityTextMode: 'canonical' });
  for (const section of sections) {
    lines.push(`${section.title}:`);
    for (const line of section.lines) {
      lines.push(`- ${formatReadableRuleText(line)}`);
    }
  }

  if (sections.length === 0) {
    lines.push(formatReadableRuleText(getCanonicalCardDescription(card)));
  }

  if (card.type === 'Ophanim') {
    if (card.prismaticDepth !== undefined) {
      lines.push(`Prismatic Depth: ${card.prismaticDepth}`);
    }
    return lines;
  }

  return lines;
}

export function getCardFullStatText(card: CardDefinition): string {
  return getCardFullStatLines(card).join('\n');
}
