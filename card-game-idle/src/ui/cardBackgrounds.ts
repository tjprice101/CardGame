import type { CSSProperties } from 'react';
import type { CardDefinition } from '@/types/cards';
import type { CardFinish } from '@/types/cards';
import { warmTheme } from '@/ui/theme';
import { getCardThemePackStyle, getFontScale } from '@/ui/preferences';

const CARD_BACKGROUND_ROOT = '/assets/card-backgrounds';
const CARD_BACKGROUND_FOLDERS: Partial<Record<string, string>> = {
  Fire: 'pyroabyss',
  Mechanical: 'mechanical-dreams',
  Light: 'heavenly-light',
  Neutrality: 'neutrality',
  Thornbound: 'thornbound-plains',
  Prismatic: 'prismatic-accord',
  GlassAbsolute: 'glass-absolute',
  BlazingGarden: 'blazing-garden',
  Butterfly: 'age-of-the-butterfly',
  EternalSeas: 'eternal-seas',
  Dark: 'black-glass-inferno',
};

export type CardFaceVariant = 'hand' | 'pack' | 'grid' | 'compact' | 'board' | 'boardMini';

export const cardFacePalette = {
  text: 'var(--card-face-text, #0f0906)',
  textSoft: 'var(--card-face-text-soft, rgba(15, 9, 6, 0.96))',
  textMuted: 'var(--card-face-text-muted, rgba(15, 9, 6, 0.84))',
  ribbon: 'var(--card-face-ribbon, rgba(242, 231, 216, 0.97))',
  panel: 'var(--card-face-panel, rgba(236, 222, 203, 0.96))',
  border: 'var(--card-face-border, rgba(52, 35, 21, 0.24))',
  shadow: 'var(--card-face-shadow, 0 10px 24px rgba(68, 49, 32, 0.12))',
};

const CONSISTENT_CARD_TEXT = '#130d08';
const CONSISTENT_CARD_TEXT_SOFT = 'rgba(19, 13, 8, 0.94)';
const CONSISTENT_CARD_TEXT_MUTED = 'rgba(19, 13, 8, 0.78)';

const CARD_FACE_METRICS_BASE: Record<CardFaceVariant, {
  ribbonPadding: string;
  panelPadding: string;
  typeSize: number;
  nameSize: number;
  descSize: number;
  descLineHeight: number;
  descLines: number;
}> = {
  hand: {
    ribbonPadding: '5px 9px 4px',
    panelPadding: '5px 9px 6px',
    typeSize: 9,
    nameSize: 13,
    descSize: 10,
    descLineHeight: 1.3,
    descLines: 2,
  },
  pack: {
    ribbonPadding: '6px 10px 5px',
    panelPadding: '6px 10px 7px',
    typeSize: 8,
    nameSize: 11,
    descSize: 9,
    descLineHeight: 1.3,
    descLines: 3,
  },
  grid: {
    ribbonPadding: '5px 8px 4px',
    panelPadding: '5px 8px 6px',
    typeSize: 7,
    nameSize: 9,
    descSize: 8,
    descLineHeight: 1.35,
    descLines: 3,
  },
  compact: {
    ribbonPadding: '6px 7px 5px',
    panelPadding: '6px 7px 7px',
    typeSize: 6,
    nameSize: 8,
    descSize: 7,
    descLineHeight: 1.3,
    descLines: 3,
  },
  board: {
    ribbonPadding: '7px 8px 6px',
    panelPadding: '7px 8px 8px',
    typeSize: 7,
    nameSize: 9,
    descSize: 7,
    descLineHeight: 1.3,
    descLines: 3,
  },
  boardMini: {
    ribbonPadding: '6px 7px 5px',
    panelPadding: '6px 7px 7px',
    typeSize: 6,
    nameSize: 7,
    descSize: 6,
    descLineHeight: 1.25,
    descLines: 2,
  },
};

interface CardFaceMetrics {
  ribbonPadding: string;
  panelPadding: string;
  typeSize: number;
  nameSize: number;
  descSize: number;
  descLineHeight: number;
  descLines: number;
}

