import type {
  CardDefinition,
  DarkCardDefinition,
  AinSophAurDefinition,
  LightCardDefinition,
} from '@/types/cards';
import type { CardEffect, CardSubtypeFilter, EffectCondition } from '@/types/effects';
import { CardRegistry } from '@/cards/CardRegistry';
import { formatDisplayCardText } from '@/ui/preferences';
import { formatSummonRequirement, getSummonRequirements } from '@/systems/cards/AinSophSummonRequirements';

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

function formatScaling(expression: LightCardDefinition['ainAttack']['scaling']): string {
  switch (expression.kind) {
    case 'constant': return `fixed ${formatExactValue(expression.value)}`;
    case 'linear': {
      const source = expression.reads === 'limitlessLightStacks'
        ? 'Limitless Light Stacks'
        : expression.reads === 'asaFrontCount' ? 'Ain Soph Aur count' : 'collection power';
      const sign = expression.multiplier >= 0 ? '+' : '';
      return `${sign}${formatExactValue(expression.multiplier)} per ${source}${expression.offset ? `, ${expression.offset >= 0 ? '+' : ''}${formatExactValue(expression.offset)} offset` : ''}`;
    }
    case 'stepped': {
      const source = expression.reads === 'limitlessLightStacks'
        ? 'Limitless Light Stacks'
        : expression.reads === 'asaFrontCount' ? 'Ain Soph Aur count' : 'collection power';
      return `+${formatExactValue(expression.amount)} per ${expression.step} ${source}`;
    }
    case 'triune': {
      const perShare = formatExactValue(expression.amount);
      return `scales with Collection Power; ${perShare} is the full-share reference value`;
    }
    case 'custom': return `bespoke scaling (${expression.fnId})`;
  }
}

function formatStackCost(cost: LightCardDefinition['sophAttack']['stackCost'] | DarkCardDefinition['activationCost']): string {
  if (!cost) return 'no stack cost';
  if (cost.kind === 'fixed' && (cost.value ?? 0) === 0) return 'no stack cost';
  if (cost.kind === 'fixed') return `${formatExactValue(cost.value ?? 0)} Limitless Light Stack${cost.value === 1 ? '' : 's'}`;
  if (cost.kind === 'percentage') return `${formatExactValue(cost.value ?? 0)}% of current Limitless Light Stacks`;
  return `${formatExactValue(cost.min ?? 0)}-${formatExactValue(cost.max ?? cost.min ?? 0)} Limitless Light Stacks`;
}

function formatSubtypeList(filters: ReadonlyArray<CardSubtypeFilter>): string {
  const names = filters.map(filter => filter === 'AinSophAur' ? 'Ain Soph Aur' : filter);
  if (names.length === 0) return 'card';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} or ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, or ${names[names.length - 1]}`;
}

export function formatEffectsInline(effects: CardEffect[], definitionId?: string): string {
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

function formatCondition(condition: EffectCondition): string {
  switch (condition.type) {
    case 'first_card_this_turn':
      return 'this is the first card you played this turn';
    case 'cards_played_gte':
      return `you have played ${condition.value}+ cards this turn`;
    default:
      return `${(condition as { type: string; value?: number }).type.replace(/_/g, ' ')} ${'value' in (condition as { value?: number }) ? (condition as { value?: number }).value ?? '' : ''}`.trim();
  }
}

function formatEffect(effect: CardEffect, definitionId?: string): string {
  if (!effect || typeof effect !== 'object' || !("type" in effect)) return 'Unknown effect';
  switch (effect.type) {
    case 'oblivion_flat': return `+${effect.value} Divine Light`;
    case 'score_flat': return `+${effect.value} Divine Light`;
    case 'draw': return `Draw ${formatCount(effect.value, 'card')}`;
    case 'discard_choice': return `Choose and discard ${formatCount(effect.value, 'card')}`;
    case 'discard_draw': return `Discard ${formatCount(effect.discard, 'card')}, then draw ${formatCount(effect.draw, 'card')}`;
    case 'shuffle_discard': return 'Shuffle discard into deck';
    case 'look_top_take': return `Look at the top ${formatCount(effect.look, 'card')}, take ${formatCount(effect.take, 'card')}, and put the rest on the bottom`;
    case 'look_top_take_drop': return `Look at the top ${formatCount(effect.look, 'card')}, take ${formatCount(effect.take, 'card')}, put ${formatCount(effect.drop, 'card')} on the bottom, and discard the rest`;
    case 'look_top_take_type': return `Look at the top ${formatCount(effect.look, 'card')} and take 1 matching ${formatSubtypeList(effect.filter)}`;
    case 'search_deck_by_type': return `Search your deck for 1 matching ${formatSubtypeList(effect.filter)}`;
    case 'search_deck_distinct_types': return `Search your deck for up to 1 each of ${formatSubtypeList(effect.filter)}`;
    case 'salvage_by_type': return `Salvage ${formatCount(effect.filter.length > 1 ? effect.filter.length : 1, 'card')} matching ${formatSubtypeList(effect.filter)}`;
    case 'salvage_by_type_count': return `Salvage ${formatCount(effect.count, 'card')} matching ${formatSubtypeList(effect.filter)}`;
    case 'salvage_any': return 'Salvage any 1 card';
    case 'salvage_by_id': return `Salvage ${effect.label ?? CardRegistry.get(effect.targetId)?.name ?? effect.targetId} from discard`;
    case 'score_multiplier': return `+${effect.value}% of this turn's Divine Light`;
    case 'conditional':
      return `If ${formatCondition(effect.condition)}, ${formatEffectsInline(effect.then.filter(Boolean), definitionId)}`;
    default:
      return (effect as { type: string }).type;
  }
}

