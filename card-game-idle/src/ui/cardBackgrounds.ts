import type { CSSProperties } from 'react';
import type { CardDefinition } from '@/types/cards';
import type { CardFinish } from '@/types/cards';
import { warmTheme } from '@/ui/theme';

const CARD_BACKGROUND_ROOT = '/assets/card-backgrounds';
const CARD_BACKGROUND_FOLDERS: Partial<Record<string, string>> = {
  Fire: 'pyroabyss',
  Mechanical: 'mechanical-dreams',
  Light: 'heavenly-light',
  Neutrality: 'neutrality',
  Thornbound: 'thornbound-plains',
  Prismatic: 'prismatic-accord',
};

export type CardFaceVariant = 'hand' | 'pack' | 'grid' | 'compact' | 'board' | 'boardMini';

export const cardFacePalette = {
  text: '#17110d',
  textSoft: 'rgba(23, 17, 13, 0.9)',
  textMuted: 'rgba(23, 17, 13, 0.76)',
  ribbon: 'rgba(255, 249, 242, 0.96)',
  panel: 'rgba(252, 246, 238, 0.95)',
  border: 'rgba(68, 49, 32, 0.16)',
  shadow: '0 10px 24px rgba(68, 49, 32, 0.12)',
};

const CARD_FACE_METRICS: Record<CardFaceVariant, {
  ribbonPadding: string;
  panelPadding: string;
  typeSize: number;
  nameSize: number;
  descSize: number;
  descLineHeight: number;
  descLines: number;
}> = {
  hand: {
    ribbonPadding: '8px 10px 6px',
    panelPadding: '6px 9px 7px',
    typeSize: 9,
    nameSize: 15,
    descSize: 10,
    descLineHeight: 1.3,
    descLines: 2,
  },
  pack: {
    ribbonPadding: '10px 11px 8px',
    panelPadding: '8px 10px 9px',
    typeSize: 8,
    nameSize: 12,
    descSize: 9,
    descLineHeight: 1.3,
    descLines: 3,
  },
  grid: {
    ribbonPadding: '8px 9px 6px',
    panelPadding: '8px 9px 9px',
    typeSize: 7,
    nameSize: 10,
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

const CARD_BACKGROUND_FILE_OVERRIDES: Record<string, string> = {
  'ser-fire-voidflame': 'Void-flame Seraphim.png',
  'btei-voids-reaping': 'Hollow Queen.png',
  'btei-eternal-vigil': 'Immortal Warden.png',
  'btei-sovereign-domain': 'Chaos Sovereign.png',
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
};

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
    animationDuration: '7.2s, 7.2s, 7.2s',
    animationTimingFunction: 'ease-in-out, ease-in-out, ease-in-out',
    animationIterationCount: 'infinite, infinite, infinite',
    animationDirection: 'alternate, alternate, alternate',
  };
}

function getHolofoilAnimationStyle(definitionId: string): CSSProperties {
  const hash = hashDefinitionId(definitionId);
  const hueShift = 40 + (hash % 260);

  return {
    animationName: 'bossHoloShift, bossHoloPulse, bossHoloGlint',
    animationDuration: '7.2s, 7.2s, 7.2s',
    animationTimingFunction: 'ease-in-out, ease-in-out, ease-in-out',
    animationIterationCount: 'infinite, infinite, infinite',
    animationDirection: 'alternate, alternate, alternate',
    filter: `hue-rotate(${hueShift}deg) saturate(1.22)`,
  };
}

