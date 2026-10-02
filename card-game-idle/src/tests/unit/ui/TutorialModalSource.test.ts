import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RESOURCE_INFO } from '@/data/resourceExplanations';
import { describe, expect, it } from 'vitest';

describe('How to Play tutorial copy', () => {
  const source = readFileSync(join(process.cwd(), 'src/ui/menus/TutorialModal.tsx'), 'utf8');

  it('describes current card types and progression instead of retired rules', () => {
    expect(source).not.toMatch(/\bSeraphim\b|\bCherubim\b|\bOphanim\b/);
    expect(source).toContain('The final encounter of any available Garden expedition');
    expect(source).toContain('directly grants 1 Shard on day 10 and 2 on day 25');
    expect(source).not.toContain('final encounter of the Rift of Causality');
    expect(source).not.toContain('Missed days remain queued');
    expect(source).toContain('raises your hand limit by 2 for 40 seconds, with a 2-minute cooldown');
    expect(source).toContain('At expiry, discard down to your normal 8-card limit');
  });

  it('documents the current shared and Causality resources', () => {
    expect(RESOURCE_INFO.map(resource => resource.key)).toEqual([
      'limitlessLightStacks',
      'limitlessCosmosStacks',
    ]);
    expect(RESOURCE_INFO.every(resource => !/patience/i.test(resource.longDesc))).toBe(true);
  });
});