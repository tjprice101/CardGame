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
  if (Number.isInteger(value)) return `${value}`;

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
  prism: { singular: 'Mirror Chain link', plural: 'Mirror Chain links' },
  absol: { singular: 'Proof Cascade', plural: 'Proof Cascades' },
  garden: { singular: 'Garden Bloom', plural: 'Garden Blooms' },
  deepwake: { singular: 'Deepwake', plural: 'Deepwake' },
  tide: { singular: 'Tide Crown', plural: 'Tide Crowns' },
  forge: { singular: 'Forge Crown', plural: 'Forge Crowns' },
  pyre: { singular: 'Pyre Ember', plural: 'Pyre Embers' },
};

function eternalStackName(stack: string, plural = true): string {
  const labels = ETERNAL_STACK_LABELS[stack] ?? { singular: stack, plural: `${stack}s` };
  return plural ? labels.plural : labels.singular;
}

const SET_SECONDARY_LABELS: Record<string, { singular: string; plural: string }> = {
  pyro: { singular: 'Chroma Ember', plural: 'Chroma Embers' },
  thorn: { singular: 'Briar Spiral', plural: 'Briar Spirals' },
  glass: { singular: 'Veil Shard', plural: 'Veil Shards' },
  snow: { singular: 'Polar Capacitor', plural: 'Polar Capacitors' },
  prism: { singular: 'Spectrum Echo', plural: 'Spectrum Echoes' },
  absol: { singular: 'Refraction Charge', plural: 'Refraction Charges' },
  garden: { singular: 'Wild Pollen', plural: 'Wild Pollen' },
  flutter: { singular: 'Wing Pulse', plural: 'Wing Pulses' },
  deepwake: { singular: 'Deepwake', plural: 'Deepwake' },
  tide: { singular: 'Tide Echo', plural: 'Tide Echoes' },
  pyre: { singular: 'Cinder Crown', plural: 'Cinder Crowns' },
};

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
    default:
      return `${(cost as { type: string; value: number }).type.replace(/_/g, ' ')} ${(cost as { type: string; value: number }).value}`;
  }
}

function formatCosts(costs: ReadonlyArray<AttackCost> | undefined): string {
  if (!costs || costs.length === 0) return 'none';
  return costs.map(formatAttackCost).join(', ');
}

const INFINITE_RUNTIME_OBLIVION_TEXT: Record<string, string> = {
  'inf-oblivion-absolute': 'Gain Oblivion scaled by total Patience and peak Patience',
  'inf-void-cascade': 'Gain Oblivion scaled by Patience-bearing units, cross-set conversion sources, and peak Patience',
  'inf-genesis-throne': 'Gain Oblivion scaled by total Patience, peak Patience, engine signatures, and setup count',
  'inf-null-apex': 'Gain Oblivion scaled by peak Patience, Patience-bearing units, and low-drift Equilibrium control',
  'inf-entropic-crown': 'Gain Oblivion scaled by Patience-bearing units and total Patience',
  'inf-annihilation-field': 'Gain Oblivion scaled by cross-set conversion sources and peak Patience',
  'inf-sovereign-void': 'Gain Oblivion scaled by total Patience and peak Patience',
  'inf-eternity-rupture': 'Gain Oblivion scaled by Patience-bearing units, conversion sources, and peak Patience',
  'inf-ash-kings-apocalypse': 'Gain Oblivion scaled by Furnace Heat tiers, Chroma Embers, and Heat-Ember balance',
  'inf-pyraxis-colossus': 'Gain Oblivion scaled by Furnace Heat tiers, Chroma Embers, and Heat-Ember balance',
  'inf-pyroclasm-engine': 'Gain Oblivion scaled by Furnace Heat tiers, Chroma Embers, and Heat-Ember balance',
  'inf-riftborn-sovereign': 'Gain Oblivion scaled by Furnace Heat tiers, Chroma Embers, and Heat spent this play',
  'inf-celestial-blackout': 'Gain Oblivion scaled by Radiance, Halo, and active Seraphim',
  'inf-lucent-cataclysm-archon': 'Gain Oblivion scaled by Radiance, Halo, and active Seraphim',
  'inf-heliarch-eclipse-engine': 'Gain Oblivion scaled by Radiance, Halo, and active Seraphim',
  'inf-thorn-widow-engine': 'Gain Oblivion scaled by Scar, Trail, and Briar Spirals',
  'inf-gravebloom-singularity': 'Gain Oblivion scaled by Scar, Trail, and Briar Spirals',
};

