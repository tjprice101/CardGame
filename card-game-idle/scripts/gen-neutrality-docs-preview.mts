/**
 * gen-neutrality-docs-preview.mts
 *
 * Generates a preview Card Effects markdown file for the Neutrality set only.
 * Run this, review the output format in Card Effects/Neutrality/Neutrality Card Effects.md,
 * then approve to roll out to all 15 sets via generate-card-effects-docs.mts.
 *
 * Usage:  npx tsx scripts/gen-neutrality-docs-preview.mts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import '../src/cards/RegistryBoot.ts';
import { CardRegistry } from '../src/cards/CardRegistry.ts';
import {
  getCanonicalCardDescription,
  getCanonicalAttackDescription,
  getCanonicalActivatedAbilityDescription,
} from '../src/ui/cardStatSummary.ts';
import type { CardDefinition, SeraphimDefinition, AngelDefinition } from '../src/types/cards.ts';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SET_ELEMENT = 'Neutrality';
const SET_NAME = 'Neutrality';
const OUTPUT_PATH = resolve('..', 'Card Effects', 'Neutrality', 'Neutrality Card Effects.md');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Tier = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Eternal' | 'Infinite';
const TIER_ORDER: Tier[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Eternal', 'Infinite'];

type CardGroup = { type: string; cards: CardDefinition[] };

function groupByTypeAndRarity(cards: CardDefinition[]): CardGroup[] {
  const TYPE_ORDER = ['Ophanim', 'Seraphim', 'Cherubim', 'Angel'];
  const byType = new Map<string, CardDefinition[]>();
  for (const card of cards) {
    const t = card.type;
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t)!.push(card);
  }
  // Sort within each type by rarity order then name
  for (const [, list] of byType) {
    list.sort((a, b) => {
      const ra = TIER_ORDER.indexOf(a.rarity as Tier);
      const rb = TIER_ORDER.indexOf(b.rarity as Tier);
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  }
  return TYPE_ORDER.filter(t => byType.has(t)).map(t => ({ type: t, cards: byType.get(t)! }));
}

function rarityGlyph(rarity: string): string {
  switch (rarity) {
    case 'Common': return '◈';
    case 'Rare': return '◆';
    case 'Epic': return '✦';
    case 'Legendary': return '★';
    case 'Eternal': return '♾';
    case 'Infinite': return '∞';
    default: return '·';
  }
}

function descriptionFor(card: CardDefinition): string {
  try {
    const canon = getCanonicalCardDescription(card as Parameters<typeof getCanonicalCardDescription>[0]);
    if (canon && !canon.includes('undefined')) return canon;
  } catch {
    // fall through to authored
  }
  return card.description ?? '(no description)';
}

function formatSeraphimAttacks(card: SeraphimDefinition): string {
  const attacks = card.attacks;
  if (!attacks) return '';
  const lines: string[] = [];
  const unsyn = getCanonicalAttackDescription(attacks.unsynergized);
  const syn = getCanonicalAttackDescription(attacks.synergized);
  lines.push(`  - **${attacks.unsynergized.name}** (Unsynergized): ${unsyn}`);
  lines.push(`  - **${attacks.synergized.name}** (Synergized): ${syn}`);
  return lines.join('\n');
}

function formatAngelAttacks(card: AngelDefinition): string {
  const attacks = card.attacks;
  if (!attacks) return '';
  const lines: string[] = [];
  const primary = getCanonicalAttackDescription(attacks.primary);
  const exalted = getCanonicalAttackDescription(attacks.exalted);
  lines.push(`  - **${attacks.primary.name}** (Primary): ${primary}`);
  lines.push(`  - **${attacks.exalted.name}** (Exalted): ${exalted}`);
  return lines.join('\n');
}

function formatAngelAbility(card: AngelDefinition): string {
  if (!card.activatedAbility) return '';
  try {
    const canon = getCanonicalActivatedAbilityDescription(card as Parameters<typeof getCanonicalActivatedAbilityDescription>[0]);
    const abilityText = (canon && !canon.includes('undefined')) ? canon : card.activatedAbility.description;
    return `  - **Ability (${card.activatedAbility.name})**: After ${card.activatedAbility.cardsPlayedRequirement} cards played: ${abilityText}`;
  } catch {
    return `  - **Ability (${card.activatedAbility.name})**: ${card.activatedAbility.description}`;
  }
}

function formatSummonCost(card: AngelDefinition): string {
  const names = card.summonCost.map(id => CardRegistry.get(id)?.name ?? id);
  return `  - **Summon**: ${names.join(' + ')}`;
}

function renderCard(card: CardDefinition): string {
  const glyph = rarityGlyph(card.rarity);
  const lines: string[] = [
    `### ${glyph} ${card.name} \`${card.definitionId}\``,
    `**Rarity**: ${card.rarity} · **Type**: ${card.type}`,
    '',
    descriptionFor(card),
  ];

  if (card.type === 'Seraphim' && (card as SeraphimDefinition).attacks) {
    const attackLines = formatSeraphimAttacks(card as SeraphimDefinition);
    if (attackLines) {
      lines.push('');
      lines.push('**Attacks**:');
      lines.push(attackLines);
    }
  }

  if (card.type === 'Angel') {
    const angel = card as AngelDefinition;
    lines.push('');
    lines.push('**Summon**:');
    lines.push(formatSummonCost(angel));
    if (angel.activatedAbility) {
      lines.push('');
      lines.push('**Activated Ability**:');
      lines.push(formatAngelAbility(angel));
    }
    const attackLines = formatAngelAttacks(angel);
    if (attackLines) {
      lines.push('');
      lines.push('**Attacks**:');
      lines.push(attackLines);
    }
  }

  return lines.join('\n');
}

function renderGroup(group: CardGroup): string {
  const sections: string[] = [
    `## ${group.type}s`,
    '',
  ];
  for (const card of group.cards) {
    sections.push(renderCard(card));
    sections.push('');
    sections.push('---');
    sections.push('');
  }
  return sections.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const allCards = CardRegistry.getAll();
const setCards = allCards.filter(c => c.element === SET_ELEMENT);

// Separate Eternal and Infinite from base tiers
const baseCards = setCards.filter(c => c.rarity !== 'Eternal' && c.rarity !== 'Infinite');
const eternalCards = setCards.filter(c => c.rarity === 'Eternal');
const infiniteCards = setCards.filter(c => c.rarity === 'Infinite');

const groups = groupByTypeAndRarity(baseCards);

const eternalGroupMap = groupByTypeAndRarity(eternalCards);
const infiniteGroupMap = groupByTypeAndRarity(infiniteCards);

const header = [
  `# ${SET_NAME} — Card Effects`,
  '',
  `> **Set**: ${SET_NAME} · **Element**: ${SET_ELEMENT}`,
  `>`,
  `> **Core resource**: Patience — accumulated per card played while Seraphim or Angels are on board;`,
  `> cashed out on attack for +15 Oblivion per stack. Reaching the \`patienceThreshold\` also draws bonus cards.`,
  `>`,
  `> **Secondary systems**: Equilibrium Sigils (conditional Patience amplification) · Patient Light`,
  `> (diminishing-returns Patience-per-card bonus) · Vessel designation (highest-Patience Seraphim).`,
  '',
  `> **Auto-generated** from \`CardRegistry\`. Run \`npx tsx scripts/generate-card-effects-docs.mts\` to refresh.`,
  '',
].join('\n');

const body: string[] = [];

for (const group of groups) {
  body.push(renderGroup(group));
}

if (eternalCards.length > 0) {
  body.push('# Eternal Tier\n');
  for (const group of eternalGroupMap) {
    body.push(renderGroup(group));
  }
}

if (infiniteCards.length > 0) {
  body.push('# Infinite Tier\n');
  for (const group of infiniteGroupMap) {
    body.push(renderGroup(group));
  }
}

const output = header + '\n' + body.join('\n');

const outputDir = resolve('..', 'Card Effects', 'Neutrality');
mkdirSync(outputDir, { recursive: true });
writeFileSync(OUTPUT_PATH, output, { encoding: 'utf8' });

console.log(`Generated: ${OUTPUT_PATH}`);
console.log(`Cards: ${setCards.length} total (${baseCards.length} base, ${eternalCards.length} eternal, ${infiniteCards.length} infinite)`);
