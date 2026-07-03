/**
 * DescriptionDriftAudit.test.ts
 *
 * Verifies that every card's hand-authored `description` and
 * `activatedAbility.description` fields match the output of
 * the canonical formatters in cardStatSummary.ts.
 *
 * If this test fails, run `npx tsx scripts/regen-canonical-descriptions.mts`
 * to auto-fix the drifted fields, then re-run.
 *
 * Cards with no canonical representation (e.g. cards whose formatter returns
 * null/empty, Seraphim attack descriptions which are sourced from MCB) are
 * intentionally skipped.
 */

import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import {
  getCanonicalCardDescription,
  getCanonicalActivatedAbilityDescription,
} from '@/ui/cardStatSummary';
import type { CardDefinition, AngelDefinition } from '@/types/cards';
import { NEUTRALITY_DOC_OVERRIDES } from '@/data/cards/neutralityDocOverrides';

/**
 * Mirrors the guard in regen-canonical-descriptions.mts — skip any canonical
 * text that contains internal token patterns or `undefined` (formatter bugs),
 * since those should be fixed in the formatter, not surfaced as drift.
 */
const internalTokenPattern = /\b[a-z]+_[a-z][a-z0-9_]+\b/;
function isCanonicalSafe(text: string): boolean {
  return !internalTokenPattern.test(text) && !text.includes('undefined');
}

/**
 * Cards with intentional doc-override descriptions are exempt from drift
 * checking — their descriptions are hand-authored and intentionally differ
 * from the canonical formatter output.
 */
const DOC_OVERRIDE_IDS = new Set(Object.keys(NEUTRALITY_DOC_OVERRIDES));

describe('description drift audit', () => {
  it('has no card whose description has drifted from canonical', () => {
    const all = CardRegistry.getAll();
    const drifted: string[] = [];

    for (const card of all) {
      if (DOC_OVERRIDE_IDS.has(card.definitionId)) continue;
      // Transcendent cards (tx-*) and WUAS Eternal (wuas-et-*) have intentional
      // hand-authored narrative descriptions that the canonical formatter doesn't
      // reproduce (formula shorthand, comma-and joins, prose style).
      if (card.definitionId.startsWith('tx-') || card.definitionId.startsWith('wuas-et-')) continue;
      let canon: string | null = null;
      try {
        canon = getCanonicalCardDescription(card as Parameters<typeof getCanonicalCardDescription>[0]);
      } catch {
        // skip — card not canonicalisable
        continue;
      }
      if (!canon) continue;
      if (!isCanonicalSafe(canon)) continue;
      // Skip cards whose runtime description gains an "On play:" prefix via
      // a post-export map (e.g. BGI withBlackFlameOphanim) that the canonical
      // formatter intentionally doesn't reproduce — regen cannot fix these.
      if ((card as CardDefinition).description?.startsWith('On play:') && !canon.startsWith('On play:')) continue;

      const authored = (card as CardDefinition).description;
      if (typeof authored === 'string' && canon !== authored) {
        drifted.push(
          `\n  ${card.definitionId}:\n    authored:  "${authored}"\n    canonical: "${canon}"`,
        );
      }

      if (card.type === 'Angel') {
        let aaCanon: string | null = null;
        try {
          aaCanon = getCanonicalActivatedAbilityDescription(card as Parameters<typeof getCanonicalActivatedAbilityDescription>[0]);
        } catch {
          continue;
        }
        if (!aaCanon) continue;
        if (!isCanonicalSafe(aaCanon)) continue;

        const angel = card as unknown as AngelDefinition;
        const aaAuthored = angel.activatedAbility?.description;
        if (typeof aaAuthored === 'string' && aaCanon !== aaAuthored) {
          drifted.push(
            `\n  ${card.definitionId} (activatedAbility):\n    authored:  "${aaAuthored}"\n    canonical: "${aaCanon}"`,
          );
        }
      }
    }

    expect(
      drifted,
      `Description drift found — run \`npx tsx scripts/regen-canonical-descriptions.mts\` to fix:${drifted.join('')}`,
    ).toHaveLength(0);
  });
});
