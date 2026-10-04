import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ABILITY_DEFINITIONS, ABILITY_ICON_FALLBACKS, PENDING_ABILITY_ART_KEYS } from '@/data/abilities/abilityDefinitions';

describe('ability and Garden asset wiring', () => {
  it('provides an asset for every supplied ability icon key', () => {
    const missing = ABILITY_DEFINITIONS
      .filter(ability => {
        if (PENDING_ABILITY_ART_KEYS.has(ability.iconAssetKey)) return false;
        const dedicated = join(process.cwd(), 'public/assets/ability-icons', `${ability.iconAssetKey}.png`);
        if (existsSync(dedicated)) return false;
        const fallback = ABILITY_ICON_FALLBACKS[ability.iconAssetKey];
        return !fallback || !existsSync(join(process.cwd(), 'public/assets', fallback.folder, fallback.file));
      })
      .map(ability => ability.id);
    expect(missing).toEqual([]);
  });

  it('installs all seven dedicated Intensity icons without unrelated art substitutions', () => {
    expect(PENDING_ABILITY_ART_KEYS.size).toBe(0);
    const intensity = ABILITY_DEFINITIONS.filter(ability => ability.setId === 'Intensity');
    expect(intensity).toHaveLength(7);
    for (const ability of intensity) {
      expect(ABILITY_ICON_FALLBACKS[ability.iconAssetKey]).toBeUndefined();
      expect(existsSync(join(process.cwd(), 'public', 'assets', 'ability-icons', `${ability.iconAssetKey}.png`))).toBe(true);
    }
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
