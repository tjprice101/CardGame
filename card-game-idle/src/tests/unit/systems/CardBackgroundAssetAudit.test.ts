import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { getCardBackgroundUrl } from '@/ui/cardBackgrounds';

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '');
}

function getSuggestedMatch(dirPath: string, fileName: string): string | null {
  if (!existsSync(dirPath)) return null;
  const target = normalizeName(fileName);
  const files = readdirSync(dirPath);
  const exact = files.find(entry => normalizeName(entry) === target);
  if (exact) return exact;
  const loose = files.find(entry => normalizeName(entry).includes(target) || target.includes(normalizeName(entry)));
  return loose ?? null;
}

describe('card background asset audit', () => {
  it('resolves every registered card to an existing background file', () => {
    const root = path.resolve(process.cwd(), 'public');
    const missing: string[] = [];

    for (const card of CardRegistry.getAll()) {
      const url = getCardBackgroundUrl(card);
      if (!url) {
        missing.push(`${card.definitionId}: no background URL`);
        continue;
      }

      const relPath = decodeURI(url.replace(/^\/?/, ''));
      const absPath = path.resolve(root, relPath.replace(/^assets[\\/]/, 'assets/'));
      if (existsSync(absPath)) continue;

      const dirPath = path.dirname(absPath);
      const fileName = path.basename(absPath);
      const suggestion = getSuggestedMatch(dirPath, fileName);
      missing.push(
        suggestion
          ? `${card.definitionId}: missing ${fileName} (suggested: ${suggestion})`
          : `${card.definitionId}: missing ${fileName}`,
      );
    }

    expect(missing).toEqual([]);
  });
});
