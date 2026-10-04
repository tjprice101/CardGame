import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const originalHashes = {
  'resource-icons/aberrated-shards.png': 'b1965dd597cabee42ad08627d2d29c48b2f2714abe51fe3ab1224ad09130c256',
  'resource-icons/card-light-shards.png': '946972e359d9fd4cd2156d7b67bbf5e4142eae41d71000096f63fab571477a2c',
  'resource-icons/divine-light.png': 'f45c47c294f150b0b7273877b4874be2808c86b67af98d5a1fcaafe6f145867f',
  'dungeons/items/abyssal-cinder.png': '9a3fae4c74eba0630283bf1e5a1554f45fde6e904766b835d4e5da5d216fa788',
  'dungeons/items/causal-bloom.png': '4cb1f99007bcb147f2cd1fa329a89b73e171af8454184f57d84842574ab2dedb',
  'dungeons/items/emberglass.png': '04b3363d5189833b9efdca01ef3f854697aab1fce2e100ca6df095ae8ed96e91',
  'dungeons/items/heart-of-causality.png': '7c60d57e0f5db2605853e70d051e51b9fc7c438500df77894ee185ca7b0006c8',
  'dungeons/items/heart-of-the-inferno.png': 'f0376ff88a526d7dbff2b3ca4e1a8d09812202d186058dcdef0347e4fa631a25',
  'dungeons/items/null-seared-light.png': 'd35e9d0c5ac7b6b16fa6b8d311bd84d5e518adf4254124f3e158c3c0254b84d0',
  'dungeons/items/nullified-lattice.png': '5eb1cdb07bd09c1b6d76c4f946e66993f03011276ce95f4601b90b8af684307b',
  'dungeons/items/nullified-oblivion-matter.png': '4b0a98ec052217b1a0a5f7e234a13571e2899db84510139c9799557f0b977cba',
  'dungeons/items/seed-of-causality.png': 'ea99640358fc951eb3ee12c5756797281646519c38c4e84c1004351c10413317',
  'dungeons/items/shattered-causal-transcript.png': '2765c34ba41be9f564ad0268dc8d93519fbc5f9b9cbd981014fcde28c96797e9',
  'dungeons/items/solar-slag.png': '15153a82f1a97279231d7280e9df3584ba71b929d8d1eaad28285d14b6a559ae',
  'forge/key-of-transcendence.png': 'c2f1b9decd824f51767eab6d394481c75867db78ebb5f918b0bf08247d99231c',
  'forge/shards-of-transcendence.png': '8ea605afdb31aa642e11e846e08baa01be943430a34ab00a83fc0cb0905f8864',
};

describe('untouched currency and material artwork', () => {
  it.each(Object.entries(originalHashes))('preserves the complete supplied pixels for %s', (file, hash) => {
    const bytes = readFileSync(join(process.cwd(), 'public', 'assets', file));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(hash);
    expect(bytes[25], 'Original RGB PNG must not contain a removed-background alpha channel').toBe(2);
  });

  it('protects every shared currency/material URL from crop, masking and blending', () => {
    const css = readFileSync(join(process.cwd(), 'src', 'styles', 'animations.css'), 'utf8');
    const block = css.slice(css.indexOf('img[src*="/assets/resource-icons/"]')).split('}')[0];
    for (const selector of ['resource-icons/', 'dungeons/items/', 'forge/key-of-transcendence.png', 'forge/shards-of-transcendence.png']) {
      expect(block).toContain(`/assets/${selector}`);
    }
    for (const rule of ['object-fit: contain', 'border-radius: 0', 'clip-path: none', 'mask-image: none', 'mix-blend-mode: normal', 'filter: none', 'opacity: 1']) {
      expect(block).toContain(`${rule} !important;`);
    }
  });
});
