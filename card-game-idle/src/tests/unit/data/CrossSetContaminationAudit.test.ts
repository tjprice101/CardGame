/**
 * CrossSetContaminationAudit.test.ts
 *
 * Walks every card in CardRegistry and verifies that no card uses an effect,
 * condition, or resource type that belongs to a different set.
 *
 * Rules:
 *  - A card's set is determined by its `element` field.
 *  - Universal primitives (draw, oblivion_flat, salvage_*, etc.) are allowed
 *    everywhere — see UNIVERSAL_EFFECT_PREFIXES and UNIVERSAL_CHERUBIM_PASSIVE_TYPES
 *    in setResourceRegistry.ts.
 *  - eternal_stack_gain/spend and set_secondary_gain/spend are scoped per
 *    stack/kind value — a card may only use its own set's stack/kind.
 *  - Cards whose definitionId starts with a CROSS_SET_EXEMPT_ID_PREFIX are
 *    whitelisted (Neutrality Infinite, btei-*, sv-eternal-*, sv-infinite-*).
 */

import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  SET_PROFILE_BY_ELEMENT,
  UNIVERSAL_EFFECT_PREFIXES,
  UNIVERSAL_CHERUBIM_PASSIVE_TYPES,
  CROSS_SET_EXEMPT_ID_PREFIXES,
} from '@/data/setResourceRegistry';
import type { SetId } from '@/data/setResourceRegistry';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isUniversalEffectType(type: string): boolean {
  return UNIVERSAL_EFFECT_PREFIXES.some(prefix => type === prefix || type.startsWith(prefix));
}

function isUniversalCherubimPassive(type: string): boolean {
  return UNIVERSAL_CHERUBIM_PASSIVE_TYPES.includes(type);
}

function isExemptCard(definitionId: string): boolean {
  return CROSS_SET_EXEMPT_ID_PREFIXES.some(prefix => definitionId.startsWith(prefix));
}

/**
 * Returns a violation string if `effectType` (an ImmediateEffect or
 * BlazingGardenEffect type) doesn't belong to `cardElement`.
 * Returns null if clean.
 */
function checkEffectType(effectType: string, cardElement: string): string | null {
  if (isUniversalEffectType(effectType)) return null;

  const ownerProfile = SET_PROFILE_BY_ELEMENT.get(cardElement as SetId);

  // Check if this type belongs to the card's own set
  if (ownerProfile) {
    if (ownerProfile.effectTypePrefixes.some(prefix => effectType.startsWith(prefix))) return null;
    if (ownerProfile.effectTypeExact.includes(effectType)) return null;
  }

  // Check if it belongs to any OTHER set
  for (const [element, profile] of SET_PROFILE_BY_ELEMENT.entries()) {
    if (element === cardElement) continue;
    if (profile.effectTypePrefixes.some(prefix => effectType.startsWith(prefix))) {
      return `uses effect '${effectType}' owned by ${profile.displayName}`;
    }
    if (profile.effectTypeExact.includes(effectType)) {
      return `uses effect '${effectType}' owned by ${profile.displayName}`;
    }
  }

  // Not listed anywhere — treat as universal/unknown, no violation
  return null;
}

function checkConditionType(conditionType: string, cardElement: string): string | null {
  const ownerProfile = SET_PROFILE_BY_ELEMENT.get(cardElement as SetId);
  if (ownerProfile?.conditionTypes.includes(conditionType)) return null;

  for (const [element, profile] of SET_PROFILE_BY_ELEMENT.entries()) {
    if (element === cardElement) continue;
    if (profile.conditionTypes.includes(conditionType)) {
      return `uses condition '${conditionType}' owned by ${profile.displayName}`;
    }
  }
  return null;
}

function checkEternalStack(stack: string, cardElement: string): string | null {
  const ownerProfile = SET_PROFILE_BY_ELEMENT.get(cardElement as SetId);
  if (ownerProfile?.eternalStackKinds.includes(stack)) return null;

  for (const [element, profile] of SET_PROFILE_BY_ELEMENT.entries()) {
    if (element === cardElement) continue;
    if (profile.eternalStackKinds.includes(stack)) {
      return `uses eternal stack '${stack}' owned by ${profile.displayName}`;
    }
  }
  return null; // Unknown stack — no violation
}

function checkSetSecondaryKind(kind: string, cardElement: string): string | null {
  const ownerProfile = SET_PROFILE_BY_ELEMENT.get(cardElement as SetId);
  if (ownerProfile?.setSecondaryKinds.includes(kind)) return null;

  for (const [element, profile] of SET_PROFILE_BY_ELEMENT.entries()) {
    if (element === cardElement) continue;
    if (profile.setSecondaryKinds.includes(kind)) {
      return `uses set_secondary kind '${kind}' owned by ${profile.displayName}`;
    }
  }
  return null;
}

function checkCherubimResourceKey(resource: string, cardElement: string): string | null {
  const ownerProfile = SET_PROFILE_BY_ELEMENT.get(cardElement as SetId);
  if (ownerProfile?.cherubimResourceKeys.includes(resource)) return null;

  for (const [element, profile] of SET_PROFILE_BY_ELEMENT.entries()) {
    if (element === cardElement) continue;
    if (profile.cherubimResourceKeys.includes(resource)) {
      return `uses cherubim resource '${resource}' owned by ${profile.displayName}`;
    }
  }
  return null;
}