function formatEffectsInline(effects: CardEffect[], definitionId?: string): string {
  const lines = formatEffectLines(effects, definitionId);
  if (lines.length === 0) return 'none';
  return lines.join('; ');
}

function normalizeSummaryLine(line: string): string {
  return formatDisplayCardText(line)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function formatEffectLines(effects: CardEffect[], definitionId?: string): string[] {
  if (effects.length === 0) return [];

  const lines: string[] = [];
  const seen = new Set<string>();

  for (const effect of effects.filter(Boolean)) {
    const line = formatEffect(effect, definitionId).trim();
    if (!line || seen.has(line)) continue;
    seen.add(line);
    lines.push(line);
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
    case 'cards_played_gte':
      return `you have played ${condition.value}+ cards this turn`;
    case 'seraphim_active_gte':
      return `you control ${condition.value}+ active Seraphim`;
    case 'cherubim_active_gte':
      return `you control ${condition.value}+ active Cherubim`;
    case 'equilibrium_sigils_gte':
      return `you have ${condition.value}+ Equilibrium Sigils`;
    case 'seraphim_played_this_turn':
      return 'you played a Seraphim this turn';
    case 'seraphim_not_played_this_turn':
      return 'you did not play a Seraphim this turn';
    default:
      return `${(condition as { type: string; value?: number }).type.replace(/_/g, ' ')} ${'value' in (condition as { value?: number }) ? (condition as { value?: number }).value ?? '' : ''}`.trim();
  }
}

function formatEffect(effect: CardEffect, definitionId?: string): string {
  if (!effect || typeof effect !== 'object' || !("type" in effect)) return 'Unknown effect';
  switch (effect.type) {
    case 'oblivion_flat': {
      const runtimeScaled = definitionId ? INFINITE_RUNTIME_OBLIVION_TEXT[definitionId] : undefined;
      if (runtimeScaled) return runtimeScaled;
      return `+${effect.value} Oblivion`;
    }
    case 'score_flat': return `+${effect.value} Oblivion`;
    case 'draw': return `Draw ${formatCount(effect.value, 'card')}`;
    case 'discard_choice': return `Choose and discard ${formatCount(effect.value, 'card')}`;
    case 'discard_draw': return `Discard ${formatCount(effect.discard, 'card')}, then draw ${formatCount(effect.draw, 'card')}`;
    case 'shuffle_discard': return 'Shuffle discard into deck';
    case 'copy_last_hr': return 'Replay last Ophanim played this turn';
    case 'look_top_take': return `Look at the top ${formatCount(effect.look, 'card')}, take ${formatCount(effect.take, 'card')}, and put the rest on the bottom`;
    case 'look_top_take_drop': return `Look at the top ${formatCount(effect.look, 'card')}, take ${formatCount(effect.take, 'card')}, put ${formatCount(effect.drop, 'card')} on the bottom, and discard the rest`;
    case 'look_top_take_type': return `Look at the top ${formatCount(effect.look, 'card')} and take 1 matching ${formatSubtypeList(effect.filter)}`;
    case 'search_deck_by_type': return `Search your deck for 1 matching ${formatSubtypeList(effect.filter)}`;
    case 'salvage_by_type': return `Salvage ${formatCount(effect.filter.length > 1 ? effect.filter.length : 1, 'card')} matching ${formatSubtypeList(effect.filter)}`;
    case 'salvage_any': return 'Salvage any 1 card';
    case 'salvage_by_id': return `Salvage ${effect.label ?? CardRegistry.get(effect.targetId)?.name ?? effect.targetId} from discard`;
    case 'score_multiplier': return `+${effect.value}% of this turn's Oblivion`;
    case 'seraphim_bonus_amplifier': return `Each active Seraphim's payout +${effect.value} Oblivion this turn`;
    case 'patience_gain_all': return `All Seraphim on board gain +${effect.value} Patience`;
    case 'patience_double_all': return 'Double all Patience on the board';
    case 'neutrality_equilibrium_sigil_gain': return `Gain ${effect.value} Equilibrium Sigil${effect.value === 1 ? '' : 's'}`;
    case 'neutrality_equilibrium_starbound_cashout': return `Spend all Equilibrium Sigils: double all Patience and gain +${effect.oblivionPerSigil} Oblivion per Sigil spent`;
    case 'neutrality_equilibrium_tactical_spend': return `If you have ${effect.spend}+ Equilibrium Sigils, spend ${effect.spend} for either +${effect.burstOblivion} Oblivion burst or ${effect.restorePercent}% team Patience restore`;
    case 'neutrality_patient_light_gain': return `Grant ${effect.value} Patient Light stack${effect.value === 1 ? '' : 's'} (boosts card-play Patience gain with diminishing returns at high stacks)`;
    case 'neutrality_attack_preserve': return `Seraphim attacks preserve ${effect.percent}% of consumed Patience this turn`;
    case 'conditional':
      return `If ${formatCondition(effect.condition)}, ${formatEffectsInline(effect.then.filter(Boolean), definitionId)}`;
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
    case 'cherubim_seraphim_amp': return `Seraphim bonuses are amplified by +${Math.round(effect.value * 100)}%`;
    case 'cherubim_draw_per_card': { const cdv = effect.value; return Number.isInteger(cdv) ? `+${cdv} draw per card played` : `+1 draw every ${Math.round(1 / cdv)} cards played`; }
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
    case 'cherubim_on_discard': return `Whenever you discard a card, +${effect.value} Oblivion`;
    case 'cherubim_conditional_buff': return `If ${formatCondition(effect.condition)}, this Cherubim grants +${effect.value} bonus power`;
    case 'cherubim_patience_per_card': return `Adjacent Seraphim and Angels gain +${effect.value} Patience per card played`;
    case 'cherubim_global_oblivion_mult': return `All Oblivion gain +${Math.round(effect.value * 100)}%`;
    case 'cherubim_attack_buff': {
      const parts: string[] = [];
      if (effect.bonusBaseOblivion !== undefined) parts.push(`base +${effect.bonusBaseOblivion}`);
      if (effect.cooldownDeltaCards !== undefined && effect.cooldownDeltaCards !== 0) parts.push(`cooldown ${effect.cooldownDeltaCards >= 0 ? '+' : ''}${effect.cooldownDeltaCards}`);
      if (effect.multiplier !== undefined && effect.multiplier !== 1) parts.push(`multiplier x${effect.multiplier.toFixed(2)}`);
      if (effect.condition) parts.push(`when ${formatCondition(effect.condition)}`);
      return `Buffs ${effect.targetUnitType === 'Any' ? 'Seraphim and Angel' : effect.targetUnitType} attacks: ${parts.join(', ') || 'none'}`;
    }
    default:
      return (effect as { type: string }).type;
  }
}

export function getCanonicalCardDescription(card: CardDefinition): string {



  if (card.type === 'Ophanim') {

    return formatEffectsInline(card.effects, card.definitionId);

  }



  if (card.type === 'Cherubim') {

    const cherubim = card as CherubimDefinition;

    const parts: string[] = [];

    if (cherubim.onPlayEffects.length > 0) {

      parts.push(`On play: ${formatEffectsInline(cherubim.onPlayEffects, card.definitionId)}`);

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

      parts.push(`On play: ${formatEffectsInline(seraphim.onPlayEffects, card.definitionId)}`);

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



  if (card.type === 'Angel') {

    const angel = card as AngelDefinition;

    const parts: string[] = [];

    if (angel.onSummonEffects.length > 0) {

      parts.push(`On summon: ${formatEffectsInline(angel.onSummonEffects, card.definitionId)}`);

    }

    parts.push(`After ${formatCount(angel.activatedAbility.cardsPlayedRequirement, 'card')} played: ${getCanonicalActivatedAbilityDescription(angel)}`);

    parts.push(`While on board: ${formatAngelBoardBonus(angel.baseStats)}`);

    parts.push('Patience: accumulates +1 stack per card played (boosted by Patient Light and adjacent Cherubim); on attack, each stack → +2% base Oblivion (stacks then reset)');

    return parts.join('. ');

  }



  return (card as unknown as { description?: string }).description ?? '';

}


export function getCanonicalActivatedAbilityDescription(card: AngelDefinition): string {
  return formatEffectsInline(card.activatedAbility.effects, card.definitionId);
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
    if (condition.type === 'equilibrium_sigils_gte') turnResources.add('Equilibrium Sigils');
  };

  for (const effect of allEffects) {
    if (effect.type === 'conditional') {
      registerCondition(effect.condition);
      continue;
    }

    if (effect.type === 'neutrality_equilibrium_sigil_gain' || effect.type === 'neutrality_equilibrium_starbound_cashout' || effect.type === 'neutrality_equilibrium_tactical_spend') {
      turnResources.add('Equilibrium Sigils');
    }
    if (effect.type === 'neutrality_patient_light_gain' || effect.type === 'neutrality_attack_preserve') {
      turnResources.add('Patient Light');
    }
  }

  if (card.type === 'Angel') {
    const angel = card as AngelDefinition;
    for (const condition of angel.extraSummonConditions ?? []) {
      registerCondition(condition as unknown as EffectCondition);
    }
  }

  if (card.type === 'Seraphim') {
    const seraphim = card as SeraphimDefinition;
    if (seraphim.patienceThreshold !== undefined) turnResources.add('Patience');
    for (const attack of seraphim.attacks ? [seraphim.attacks.unsynergized, seraphim.attacks.synergized] : []) {
      void attack;
    }
  }

  if (card.type === 'Angel') {
    const angel = card as AngelDefinition;
    for (const attack of angel.attacks ? [angel.attacks.primary, angel.attacks.exalted] : []) {
      void attack;
    }
  }

  for (const stack of stackKinds) {
    pushNote(`${eternalStackName(stack)}: primary stack resource used by this card's higher-rarity gain/spend/cashout loop.`);
  }

  for (const secondary of secondaryKinds) {
    pushNote(`${setSecondaryName(secondary)}: auxiliary set resource consumed by this card's bespoke payoff pattern.`);
  }

  if (turnResources.has('Equilibrium Sigils')) pushNote('Equilibrium Sigils: Neutrality setup currency for tactical spend or full cashout turns.');
  if (turnResources.has('Patient Light')) pushNote('Patient Light: Neutrality patience enhancer for attack conversion lines.');
  if (turnResources.has('Patience')) pushNote('Patience: Seraphim combat stacks gained per card play and converted on attack.');
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
  const lightText = (attack.tags ?? []).some(tag => tag.toLowerCase() === 'light')
    ? ' · +0.4% attack per Radiance (max +100% at 250 Radiance)'
    : '';
  return `${attack.baseOblivion} base Oblivion · ${formatCount(attack.cooldownCards, 'card')} cooldown${angelText}${costText}${furnaceText}${chromaText}${lightText}`;
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
        formatAttackSummary('Unsynergized', seraphim.attacks.unsynergized, { eternityChrono: false }),
        formatAttackSummary('Synergized', seraphim.attacks.synergized, { eternityChrono: false }),
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
    pushSummarySection(sections, 'Patience', [
      'Accumulates +1 Patience per card played (boosted by Patient Light stacks and adjacent Patience Cherubim)',
      'On attack: each Patience stack grants +2% base Oblivion (stacks then reset)',
    ]);
    if (angel.attacks) {
      pushSummarySection(sections, 'Attacks', [
        formatAttackSummary('Primary', angel.attacks.primary, { eternityChrono: false }),
        formatAttackSummary('Exalted', angel.attacks.exalted, { eternityChrono: false }),
      ]);
    }
  }

  if (hooks.length > 0) {
    sections.splice(1, 0, { title: 'Hooks', lines: hooks });
  }

  pushSummarySection(sections, 'Mechanics', collectMechanicNotes(card));

  return dedupeSections(sections);
}

export function getCardPreviewLines(card: CardDefinition, limit = 3): string[] {
  const preview: string[] = [];
  const seenFingerprints: string[] = [];

  const sections = [
    ...getCardSummarySections(card).filter(section => section.title === 'Ability'),
    ...getCardSummarySections(card).filter(section => section.title !== 'Ability' && section.title !== 'Rules'),
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
    `${card.type} | ${card.rarity}`,
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
    return lines;
  }

  return lines;
}

export function getCardFullStatText(card: CardDefinition): string {
  return getCardFullStatLines(card).join('\n');
}

