import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Garden of Cards selectors', () => {
  it('renders and navigates the same category-filtered dungeon list', () => {
    const source = readFileSync(join(process.cwd(), 'src/ui/garden/GardenOfCards.tsx'), 'utf8');
    expect(source).toContain('const visibleDungeons = GARDEN_DUNGEONS');
    expect(source).toContain('.filter(dungeon => dungeon.category === category)');
    expect(source).toContain("Number(left.id === 'garden-archive') - Number(right.id === 'garden-archive')");
    expect(source).toContain('visibleDungeons.map((dungeon, idx)');
    expect(source).not.toContain('GARDEN_DUNGEONS.map((dungeon, idx)');
    expect(source).toContain('disabled={visibleDungeons.length <= 1}');
  });
});