const CARD_BACKGROUND_FILE_OVERRIDES: Record<string, string> = {
  'ophanim-neutral-cherubim-recall': 'Chaos Recall.png',
  'ser-fire-voidflame': 'Void-flame Seraphim.png',
  'bgi-ophanim-whiteblack-supernova': 'White-black Supernova.png',
  'bgi-ophanim-sorveths-eleventh-second': 'Shadows of the Inferno.png',
  'bgi-cherubim-sorveths-ring': 'Veth Serath Midplace.png',
  'bgi-cherubim-morvakaels-answer': "Morvakael's Answer.png",
  'btei-bgi-velplane-ossuary': 'Veilplane Fissure.png',
  'btei-bgi-elegy-of-veth-serath': 'Elegy of Veth Sarath.png',
  'inf-bgi-sorveths-final-breath': "Sorveth's Final Breath.png",
  'inf-bgi-chromatic-ruin-deluge': 'Chromatic Ruin Deluge.png',
  'inf-bgi-obsidian-covenant-colossus': 'Obsidian Covenant Colossus.png',
  'inf-bgi-glassrose-leviathan': 'Glassrose Leviathan.png',
  'inf-bgi-inferno-of-two-truths': 'Inferno of Two Truths.png',
  'inf-bgi-ashen-cinder-cathedral': 'Ashen Cinder Cathedral.png',
  'inf-bgi-vaelmor-umbra-sovereign': 'Vaelmor Umbra Sovereign.png',
  'inf-bgi-midplace-apocalypse': 'Midplace Apocalypse.png',
  'btei-voids-reaping': 'Hollow Queen.png',
  'btei-eternal-vigil': 'Immortal Warden.png',
  'btei-sovereign-domain': 'Cherubim Sovereign.png',
  'btei-convergence-of-eternity': 'Eternal Seraph.png',
  'btei-temporal-ruin': 'The Time Eater.png',
  'btei-architects-manifold': 'The Void Architect.png',
  'btei-null-edict': 'Null Sovereign.png',
  'btei-omniscient-fracture': 'Shattered Oracle.png',
  'btei-colossus-advent': 'Abyssal Colossus.png',
  'btei-axiom-of-oblivion': 'Eternal Null.png',
  'btei-prismatic-blindwars-reliquary': 'Reliquary of Blind Wars.png',
  'inf-ash-kings-apocalypse': 'Ash Kings Apocalypse.png',
  'tbp-ser-scar-mantle-reclaimer': 'Scar-mantle Reclaimer.png',
  'tbp-angel-velmora-harrowed-crown': 'Velmora Crown of Harrowed Plains.png',
  // Snowbound Voltage Eternal Angels
  'sv-eternal-frost-charge': 'Frostborn Surge.png',
  'sv-eternal-aurora-battery': 'Aurora Nexus.png',
  'sv-eternal-glacier-signal': 'Glacier Beacon.png',
  'sv-eternal-white-static': 'White Requiem.png',
  'sv-eternal-sleet-choir': 'Blizzard Requiem.png',
  // Reworked cherubim without dedicated exported PNGs yet: keep them on set-matched art.
  'cherubim-thornbound-null-thorn': 'Thornwake Ditch.png',
  'cherubim-thornbound-path-keeper': 'Spitebloom Sink.png',
  'cherubim-thornbound-vine-mantle': 'Thornwake Ditch.png',
  'cherubim-thornbound-trail-accelerator': 'Gallows Bramble.png',
  'cherubim-thornbound-growth-shell': 'Pale Vine Reliquary.png',
  'cherubim-thornbound-bramble-arbor': 'Funeral Hedgerow.png',
  'cherubim-thornbound-wildroot-ascension': 'Funeral Hedgerow.png',
  'cherubim-thornbound-eternal-roots': 'Cathedral of Splinters.png',
  'cherubim-mechanical-null-coil': 'Dreambreak Turbine.png',
  'cherubim-mechanical-strain-ward': 'White Iron Chorus.png',
  'cherubim-mechanical-gearbound-mantle': 'Dreambreak Turbine.png',
  'cherubim-mechanical-overclock-amplifier': 'Rust Halo Chamber.png',
  'cherubim-mechanical-dynamo-shell': 'Monolith Relay.png',
  'cherubim-mechanical-pulse-matrix': 'Cinder Protocol Engine.png',
  'cherubim-mechanical-infinite-rhythm': 'Cinder Protocol Engine.png',
  'cherubim-mechanical-core-ascension': 'Blackglass Reactor Crown.png',
  'cherubim-prismatic-null-prism': 'Mirrorfield Locus.png',
  'cherubim-prismatic-light-echo': 'Mirrorfield Locus.png',
  'cherubim-prismatic-spectrum-veil': 'Fracture Veil.png',
  'cherubim-prismatic-radiance-ward': 'Buried Prism Cache.png',
  'cherubim-prismatic-harmony-shell': 'Canopy Eclipse Knot.png',
  'cherubim-prismatic-convergence-beacon': 'Century Blind Scar.png',
  'cherubim-prismatic-luminous-ascent': 'Century Blind Scar.png',
  'cherubim-prismatic-absolute-light': 'Whitebeam Confluence.png',
  'cherubim-dark-null-obsidian': 'Ashen Court Sigil.png',
  'cherubim-dark-rose-shroud': 'Glassrose Pyre.png',
  'cherubim-dark-void-veil': 'Glassrose Pyre.png',
  'cherubim-dark-chromatic-ward': 'Chromatic Crater.png',
  'cherubim-dark-collision-shell': 'Veilplane Fissure.png',
  'cherubim-dark-grieffire-ascent': 'Veth Serath Midplace.png',
  'cherubim-dark-mourning-mantle': 'Veth Serath Midplace.png',
  'cherubim-dark-abyss-throne': 'Vaelthorax Grieffire.png',
  // Glass Absolute Infinite cards with punctuation in their names
  // (file name intentionally drops the comma — CSS multi-layer background-image
  // parsing in Chromium can mishandle %2C inside comma-separated url() lists,
  // which would otherwise show only the Infinite card-back as a fallback)
  'ga-inf-yreth-prism-at-center': 'Yreth Prism at Center.png',
  // Age of the Butterfly cards whose name contains punctuation the on-disk
  // PNG drops (commas/hyphens stripped to avoid the same CSS url() pitfall).
  'bf-oph-copper-green-trail': 'Copper Green Trail.png',
  'bf-inf-mirrorface-voidface': 'Mirrorface Voidface.png',
  'bf-inf-velkoreth-the-unfolding': 'Velkoreth the Unfolding.png',
  // Eternal Seas cards whose name contains a comma the on-disk PNG drops.
  'es-angel-crowned-one-ruby': 'Crowned One Ruby Margin.png',
  'es-angel-crowned-one-azure': 'Crowned One Azure Margin.png',
  'es-angel-veleth-undying-water': 'Veleth Undying Water.png',
  'es-et-aeveleth-first-drift': 'Aeveleth First Drift.png',
  'es-inf-aeveleth-undying-revision': 'Aeveleth Undying Revision.png',
};

