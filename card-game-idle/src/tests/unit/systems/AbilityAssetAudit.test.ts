import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ABILITY_DEFINITIONS } from '@/data/abilities/abilityDefinitions';

describe('ability and Garden asset wiring', () => {
  it('provides an asset for every ability icon key', () => {
    const missing = ABILITY_DEFINITIONS
      .filter(ability => ability.iconAssetKey !== 'whiteout-domain')
      .filter(ability => !existsSync(join(process.cwd(), 'public/assets/ability-icons', `${ability.iconAssetKey}.png`)))
      .map(ability => ability.id);
    expect(missing).toEqual([]);
  });

  it('provides assets for all active buff icons and Valley of Null', () => {
    const paths = [
      'public/assets/buff-icons/divine-field.png',
      'public/assets/buff-icons/whiteout-domain.png',
      'public/assets/dungeons/valley-of-null.png',
    ];
    expect(paths.filter(path => !existsSync(join(process.cwd(), path)))).toEqual([]);
  });
});
