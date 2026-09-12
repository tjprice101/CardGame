import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const inspectorPath = join(process.cwd(), 'src/ui/hud/CardInspectorPanel.tsx');

describe('CardInspectorPanel Light-card parity', () => {
  it('keeps Soph placement text and non-refunded Soph projections in the in-turn inspector', () => {
    const source = readFileSync(inspectorPath, 'utf8');

    expect(source).toContain("section.title === 'Soph Placement'");
    expect(source).toContain('sophPlacementEffects');
    expect(source).not.toContain('+ cost,');
  });
});