export function getCanonicalCardDescription(card: CardDefinition): string {
  return card.description;
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

function dedupeSections(sections: CardSummarySection[]): CardSummarySection[] {
  const seenTitles = new Set<string>();
  const seenLines = new Set<string>();
  const result: CardSummarySection[] = [];

  for (const section of sections) {
    const dedupedLines = section.lines.filter((line) => {
      const key = normalizeSummaryLine(line);
      if (seenLines.has(key)) return false;
      seenLines.add(key);
      return true;
    });

    const titleKey = section.title.toLowerCase();
    if (dedupedLines.length > 0 && !seenTitles.has(titleKey)) {
      seenTitles.add(titleKey);
      result.push({ ...section, lines: dedupedLines });
    }
  }

  return result;
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
    .replace(/If this is the first card you played this turn,?/g, 'First card this turn:')
    .replace(/If you have played (\d+)\+ cards this turn/g, 'After $1+ cards:')
    .replace(/On board:/g, 'Board:')
    .replace(/While on board:/g, 'Board:')
    .replace(/;\s*;+/g, '; ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function shouldUseCanonicalAbility(card: CardDefinition): boolean {
  return card.rarity === 'Infinite' || card.rarity === 'Eternal' || card.rarity === 'Transcendent';
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
  const authoredDescription = resolveAbilityDescription(card, options);

  if (card.definitionId.startsWith('light-neutrality-')
    || card.definitionId.startsWith('dark-neutrality-')
    || card.definitionId.startsWith('ain-soph-aur-neutrality-')) {
    pushSummarySection(sections, 'Source', ['Neutrality Card Pack']);
  }

  pushSummarySection(sections, 'Effect', [authoredDescription]);

  if (card.type === 'Light') {
    const light = card as LightCardDefinition;
    pushSummarySection(sections, 'Identity', [
      'Light creature',
    ]);
    pushSummarySection(sections, 'Ain Attack', [
      `${light.ainAttack.baseOblivion} base Divine Light`,
      `${formatScaling(light.ainAttack.scaling)}; no stack cost`,
      `Cooldown: ${formatCount(light.ainAttack.cooldownCards, 'card played')}`,
    ]);
    pushSummarySection(sections, 'Soph Attack', [
      `${light.sophAttack.baseOblivion} base Divine Light`,
      `${formatScaling(light.sophAttack.scaling)}; costs ${formatStackCost(light.sophAttack.stackCost)}`,
      `Cooldown: ${formatCount(light.sophAttack.cooldownCards, 'card played')}`,
    ]);
    pushSummarySection(sections, 'Charge', [
      `Sacrifice: ${light.sacrificeStackRate}% of stored charge in Limitless Light Stacks (minimum 1)`,
      ...(light.onFlipEffects?.length ? [`On flip: ${formatEffectsInline(light.onFlipEffects, light.definitionId)}`] : []),
    ]);
    if (light.sophPlacementEffects?.length) {
      pushSummarySection(sections, 'Soph Placement', [
        formatEffectsInline(light.sophPlacementEffects, light.definitionId),
      ]);
    }
  }

  if (card.type === 'Dark') {
    const dark = card as DarkCardDefinition;
    pushSummarySection(sections, 'Identity', [
      'Dark utility card',
      'Place on Ain to activate; place on Soph to charge',
    ]);
    pushSummarySection(sections, 'Utility', [formatEffectsInline(dark.sophEffects, dark.definitionId)]);
    pushSummarySection(sections, 'Activation', [
      `Cost: ${formatStackCost(dark.activationCost)}`,
      ...(dark.persistent ? [`Cooldown: ${formatCount(dark.cooldownCardsPlayed ?? 1, 'card played')}`, 'Remains on board after activation'] : [`One-shot: returns to ${dark.postActivationFate} after activation`]),
    ]);
    pushSummarySection(sections, 'Charge', [
      `Sacrifice: ${dark.sacrificeStackRate}% of stored charge in Limitless Light Stacks (minimum 1)`,
    ]);
  }

  if (card.type === 'AinSophAur') {
    const asa = card as AinSophAurDefinition;
    const bridge = asa.bridgeAttack;
    pushSummarySection(sections, 'Identity', ['Ain Soph Aur Extra Deck card']);
    pushSummarySection(sections, 'Summon', [
      ...getSummonRequirements(asa.summonMaterials, asa.summonMaterialCount).map(requirement => `Requires: ${formatSummonRequirement(requirement)}`),
      ...(asa.onSummonEffects.length ? [`On summon: ${formatEffectsInline(asa.onSummonEffects, asa.definitionId)}`] : []),
    ]);
    if (bridge) {
      pushSummarySection(sections, 'Bridge the Light', [
        `${bridge.baseOblivion} base Divine Light`,
        `${formatScaling(bridge.scaling)}${bridge.consumesStacks ? `; costs ${formatStackCost(bridge.consumesStacks)}` : '; does not consume stacks'}`,
        `Cooldown: ${formatCount(bridge.cooldownCards, 'card played')}`,
      ]);
    }
  }

  return dedupeSections(sections);
}

export function getCardPreviewLines(card: CardDefinition, limit = 3): string[] {
  const preview: string[] = [];
  const seenFingerprints: string[] = [];

  const sections = getCardSummarySections(card).filter(section => section.title !== 'Source');

  for (const section of sections) {
    for (const line of section.lines) {
      const candidate = `${section.title}: ${line}`;
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

  return lines;
}

export function getCardFullStatText(card: CardDefinition): string {
  return getCardFullStatLines(card).join('\n');
}

