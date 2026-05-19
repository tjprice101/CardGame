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
      return `You gain +${bonusValue} extra Cherubim plays per turn ${scope}`;
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
    default:
      return `${(condition as { type: string; value?: number }).type.replace(/_/g, ' ')} ${'value' in (condition as { value?: number }) ? (condition as { value?: number }).value ?? '' : ''}`.trim();
  }
}

function formatEffect(effect: CardEffect): string {
  switch (effect.type) {
    case 'oblivion_flat': return `+${effect.value} Oblivion`;
    case 'set_chain_floor': return `Amplify Chain by +${formatExactValue(effect.value)}`;
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
    case 'dominant_stack_gain': return `Gain ${effect.value} of your dominant resource`;
    case 'trail_gain': return `Gain ${effect.value} Trail`;
    case 'trail_spend': return `Spend ${effect.value} Trail`;
    case 'strain_gain': return `Gain ${effect.value} Strain`;
    case 'strain_vent': return `Vent ${effect.value} Strain`;
    case 'power_flat': return `Your board gains +${effect.value} power`;
    case 'power_percent': return `Your board gains +${effect.value}% power`;
    case 'score_multiplier': return `Gain +${effect.value}% total Oblivion this turn`;
    case 'seraphim_bonus_amplifier': return `Seraphim bonuses are amplified by +${effect.value}`;
    case 'patience_gain_all': return `All active Seraphim gain +${effect.value} Patience`;
    case 'patience_double_all': return 'Double all Patience on the board';
    case 'overclock':
      return `Overclock: gain ${effect.strain} Strain, then ${effect.then.map(formatEffect).join('; ')}`;
    case 'conditional':
      return `If ${formatCondition(effect.condition)}, ${effect.then.map(formatEffect).join('; ')}`;
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
      return `Buffs ${effect.targetUnitType === 'Any' ? 'Seraphim and Angel' : effect.targetUnitType} attacks: ${parts.join(', ') || 'none'}`;
    }
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
  lines.push(`  Proc · +${Math.round(identity.bonusBaseMultiplier * 100)}% +${identity.bonusFlatOblivion} flat · draw ${identity.drawCards} · chain-floor +${identity.chainFloorBonus.toFixed(2)} · dominant +${identity.dominantResourceGain} · cd -${identity.cooldownReduction}`);
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

export function getCardSummarySections(card: CardDefinition): CardSummarySection[] {
  const sections: CardSummarySection[] = [];
  const hooks: string[] = [];

  pushSummarySection(sections, 'Ability', [getCanonicalCardDescription(card)]);

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
    ...getCardSummarySections(card).filter(section => section.title !== 'Ability'),
    ...getCardSummarySections(card).filter(section => section.title === 'Ability'),
  ];

  for (const section of sections) {
    for (const [index, line] of section.lines.entries()) {
      const candidate = section.title === 'Ability' && index === 0 ? line : `${section.title}: ${line}`;
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
  ];

  if (card.type === 'Ophanim') {
    lines.push(formatDisplayCardText(card.description));
    if (card.prismaticDepth !== undefined) {
      lines.push(`Prismatic Depth: ${card.prismaticDepth}`);
    }
    return lines;
  }

  if (card.type === 'Cherubim') {
    const cherubim = card as CherubimDefinition;
    lines.push(formatDisplayCardText(card.description));
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