function getSnowboundEternalFileName(card: CardDefinition): string {
  return CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
}

function getSnowboundBaseFileName(card: CardDefinition): string {
  return CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.artKey}.png`;
}

const CARD_BACK_ASSET_BY_ELEMENT: Partial<Record<string, { folder: string; file: string }>> = {
  Neutrality: { folder: 'neutrality', file: 'Neutrality Card Backing.png' },
  Fire: { folder: 'pyroabyss', file: 'Pyroabyss Card Back.png' },
  Light: { folder: 'heavenly-light', file: 'Heavenly Light Card Back.png' },
  Thornbound: { folder: 'thornbound-plains', file: 'Thornbound Plains Card Back.png' },
  Mechanical: { folder: 'mechanical-dreams', file: 'Mechanical Dreams Card Back.png' },
  SnowboundVoltage: { folder: 'snowbound-voltage', file: 'Snowbound Voltage Card Back.png' },
  Prismatic: { folder: 'prismatic-accord', file: 'Prismatic Accord Card Back.png' },
  GlassAbsolute: { folder: 'glass-absolute', file: 'Glass Absolute Card Back.png' },
  BlazingGarden: { folder: 'blazing-garden', file: 'Blazing Garden Card Back.png' },
  Butterfly: { folder: 'age-of-the-butterfly', file: 'Age of the Butterfly Card Back.png' },
  EternalSeas: { folder: 'eternal-seas', file: 'Eternal Seas Card Back.png' },
  Dark: { folder: 'black-glass-inferno', file: 'Black Glass Inferno Card Back.png' },
};

const INFINITE_CARD_BACK_ASSET = { folder: 'infinite', file: 'Infinity Cards Card Back.png' };
const ETERNAL_CARD_BACK_ASSET = { folder: 'eternal', file: 'Eternal Cards Card Back.png' };

const BTEI_FOLDER_BY_PREFIX: ReadonlyArray<{ prefix: string; folder: string }> = [
  { prefix: 'btei-bgi-', folder: 'black-glass-inferno' },
  { prefix: 'btei-prismatic-', folder: 'prismatic-accord' },
  { prefix: 'btei-mech-', folder: 'mechanical-dreams' },
  { prefix: 'btei-thornbound-', folder: 'thornbound-plains' },
  { prefix: 'btei-light-', folder: 'heavenly-light' },
  { prefix: 'btei-pyroabyss-', folder: 'pyroabyss' },
  { prefix: 'btei-neutrality-', folder: 'neutrality' },
];

function getBteiFolder(definitionId: string): string | null {
  if (!definitionId.startsWith('btei-')) return null;
  const mapped = BTEI_FOLDER_BY_PREFIX.find(entry => definitionId.startsWith(entry.prefix));
  return mapped?.folder ?? 'neutrality';
}

function getCardBackUrl(card: CardDefinition | null | undefined): string | null {
  if (!card) return null;

  if (card.definitionId.startsWith('sv-')) {
    const { folder, file } = CARD_BACK_ASSET_BY_ELEMENT.SnowboundVoltage!;
    return `${CARD_BACKGROUND_ROOT}/${folder}/${encodeURIComponent(file)}`;
  }

  if (card.rarity === 'Infinite') {
    return `${CARD_BACKGROUND_ROOT}/${INFINITE_CARD_BACK_ASSET.folder}/${encodeURIComponent(INFINITE_CARD_BACK_ASSET.file)}`;
  }

  if (card.rarity === 'Eternal') {
    return `${CARD_BACKGROUND_ROOT}/${ETERNAL_CARD_BACK_ASSET.folder}/${encodeURIComponent(ETERNAL_CARD_BACK_ASSET.file)}`;
  }

  const cardBackKey = card.element;
  const asset = CARD_BACK_ASSET_BY_ELEMENT[cardBackKey];
  if (!asset) return null;
  return `${CARD_BACKGROUND_ROOT}/${asset.folder}/${encodeURIComponent(asset.file)}`;
}

function hashDefinitionId(definitionId: string): number {
  let hash = 0;
  for (let i = 0; i < definitionId.length; i++) {
    hash = ((hash << 5) - hash) + definitionId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInfiniteGlassAnimationStyle(): CSSProperties {
  return {
    animationName: 'infiniteGlassShift, infiniteGlassPulse, infiniteGlassGlint',
    animationDuration: '6.498s, 6.498s, 6.498s',
    animationTimingFunction: 'ease-in-out, ease-in-out, ease-in-out',
    animationIterationCount: 'infinite, infinite, infinite',
    animationDirection: 'alternate, alternate, alternate',
  };
}

function getEternalGlassAnimationStyle(): CSSProperties {
  return {
    animationName: 'eternalGlassShift, eternalGlassPulse, eternalGlassGlint',
    animationDuration: '6.498s, 6.498s, 6.498s',
    animationTimingFunction: 'ease-in-out, ease-in-out, ease-in-out',
    animationIterationCount: 'infinite, infinite, infinite',
    animationDirection: 'alternate, alternate, alternate',
  };
}

function getHolofoilAnimationStyle(definitionId: string): CSSProperties {
  const hash = hashDefinitionId(definitionId);
  const stagger = -((hash % 11) * 0.23);

  return {
    animationName: 'bossHoloShift, bossHoloPulse, bossHoloGlint',
    animationDuration: '8.2s, 8.2s, 8.2s',
    animationTimingFunction: 'ease-in-out, ease-in-out, ease-in-out',
    animationIterationCount: 'infinite, infinite, infinite',
    animationDirection: 'alternate, alternate, alternate',
    animationDelay: `${stagger}s, ${stagger * 0.8}s, ${stagger * 1.2}s`,
  };
}

export function getCardBackgroundUrl(card: CardDefinition | null | undefined): string | null {
  if (!card) return null;

  if (card.definitionId.startsWith('sv-infinite-')) {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/infinite/${encodeURIComponent(fileName)}`;
  }

  if (card.definitionId.startsWith('sv-eternal-')) {
    const fileName = getSnowboundEternalFileName(card);
    return `${CARD_BACKGROUND_ROOT}/snowbound-voltage/${encodeURIComponent(fileName)}`;
  }

  if (card.definitionId.startsWith('sv-')) {
    const fileName = getSnowboundBaseFileName(card);
    return `${CARD_BACKGROUND_ROOT}/snowbound-voltage/${encodeURIComponent(fileName)}`;
  }

  if (card.element === 'GlassAbsolute') {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/glass-absolute/${encodeURIComponent(fileName)}`;
  }

  if (card.element === 'BlazingGarden') {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/blazing-garden/${encodeURIComponent(fileName)}`;
  }

  if (card.element === 'Butterfly') {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/age-of-the-butterfly/${encodeURIComponent(fileName)}`;
  }

  if (card.element === 'EternalSeas') {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/eternal-seas/${encodeURIComponent(fileName)}`;
  }

  const bteiFolder = getBteiFolder(card.definitionId);
  if (bteiFolder) {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/${bteiFolder}/${encodeURIComponent(fileName)}`;
  }

  if (card.definitionId.startsWith('inf-bgi-')) {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/black-glass-inferno/${encodeURIComponent(fileName)}`;
  }

  if (card.rarity === 'Infinite') {
    const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
    return `${CARD_BACKGROUND_ROOT}/infinite/${encodeURIComponent(fileName)}`;
  }

  const folder = CARD_BACKGROUND_FOLDERS[card.element];
  if (!folder) return null;

  const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
  return `${CARD_BACKGROUND_ROOT}/${folder}/${encodeURIComponent(fileName)}`;
}

