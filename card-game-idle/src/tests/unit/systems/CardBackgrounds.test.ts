import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { getCardBackgroundUrl } from '@/ui/cardBackgrounds';

describe('card background resolution', () => {
  it('routes Snowbound base cards to Snowbound Voltage assets by art key', () => {
    const frostcoil = CardRegistry.get('sv-ser-frostcoil');
    const aeldris = CardRegistry.get('sv-cher-aeldris');

    expect(frostcoil).toBeTruthy();
    expect(aeldris).toBeTruthy();
    expect(getCardBackgroundUrl(frostcoil!)).toBe('/assets/card-backgrounds/snowbound-voltage/sv_ser_frostcoil.png');
    expect(getCardBackgroundUrl(aeldris!)).toBe('/assets/card-backgrounds/snowbound-voltage/sv_cher_aeldris.png');
  });

  it('relinks assetless reworked cherubim to stable in-set fallback art', () => {
    const cases: Array<[string, string]> = [
      ['cherubim-thornbound-null-thorn', '/assets/card-backgrounds/thornbound-plains/Thornwake%20Ditch.png'],
      ['cherubim-mechanical-strain-ward', '/assets/card-backgrounds/mechanical-dreams/White%20Iron%20Chorus.png'],
      ['cherubim-prismatic-radiance-ward', '/assets/card-backgrounds/prismatic-accord/Buried%20Prism%20Cache.png'],
      ['cherubim-dark-abyss-throne', '/assets/card-backgrounds/black-glass-inferno/Vaelthorax%20Grieffire.png'],
    ];

    for (const [definitionId, expectedUrl] of cases) {
      const def = CardRegistry.get(definitionId);
      expect(def).toBeTruthy();
      expect(getCardBackgroundUrl(def!)).toBe(expectedUrl);
    }
  });

  it('maps Snowbound Infinite angels to existing exported filenames', () => {
    const cases: Array<[string, string]> = [
      ['sv-infinite-aurora-collapse', '/assets/card-backgrounds/infinite/Aurora%20Singularity.png'],
      ['sv-infinite-black-ice-throne', '/assets/card-backgrounds/infinite/Black%20Ice%20Dominion.png'],
      ['sv-infinite-crystal-storm', '/assets/card-backgrounds/infinite/Crystal%20Maelstrom.png'],
      ['sv-infinite-neon-snowfall', '/assets/card-backgrounds/infinite/Neon%20Deluge.png'],
    ];

    for (const [definitionId, expectedUrl] of cases) {
      const def = CardRegistry.get(definitionId);
      expect(def).toBeTruthy();
      expect(getCardBackgroundUrl(def!)).toBe(expectedUrl);
    }
  });

  it('maps Cinder Shroud to the exported Ember Shroud filename', () => {
    const cinderShroud = CardRegistry.get('cherubim-fire-ember-shroud');

    expect(cinderShroud).toBeTruthy();
    expect(getCardBackgroundUrl(cinderShroud!)).toBe('/assets/card-backgrounds/pyroabyss/Ember%20Shroud.png');
  });
});