function checkCherubimPassiveType(type: string, cardElement: string): string | null {
  if (isUniversalCherubimPassive(type)) return null;

  const ownerProfile = SET_PROFILE_BY_ELEMENT.get(cardElement as SetId);
  if (ownerProfile?.cherubimPassiveTypes.includes(type)) return null;

  for (const [element, profile] of SET_PROFILE_BY_ELEMENT.entries()) {
    if (element === cardElement) continue;
    if (profile.cherubimPassiveTypes.includes(type)) {
      return `uses cherubim passive '${type}' owned by ${profile.displayName}`;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Recursive effect walker
// ---------------------------------------------------------------------------

type AnyEffect = Record<string, unknown>;

function collectViolations(effects: AnyEffect[], cardElement: string): string[] {
  const violations: string[] = [];

  function visit(effect: AnyEffect): void {
    const type = effect.type as string | undefined;
    if (!type) return;

    // Check plain effect type
    if (type !== 'conditional') {
      const v = checkEffectType(type, cardElement);
      if (v) violations.push(v);
    }

    // eternal_stack_* — check stack kind
    if (
      (type === 'eternal_stack_gain' || type === 'eternal_stack_spend' || type === 'eternal_stack_cashout') &&
      typeof effect.stack === 'string'
    ) {
      const v = checkEternalStack(effect.stack, cardElement);
      if (v) violations.push(v);
    }

    // set_secondary_* — check kind
    if (
      (type === 'set_secondary_gain' || type === 'set_secondary_spend') &&
      typeof effect.kind === 'string'
    ) {
      const v = checkSetSecondaryKind(effect.kind, cardElement);
      if (v) violations.push(v);
    }

    // cherubim_resource_per_card — check resource key
    if (type === 'cherubim_resource_per_card' && typeof effect.resource === 'string') {
      const v = checkCherubimResourceKey(effect.resource, cardElement);
      if (v) violations.push(v);
    }

    // Conditional — recurse into then/else
    if (type === 'conditional') {
      const condition = effect.condition as AnyEffect | undefined;
      if (condition && typeof condition.type === 'string') {
        const v = checkConditionType(condition.type, cardElement);
        if (v) violations.push(v);
      }
      if (Array.isArray(effect.then)) {
        collectViolations(effect.then as AnyEffect[], cardElement).forEach(v => violations.push(v));
      }
    }
  }

  for (const effect of effects) visit(effect);
  return violations;
}

function collectCherubimViolations(effects: AnyEffect[], cardElement: string): string[] {
  const violations: string[] = [];
  for (const effect of effects) {
    const type = effect.type as string | undefined;
    if (!type) continue;
    const v = checkCherubimPassiveType(type, cardElement);
    if (v) violations.push(v);
    if (type === 'cherubim_resource_per_card' && typeof effect.resource === 'string') {
      const rv = checkCherubimResourceKey(effect.resource, cardElement);
      if (rv) violations.push(rv);
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe('cross-set contamination audit', () => {
  it('has no card using another set\'s resource, effect, or condition type', () => {
    const allCards = CardRegistry.getAll();
    const offenders: string[] = [];

    for (const card of allCards) {
      if (isExemptCard(card.definitionId)) continue;

      const element = card.element as string;
      // Only check cards from the 15 playable sets
      if (!SET_PROFILE_BY_ELEMENT.has(element as SetId)) continue;

      const violations: string[] = [];

      // onPlayEffects (Seraphim, Ophanim)
      if (Array.isArray((card as unknown as Record<string, unknown>).onPlayEffects)) {
        collectViolations(
          (card as unknown as Record<string, unknown>).onPlayEffects as AnyEffect[],
          element,
        ).forEach(v => violations.push(v));
      }

      // effects (Ophanim, Cherubim passives)
      if (Array.isArray((card as unknown as Record<string, unknown>).effects)) {
        const effects = (card as unknown as Record<string, unknown>).effects as AnyEffect[];
        if (card.type === 'Cherubim') {
          collectCherubimViolations(effects, element).forEach(v => violations.push(v));
        } else {
          collectViolations(effects, element).forEach(v => violations.push(v));
        }
      }

      // onSummonEffects + activatedAbility.effects (Angels)
      if (card.type === 'Angel') {
        const angel = card as unknown as {
          onSummonEffects?: AnyEffect[];
          activatedAbility?: { effects?: AnyEffect[] };
        };
        if (angel.onSummonEffects) {
          collectViolations(angel.onSummonEffects, element).forEach(v => violations.push(v));
        }
        if (angel.activatedAbility?.effects) {
          collectViolations(angel.activatedAbility.effects, element).forEach(v => violations.push(v));
        }
      }

      if (violations.length > 0) {
        offenders.push(`\n  ${card.definitionId} (${element}):\n${violations.map(v => `    - ${v}`).join('\n')}`);
      }
    }

    expect(offenders, `Cross-set contamination found:${offenders.join('')}`).toHaveLength(0);
  });
});