export function getCardFaceBackgroundStyle(card: CardDefinition | null | undefined, finish: CardFinish = 'normal'): CSSProperties {
  const theme = getCardThemePackStyle(card);
  const isInfinite = card?.rarity === 'Infinite';
  const isEternal = card?.rarity === 'Eternal';
  const infiniteGlassStyle = isInfinite ? getInfiniteGlassAnimationStyle() : {};
  const eternalGlassStyle = isEternal ? getEternalGlassAnimationStyle() : {};

  const holofoilStyle = finish === 'holo' && card
    ? getHolofoilAnimationStyle(card.definitionId)
    : {};

  const animStyle = isInfinite ? infiniteGlassStyle : isEternal ? eternalGlassStyle : holofoilStyle;

  const imageUrl = getCardBackgroundUrl(card);
  const fallbackImageUrl = getCardBackUrl(card);

  const infiniteLayers = [
    'linear-gradient(125deg, rgba(255,255,255,0.22) 0%, rgba(196,222,255,0.12) 24%, rgba(255,255,255,0.05) 48%, rgba(24,28,38,0.14) 74%, rgba(255,255,255,0.14) 100%)',
    'radial-gradient(ellipse at 22% 14%, rgba(255,255,255,0.24) 0%, rgba(190,220,255,0.12) 22%, rgba(0,0,0,0) 48%)',
    'linear-gradient(215deg, rgba(255,255,255,0) 22%, rgba(255,255,255,0.28) 44%, rgba(255,255,255,0.08) 56%, rgba(255,255,255,0) 72%)',
    'linear-gradient(180deg, rgba(10,10,14,0.08) 0%, rgba(10,10,14,0.02) 52%, rgba(10,10,14,0.12) 100%)',
  ];

  const eternalLayers = [
    'linear-gradient(126deg, rgba(146, 32, 58, 0.24) 0%, rgba(230, 168, 204, 0.12) 24%, rgba(104, 38, 88, 0.08) 44%, rgba(10,8,16,0.36) 68%, rgba(220, 156, 198, 0.16) 100%)',
    'radial-gradient(ellipse at 24% 18%, rgba(242, 184, 212, 0.22) 0%, rgba(170, 68, 124, 0.12) 22%, rgba(0,0,0,0) 48%)',
    'linear-gradient(215deg, rgba(255,255,255,0) 22%, rgba(236, 174, 208, 0.24) 44%, rgba(96, 34, 84, 0.12) 56%, rgba(255,255,255,0) 72%)',
    'linear-gradient(180deg, rgba(10,8,14,0.1) 0%, rgba(12,10,16,0.03) 52%, rgba(10,8,14,0.12) 100%)',
  ];

  const holoLayers = [
    'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0.42) 49%, rgba(255,255,255,0.08) 64%, rgba(255,255,255,0) 100%)',
    'linear-gradient(108deg, rgba(255, 78, 156, 0.3) 0%, rgba(255, 174, 64, 0.28) 18%, rgba(250, 241, 112, 0.22) 34%, rgba(82, 226, 255, 0.28) 52%, rgba(114, 255, 187, 0.24) 70%, rgba(173, 130, 255, 0.3) 86%, rgba(255, 78, 156, 0.24) 100%)',
    'linear-gradient(72deg, rgba(255,255,255,0) 12%, rgba(255,255,255,0.22) 34%, rgba(255,255,255,0.05) 46%, rgba(255,255,255,0.3) 58%, rgba(255,255,255,0) 76%)',
    'linear-gradient(155deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.26) 20%, rgba(255,255,255,0.03) 42%, rgba(255,255,255,0.18) 66%, rgba(255,255,255,0.05) 100%)',
    'linear-gradient(180deg, rgba(26, 18, 12, 0.1) 0%, rgba(26, 18, 12, 0.03) 55%, rgba(26, 18, 12, 0.08) 100%)',
  ];

  const overlayLayers = isInfinite ? infiniteLayers : isEternal ? eternalLayers : (finish === 'holo' ? holoLayers : []);

  const infiniteRibbon = [
    'linear-gradient(180deg, rgba(12,12,16,0.95) 0%, rgba(24,24,30,0.94) 100%)',
    'repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18) 0 1px, rgba(255,255,255,0) 1px 8px, rgba(255,255,255,0.1) 8px 9px, rgba(255,255,255,0) 9px 16px)',
  ].join(', ');
  const infinitePanel = [
    'linear-gradient(180deg, rgba(10,10,14,0.94) 0%, rgba(20,20,26,0.94) 100%)',
    'repeating-radial-gradient(circle at 54% 46%, rgba(255,255,255,0.12) 0 1px, rgba(255,255,255,0) 1px 7px, rgba(255,255,255,0.08) 7px 8px, rgba(255,255,255,0) 8px 14px)',
  ].join(', ');

  const themeVars: CSSProperties & Record<string, string> = {
    '--card-face-text': isInfinite ? 'rgba(244,246,255,0.96)' : CONSISTENT_CARD_TEXT,
    '--card-face-text-soft': isInfinite ? 'rgba(236,240,255,0.92)' : CONSISTENT_CARD_TEXT_SOFT,
    '--card-face-text-muted': isInfinite ? 'rgba(218,224,244,0.84)' : CONSISTENT_CARD_TEXT_MUTED,
    '--card-face-ribbon': isInfinite ? infiniteRibbon : theme.ribbon,
    '--card-face-panel': isInfinite ? infinitePanel : theme.panel,
    '--card-face-border': isInfinite ? 'rgba(214,226,255,0.52)' : theme.border,
    '--card-face-shadow': theme.shadow,
  };
  const tintOverlay = [
    `radial-gradient(circle at 78% 14%, ${theme.highlight} 0%, rgba(255,255,255,0) 36%)`,
    `linear-gradient(135deg, rgba(255,255,255,0) 25%, ${theme.highlight} 50%, rgba(255,255,255,0) 78%)`,
  ];
  const imageLayers: string[] = [];
  if (imageUrl) imageLayers.push(`url("${imageUrl}")`);
  if (fallbackImageUrl && fallbackImageUrl !== imageUrl) imageLayers.push(`url("${fallbackImageUrl}")`);

  const layerCount = overlayLayers.length + tintOverlay.length + (imageLayers.length > 0 ? imageLayers.length : 1);
  const layerPositions = Array(layerCount).fill('center').join(', ');
  const layerSizes = Array(layerCount).fill('cover').join(', ');
  const baseBlendModes = [
    ...overlayLayers.map((_, index) => (index === 0 ? 'screen' : index === overlayLayers.length - 1 ? 'multiply' : 'overlay')),
    'screen',
    'overlay',
  ];
  const layerBlendModes = [
    ...baseBlendModes,
    ...(imageLayers.length > 0 ? imageLayers.map(() => 'normal') : ['normal']),
  ].join(', ');

  if (imageLayers.length === 0) {
    const baseGrad = isInfinite
      ? 'linear-gradient(180deg, rgba(18,18,22,0.97) 0%, rgba(38,38,46,0.97) 100%)'
      : isEternal
        ? 'linear-gradient(180deg, rgba(8,8,12,0.98) 0%, rgba(18,10,12,0.98) 54%, rgba(8,8,12,0.98) 100%)'
      : theme.baseGradient;
    const showOverlay = overlayLayers.length > 0;
    return {
      ...themeVars,
      backgroundImage: showOverlay
        ? [...overlayLayers, ...tintOverlay, baseGrad].join(', ')
        : [...tintOverlay, baseGrad].join(', '),
      backgroundColor: isInfinite ? '#0e0e12' : isEternal ? '#0b090c' : warmTheme.surfaceStrong,
      backgroundPosition: layerPositions,
      backgroundSize: layerSizes,
      backgroundRepeat: 'no-repeat',
      backgroundBlendMode: layerBlendModes,
      ...animStyle,
    };
  }

  const showOverlay = overlayLayers.length > 0;
  return {
    ...themeVars,
    backgroundImage: showOverlay
      ? [...overlayLayers, ...tintOverlay, ...imageLayers].join(', ')
      : [...tintOverlay, ...imageLayers].join(', '),
    backgroundColor: isInfinite ? '#0e0e12' : isEternal ? '#0b090c' : warmTheme.surfaceStrong,
    backgroundPosition: layerPositions,
    backgroundSize: layerSizes,
    backgroundRepeat: 'no-repeat',
    backgroundBlendMode: layerBlendModes,
    ...animStyle,
  };
}

