/**
 * CardDescriptionAudit.test.ts
 *
 * The canonical-description formatter was retired when the card model collapsed
 * to Light / Dark / Ain Soph Aur — every card now carries an authored
 * `description`. Drift checking is therefore meaningless, so this audit instead
 * guards the properties that authored text actually needs to hold.
 */

import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { getCardSummarySections, getCardPreviewLines } from '@/ui/cardStatSummary';

/** Internal effect tokens (snake_case identifiers) must never reach players. */
const internalTokenPattern = /\b[a-z]+_[a-z][a-z0-9_]+\b/;

describe('card description audit', () => {
  it('every card has a non-empty authored description', () => {
    const missing = CardRegistry.getAll()
      .filter(card => !card.description || card.description.trim().length === 0)
      .map(card => card.definitionId);

    expect(missing, `Cards missing a description: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('no card description leaks internal effect tokens or "undefined"', () => {
    const leaking = CardRegistry.getAll()
      .filter(card =>
        internalTokenPattern.test(card.description) || card.description.includes('undefined'),
      )
      .map(card => `${card.definitionId}: "${card.description}"`);

    expect(leaking, `Descriptions leaking internals:\n  ${leaking.join('\n  ')}`).toHaveLength(0);
  });

  it('no summary section line leaks internal effect tokens or "undefined"', () => {
    const leaking: string[] = [];

    for (const card of CardRegistry.getAll()) {
      for (const section of getCardSummarySections(card)) {
        for (const line of section.lines) {
          if (internalTokenPattern.test(line) || line.includes('undefined')) {
            leaking.push(`${card.definitionId} [${section.title}]: "${line}"`);
          }
        }
      }
    }

    expect(leaking, `Summary lines leaking internals:\n  ${leaking.join('\n  ')}`).toHaveLength(0);
  });

  it('every card produces at least one preview line', () => {
    const empty = CardRegistry.getAll()
      .filter(card => getCardPreviewLines(card).length === 0)
      .map(card => card.definitionId);

    expect(empty, `Cards with no preview lines: ${empty.join(', ')}`).toHaveLength(0);
  });
});
