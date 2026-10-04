import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { INTENSITY_CARD_ART, INTENSITY_CARD_BACK_FILE, INTENSITY_PACK_BANNER_FILE, isIntensityCardId } from '@/data/cards/intensityArt';
import { getCardBackgroundUrl, getCardFaceBackgroundStyle, getLiveCardFaceBackgroundStyle } from '@/ui/cardBackgrounds';
import type { CardDefinition } from '@/types/cards';

const ORIGINAL_SHA256: Record<string, string> = {
  'intensity-l0-palevent-herald.png': 'e5bd7f1a5d30012a32a2ce607edb71acb8bc420435fd8439dc2ce757be942f58',
  'intensity-l0-nacreless-choir.png': '2a726da338b2e5331b82c0afc0db7802382e81d679882dc6446e66661e0d144d',
  'intensity-l0-handful-of-daybreak.png': '6b028923fd8bb8e99dd43b817cc7ae02014504645c5fbb0a3d2d8a66d5ac3c90',
  'intensity-l0-relics-beneath-the-burn.png': '164b82d7f597c81c239b3f05054cd02f7727736b1ab58b9d3f593b0e1be68631',
  'intensity-l1-calderas-first-breath.png': '01d4f77c81bcb93fc2f4f644e7f0ee1d0e0582e17afc0ab2f99f2ef3c92942a5',
  'intensity-l1-maw-beneath-morning.png': '12ae4af19aee521ef2881e1c85874c7be47d4aee2b64525163dc20c49f5fd6a4',
  'intensity-l1-the-unburning-boundary.png': '0979e90d046a609e7539364e201bb012e3f362850820e124b6d101fccdaa6ec8',
  'intensity-l1-vestment-of-the-buried-sun.png': 'db6f7cc22162db020e5a1f03a63193ff515197ef1bdae3328ac23f5d286d5879',
  'intensity-l2-throat-of-the-deep.png': '1d331246196167a5801bcb1b7e9401df48ca644f66bded457f3b57382887b252',
  'intensity-l2-a-horizon-set-alight.png': '1e4cedf9534f477382c3fbfc5d6241fcc5761eff769c118ffe25f1ea0a04671e',
  'intensity-l2-what-the-depths-remember.png': 'b1d796ba97b537e1d6e40fb1dfb7773810667ce5d4564c63d5404ee7e5049439',
  'intensity-l3-the-chosen-remnant.png': 'b66dfbcd97841be4ec1d1b0b6b7a4cd52a2b96ebd796db34b083f5f88e797143',
  'intensity-l3-the-earth-refuses-silence.png': '44201d3f73f26d79eb6971e7d206db9e226d109e0210342c6823913fc87d759e',
  'intensity-l3-the-unsevered-contradiction.png': '401871ce6012ee00b29a0c6649cf1a25a8bd68980b4e6806f5ac018e0a199f9c',
  'intensity-l4-fifth-pulse-open-heaven.png': 'dbe7804ec2ca7dd73caa147bf0d6b42fda62076af3cabfcd52c293e17610dc71',
  'intensity-l4-night-that-burns-forever.png': '6f00497499f93ded4eb9b0b0c386ec3c4dd1a204f521f296fa7b2a4c09dcad38',
  'intensity-l5-the-weight-of-all-horizons.png': '826d0441666280288a07213e8e8befabd3aab670558226bbd5afe6cb4dcd42b1',
  'intensity-l5-when-both-ends-meet.png': '61a74bf15496c944e201eaafc84bf8e37bf28ad0d4cbb490c001f741942bb10d',
  'intensity-l5-center-of-the-unmaking.png': 'c101320311b76afa116dcee0656ccc4d47529a85ae9d829a78b36ac98d89bdf3',
  'intensity-eternal-cathedral-below-all-seas.png': 'fa9ce5e7c02af735b3d429c7c5282351dae773293fbc3451f387f5877a7765f5',
  'intensity-eternal-the-crown-divided-against-itself.png': 'a01938104bf3fdc1b61e12f227f071d7c92843b5439f15d4be473a4baf663863',
  'intensity-eternal-sovereign-of-unbearable-noon.png': '9ed3619b98066841f8d77abcc91f427a828cd69ddbe8b0fc2fd783be01f8424f',
  'intensity-eternal-the-bell-that-buries-distance.png': 'e02035213803e4f5a007b75149d07ae0a5b60bbeac0e69e6771c5f4a8658ce0c',
  'intensity-eternal-verdict-after-the-last-dawn.png': '10b03a676df174fb4d1b3b8c6af7a3ce15e7aea7ef9ad7642c4324655f1c19ec',
  'intensity-infinity-the-unfathomed-return.png': 'a9f51783e6e38078931f3c343e0ffccd017dcb682ea848f32760b89275b9c73d',
  'intensity-infinity-crown-with-no-final-king.png': 'f03d8bf3cf42fc051648b348e36c5eaf277e648679805c9198d12c1b79424bf6',
  'intensity-infinity-daybreak-without-end.png': 'adecd6ab5d63338083f4b0084096759387dd63429370ae46c57ec08e6a2509d8',
  'intensity-infinity-a-furnace-outside-time.png': '49770ea0049131abcaa819950a55515a4a205daaa4c4a714d08bc284ab4aee16',
  'intensity-infinity-the-seam-that-holds-eternity.png': '1df1e4601c29c9439739bd8fbcef3be8ffdf5f8c5d3c70c9521d02169c9af406',
  'intensity-card-back.png': 'c37b2eb637ba39f5c68715fd51b60d9d9ab92f0b4dd48c0d18f930b7f839b3de',
  'intensity-set-banner.png': 'c830d1e8673170bd820db129a23229ada06ca1f75e6912035e1d5800947bde6d',
};