export function getCardFaceMetrics(variant: CardFaceVariant) {
  const base = CARD_FACE_METRICS_BASE[variant];
  return Object.defineProperties({} as CardFaceMetrics, {
    ribbonPadding: { enumerable: true, get: () => base.ribbonPadding },
    panelPadding: { enumerable: true, get: () => base.panelPadding },
    typeSize: { enumerable: true, get: () => Math.round(base.typeSize * getFontScale()) },
    nameSize: { enumerable: true, get: () => Math.round(base.nameSize * getFontScale()) },
    descSize: { enumerable: true, get: () => Math.round(base.descSize * getFontScale()) },
    descLineHeight: { enumerable: true, get: () => base.descLineHeight },
    descLines: { enumerable: true, get: () => base.descLines },
  });
}

export function getCardNameRibbonStyle(variant: CardFaceVariant): CSSProperties {
  return {
    alignSelf: 'stretch',
    background: cardFacePalette.ribbon,
    borderBottom: `1px solid ${cardFacePalette.border}`,
    boxShadow: '0 1px 0 rgba(255, 255, 255, 0.5)',
    color: cardFacePalette.text,
    padding: CARD_FACE_METRICS_BASE[variant].ribbonPadding,
  };
}

export function getCardRulesPanelStyle(variant: CardFaceVariant): CSSProperties {
  const maxHeights: Partial<Record<CardFaceVariant, string>> = {
    hand: '32%',
    pack: '34%',
    grid: '34%',
    board: '36%',
    boardMini: '36%',
  };
  return {
    alignSelf: 'stretch',
    background: cardFacePalette.panel,
    borderTop: `1px solid ${cardFacePalette.border}`,
    boxShadow: '0 -10px 22px rgba(68, 49, 32, 0.12)',
    color: cardFacePalette.textSoft,
    padding: CARD_FACE_METRICS_BASE[variant].panelPadding,
    marginTop: 'auto',
    maxHeight: maxHeights[variant],
    overflow: 'hidden',
  };
}