export function getCardBackgroundUrl(card: CardDefinition | null | undefined): string | null {
  if (!card) return null;

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
  const isInfinite = card?.rarity === 'Infinite';
  const isInfiniteHolo = isInfinite && finish === 'holo';
  const infiniteGlassStyle = isInfinite && !isInfiniteHolo ? getInfiniteGlassAnimationStyle() : {};

  const holofoilStyle = finish === 'holo' && card
    ? getHolofoilAnimationStyle(card.definitionId)
    : {};

  // Infinite cards always get their glass shimmer regardless of finish
  const animStyle = isInfiniteHolo ? holofoilStyle : (isInfinite ? infiniteGlassStyle : holofoilStyle);

  const imageUrl = getCardBackgroundUrl(card);

  // Infinite shimmer layers: deep white/black glass with no colour
  const infiniteLayers = [
    'linear-gradient(140deg, rgba(255,255,255,0.22) 0%, rgba(0,0,0,0.18) 30%, rgba(255,255,255,0.30) 55%, rgba(0,0,0,0.14) 75%, rgba(255,255,255,0.20) 100%)',
    'radial-gradient(ellipse at 20% 15%, rgba(255,255,255,0.30) 0%, rgba(0,0,0,0) 40%)',
    'linear-gradient(220deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.36) 50%, rgba(0,0,0,0.12) 58%, rgba(255,255,255,0) 72%)',
    'linear-gradient(180deg, rgba(10,10,14,0.20) 0%, rgba(10,10,14,0.06) 50%, rgba(10,10,14,0.18) 100%)',
  ];

  const holoLayers = [
    'linear-gradient(140deg, rgba(255, 104, 192, 0.12) 0%, rgba(255, 193, 82, 0.08) 24%, rgba(98, 205, 255, 0.12) 48%, rgba(122, 246, 181, 0.1) 72%, rgba(255, 255, 255, 0.14) 100%)',
    'radial-gradient(circle at 18% 14%, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0) 30%)',
    'linear-gradient(120deg, rgba(255, 255, 255, 0) 32%, rgba(255, 255, 255, 0.2) 48%, rgba(255, 255, 255, 0.05) 56%, rgba(255, 255, 255, 0) 70%)',
    'linear-gradient(180deg, rgba(26, 18, 12, 0.16) 0%, rgba(26, 18, 12, 0.04) 55%, rgba(26, 18, 12, 0.1) 100%)',
  ];

  // Infinite holo cards keep full-color art by default; hover fractal is handled in CSS.
  const overlayLayers = isInfiniteHolo ? [] : (isInfinite ? infiniteLayers : (finish === 'holo' ? holoLayers : []));

  if (!imageUrl) {
    const baseGrad = isInfinite
      ? 'linear-gradient(180deg, rgba(18,18,22,0.97) 0%, rgba(38,38,46,0.97) 100%)'
      : 'linear-gradient(180deg, rgba(255, 247, 236, 0.98) 0%, rgba(243, 228, 207, 0.98) 100%)';
    const showOverlay = overlayLayers.length > 0;
    return {
      backgroundImage: showOverlay
        ? [...overlayLayers, baseGrad].join(', ')
        : baseGrad,
      backgroundColor: isInfinite ? '#0e0e12' : warmTheme.surfaceStrong,
      backgroundPosition: showOverlay ? 'center, center, center, center, center' : 'center',
      backgroundSize: showOverlay ? '215% 215%, 140% 140%, 180% 180%, cover, cover' : 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundBlendMode: showOverlay ? 'screen, overlay, soft-light, multiply, normal' : undefined,
      ...animStyle,
    };
  }

  const showOverlay = overlayLayers.length > 0;
  return {
    backgroundImage: showOverlay
      ? [...overlayLayers, `url("${imageUrl}")`].join(', ')
      : `url("${imageUrl}")`,
    backgroundColor: isInfinite ? '#0e0e12' : warmTheme.surfaceStrong,
    backgroundPosition: showOverlay ? 'center, center, center, center, center' : 'center',
    backgroundSize: showOverlay ? '215% 215%, 140% 140%, 180% 180%, cover, cover' : 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundBlendMode: showOverlay ? 'screen, overlay, soft-light, multiply, normal' : undefined,
    ...animStyle,
  };
}

export function getCardFaceMetrics(variant: CardFaceVariant) {
  return CARD_FACE_METRICS[variant];
}

export function getCardNameRibbonStyle(variant: CardFaceVariant): CSSProperties {
  return {
    alignSelf: 'stretch',
    background: cardFacePalette.ribbon,
    borderBottom: `1px solid ${cardFacePalette.border}`,
    boxShadow: '0 1px 0 rgba(255, 255, 255, 0.5)',
    padding: CARD_FACE_METRICS[variant].ribbonPadding,
  };
}

export function getCardRulesPanelStyle(variant: CardFaceVariant): CSSProperties {
  const maxHeights: Partial<Record<CardFaceVariant, string>> = {
    hand: '41%',
    pack: '43%',
    grid: '44%',
    board: '46%',
    boardMini: '48%',
  };
  return {
    alignSelf: 'stretch',
    background: cardFacePalette.panel,
    borderTop: `1px solid ${cardFacePalette.border}`,
    boxShadow: '0 -10px 22px rgba(68, 49, 32, 0.12)',
    padding: CARD_FACE_METRICS[variant].panelPadding,
    marginTop: 'auto',
    maxHeight: maxHeights[variant],
    overflow: 'hidden',
  };
}

export function getAdaptiveDescriptionMetrics(variant: CardFaceVariant, text: string) {
  const base = CARD_FACE_METRICS[variant];
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