const publicRoot = path.resolve(process.cwd(), 'public');
const cardRoot = path.join(publicRoot, 'assets', 'card-backgrounds', 'intensity');

describe('Intensity installed asset integrity', () => {
  it('covers the implemented roster with one stable face mapping per registered Intensity card', () => {
    const registeredIds = CardRegistry.getAll().filter(card => isIntensityCardId(card.definitionId)).map(card => card.definitionId);
    expect(registeredIds.sort()).toEqual(Object.keys(INTENSITY_CARD_ART).sort());
  });

  it('installs exactly 29 unique mapped faces plus one shared back', () => {
    const files = Object.values(INTENSITY_CARD_ART);
    expect(files).toHaveLength(29);
    expect(new Set(files).size).toBe(29);
    expect(readdirSync(cardRoot).sort()).toEqual([...files, INTENSITY_CARD_BACK_FILE,
      'The Drowned Cathedral Boss Art.png', 'The Divided Crown Boss Art.png',
      'The Sovereign of Unbearable Noon Boss Art.png', 'The Bell That Buries Distance Boss Art.png',
      'The Arbiter After the Last Dawn Boss Art.png',
    ].sort());
    expect(files.every(file => !file.endsWith('.png.png'))).toBe(true);
  });

  it('preserves all 31 supplied PNG byte hashes and signatures', () => {
    expect(Object.keys(ORIGINAL_SHA256)).toHaveLength(31);
    for (const [file, hash] of Object.entries(ORIGINAL_SHA256)) {
      const location = file === INTENSITY_PACK_BANNER_FILE
        ? path.join(publicRoot, 'assets', 'pack-art', file)
        : path.join(cardRoot, file);
      const bytes = readFileSync(location);
      expect(bytes.subarray(0, 8).toString('hex'), file).toBe('89504e470d0a1a0a');
      expect(createHash('sha256').update(bytes).digest('hex'), file).toBe(hash);
    }
  });

  it('routes every persistent identity independent of card display name and rarity', () => {
    for (const [definitionId, file] of Object.entries(INTENSITY_CARD_ART)) {
      for (const rarity of ['Common', 'Eternal', 'Infinite', 'Transcendent'] as const) {
        const card = { definitionId, name: 'Renamed display label', rarity } as CardDefinition;
        expect(isIntensityCardId(definitionId)).toBe(true);
        expect(getCardBackgroundUrl(card)).toBe(`${import.meta.env.BASE_URL}assets/card-backgrounds/intensity/${file}`);
        const backing = rarity === 'Eternal' ? '/eternal/Eternal%20Cards%20Card%20Back.png'
          : rarity === 'Infinite' ? '/infinite/Infinity%20Cards%20Card%20Back.png'
            : rarity === 'Transcendent' ? '/infinite/Transcendant%20Card-backing.png'
              : `/intensity/${INTENSITY_CARD_BACK_FILE}`;
        for (const finish of ['normal', 'holo'] as const) {
          expect(getCardFaceBackgroundStyle(card, finish, 'back').backgroundImage).toContain(backing);
          expect(getLiveCardFaceBackgroundStyle(card, finish, 'back').backgroundImage).toContain(backing);
        }
      }
    }
    expect(isIntensityCardId('light-neutrality-palevent-herald')).toBe(false);
    expect(getCardBackgroundUrl({ definitionId: 'light-intensity-unmapped', rarity: 'Common' } as CardDefinition)).toBeNull();
  });

  it('uses the tier backing for every authored Intensity Eternal and Infinite without changing front art', () => {
    for (const card of CardRegistry.getAll().filter(card => isIntensityCardId(card.definitionId))) {
      const backing = card.rarity === 'Eternal' ? '/eternal/Eternal%20Cards%20Card%20Back.png'
        : card.rarity === 'Infinite' ? '/infinite/Infinity%20Cards%20Card%20Back.png'
          : `/intensity/${INTENSITY_CARD_BACK_FILE}`;
      expect(getCardFaceBackgroundStyle(card, 'normal', 'back').backgroundImage).toContain(backing);
      expect(getCardFaceBackgroundStyle(card, 'normal', 'front').backgroundImage).toContain(INTENSITY_CARD_ART[card.definitionId]);
      expect(existsSync(path.join(publicRoot, 'assets', 'card-backgrounds', decodeURI(backing).slice(1)))).toBe(true);
    }
  });

  it('binds only the Intensity pack to its supplied banner', () => {
    const source = readFileSync(path.resolve(process.cwd(), 'src', 'ui', 'store', 'CardPackStore.tsx'), 'utf8');
    expect(source).toContain("'pack-intensity': `${PACK_ART_BASE}/${INTENSITY_PACK_BANNER_FILE}`");
    expect(existsSync(path.join(publicRoot, 'assets', 'pack-art', INTENSITY_PACK_BANNER_FILE))).toBe(true);
  });

  it('installs all seventeen supplied world images and preserves opaque original materials', () => {
    const files = [
      ...['The Drowned Cathedral', 'The Divided Crown', 'The Sovereign of Unbearable Noon', 'The Bell That Buries Distance', 'The Arbiter After the Last Dawn']
        .map(name => path.join(cardRoot, `${name} Boss Art.png`)),
      path.join(publicRoot, 'assets', 'dungeons', 'crater-of-flames.png'),
      ...['emberglass', 'abyssal-cinder', 'solar-slag', 'heart-of-the-inferno']
        .map(name => path.join(publicRoot, 'assets', 'dungeons', 'items', `${name}.png`)),
      ...['kindle-the-depths', 'bank-the-flame', 'temper-the-hand', 'cinder-recall', 'white-hot-reprieve', 'unquenched-reserve', 'crucible-without-end']
        .map(name => path.join(publicRoot, 'assets', 'ability-icons', `intensity-${name}.png`)),
    ];
    expect(files).toHaveLength(17);
    for (const file of files) {
      const bytes = readFileSync(file);
      expect(bytes.subarray(0, 8).toString('hex'), file).toBe('89504e470d0a1a0a');
      expect(bytes.readUInt32BE(16), file).toBeGreaterThan(0);
      expect(bytes.readUInt32BE(20), file).toBeGreaterThan(0);
    }
    for (const name of ['emberglass', 'abyssal-cinder', 'heart-of-the-inferno', 'solar-slag']) {
      const bytes = readFileSync(path.join(publicRoot, 'assets', 'dungeons', 'items', `${name}.png`));
      expect(bytes[25], name).toBe(2);
    }
  });

  it('matches the supplied-art document outputs without including pending generation targets', () => {
    const document = readFileSync(path.resolve(process.cwd(), '..', 'Midjourney Art', 'Intensity Set Prompts.md'), 'utf8');
    const installedSection = document.split('## Expansion world artwork')[0];
    const outputs = [...installedSection.matchAll(/\*\*Output:\*\* `([^`]+)`/g)].map(match => match[1]);
    expect(outputs.sort()).toEqual([
      ...Object.values(INTENSITY_CARD_ART), INTENSITY_CARD_BACK_FILE, INTENSITY_PACK_BANNER_FILE,
    ].sort());
  });
});