export function getAdaptiveDescriptionMetrics(variant: CardFaceVariant, text: string) {
  const base = CARD_FACE_METRICS_BASE[variant];
  const length = text.trim().length;

  if (variant === 'hand') {
    if (length > 180) return { fontSize: base.descSize - 2.6, lineHeight: 1.12, lineClamp: 2 };
    if (length > 120) return { fontSize: base.descSize - 1.8, lineHeight: 1.16, lineClamp: 2 };
    if (length > 80) return { fontSize: base.descSize - 1.0, lineHeight: 1.2, lineClamp: 3 };
    return { fontSize: base.descSize, lineHeight: base.descLineHeight, lineClamp: base.descLines };
  }

  if (variant === 'board') {
    if (length > 170) return { fontSize: base.descSize - 1.3, lineHeight: 1.2, lineClamp: 2 };
    if (length > 110) return { fontSize: base.descSize - 0.8, lineHeight: 1.24, lineClamp: 2 };
    return { fontSize: base.descSize, lineHeight: 1.28, lineClamp: 2 };
  }

  if (variant === 'boardMini') {
    if (length > 130) return { fontSize: base.descSize - 1.1, lineHeight: 1.18, lineClamp: 2 };
    return { fontSize: base.descSize, lineHeight: 1.24, lineClamp: 2 };
  }

  return { fontSize: base.descSize, lineHeight: base.descLineHeight, lineClamp: base.descLines };
}

