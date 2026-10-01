import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ABILITY_DEFINITIONS, ABILITY_ICON_FALLBACKS } from '@/data/abilities/abilityDefinitions';

describe('ability and Garden asset wiring', () => {
  it('provides an asset for every ability icon key', () => {
    const missing = ABILITY_DEFINITIONS
      .filter(ability => {
        const dedicated = join(process.cwd(), 'public/assets/ability-icons', `${ability.iconAssetKey}.png`);
        if (existsSync(dedicated)) return false;
        const fallback = ABILITY_ICON_FALLBACKS[ability.iconAssetKey];
        return !fallback || !existsSync(join(process.cwd(), 'public/assets', fallback.folder, fallback.file));
      })
      .map(ability => ability.id);
    expect(missing).toEqual([]);
  });

  it('provides assets for active buff icons matching ability icons, plus Valley of Null', () => {
    const buffIconPaths = ABILITY_DEFINITIONS
      .map(ability => ability.buff?.iconAssetKey)
      .filter((key): key is string => Boolean(key))
      .map(key => `public/assets/ability-icons/${key}.png`);
    const paths = [
      ...buffIconPaths,
      'public/assets/dungeons/valley-of-null.png',
      'public/assets/dungeons/garden-archive.png',
      'public/assets/dungeons/items/nullified-lattice.png',
      'public/assets/dungeons/items/null-seared-light.png',
      'public/assets/dungeons/items/nullified-oblivion-matter.png',
    ];
    expect(paths.filter(path => !existsSync(join(process.cwd(), path)))).toEqual([]);
  });
});