export function getCardBackBackgroundStyle(
  card: CardDefinition | null | undefined,
  options: { dimmed?: boolean } = {},
): CSSProperties {
  const imageUrl = getCardBackUrl(card);
  const dimmed = options.dimmed ?? true;
  const overlays = dimmed
    ? [
      'linear-gradient(180deg, rgba(7, 11, 16, 0.52) 0%, rgba(7, 11, 16, 0.72) 100%)',
      'linear-gradient(125deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 38%, rgba(0,0,0,0.22) 100%)',
    ]
    : [
      'linear-gradient(125deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 42%, rgba(0,0,0,0.12) 100%)',
    ];

  if (!imageUrl) {
    return {
      backgroundImage: [
        ...overlays,
        'linear-gradient(180deg, rgba(22, 28, 40, 0.98) 0%, rgba(14, 18, 28, 0.98) 100%)',
      ].join(', '),
      backgroundSize: dimmed ? 'cover, 170% 170%, cover' : '170% 170%, cover',
      backgroundPosition: dimmed ? 'center, center, center' : 'center, center',
      backgroundRepeat: 'no-repeat',
      backgroundBlendMode: dimmed ? 'multiply, soft-light, normal' : 'soft-light, normal',
    };
  }

  return {
    backgroundImage: [...overlays, `url("${imageUrl}")`].join(', '),
    backgroundSize: dimmed ? 'cover, 170% 170%, cover' : '170% 170%, cover',
    backgroundPosition: dimmed ? 'center, center, center' : 'center, center',
    backgroundRepeat: 'no-repeat',
    backgroundBlendMode: dimmed ? 'multiply, soft-light, normal' : 'soft-light, normal',
  };
}