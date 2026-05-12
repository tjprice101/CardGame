import type { CSSProperties } from 'react';
import type { CardDefinition } from '@/types/cards';
import { warmTheme } from '@/ui/theme';

const CARD_BACKGROUND_ROOT = '/assets/card-backgrounds';
const CARD_BACKGROUND_FOLDERS: Partial<Record<string, string>> = {
  Fire: 'pyroabyss',
  Neutrality: 'neutrality',
};

export type CardFaceVariant = 'hand' | 'pack' | 'grid' | 'compact' | 'board' | 'boardMini';

export const cardFacePalette = {
  text: '#1d1713',
  textSoft: 'rgba(29, 23, 19, 0.88)',
  textMuted: 'rgba(29, 23, 19, 0.72)',
  ribbon: 'rgba(255, 248, 241, 0.94)',
  panel: 'rgba(251, 244, 236, 0.93)',
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
    ribbonPadding: '10px 12px 8px',
    panelPadding: '10px 12px 12px',
    typeSize: 9,
    nameSize: 15,
    descSize: 11,
    descLineHeight: 1.45,
    descLines: 4,
  },
  pack: {
    ribbonPadding: '10px 11px 8px',
    panelPadding: '10px 11px 11px',
    typeSize: 8,
    nameSize: 12,
    descSize: 9,
    descLineHeight: 1.45,
    descLines: 4,
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
  'angel-neutral-beginning': 'The Beginning and the End.png',
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
};

export function getCardBackgroundUrl(card: CardDefinition | null | undefined): string | null {
  if (!card) return null;

  const folder = CARD_BACKGROUND_FOLDERS[card.element];
  if (!folder) return null;

  const fileName = CARD_BACKGROUND_FILE_OVERRIDES[card.definitionId] ?? `${card.name}.png`;
  return `${CARD_BACKGROUND_ROOT}/${folder}/${encodeURIComponent(fileName)}`;
}

export function getCardFaceBackgroundStyle(card: CardDefinition | null | undefined): CSSProperties {
  const imageUrl = getCardBackgroundUrl(card);
  if (!imageUrl) {
    return {
      backgroundImage: 'linear-gradient(180deg, rgba(255, 247, 236, 0.98) 0%, rgba(243, 228, 207, 0.98) 100%)',
      backgroundColor: warmTheme.surfaceStrong,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
    };
  }

  return {
    backgroundImage: `url("${imageUrl}")`,
    backgroundColor: warmTheme.surfaceStrong,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
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
  return {
    alignSelf: 'stretch',
    background: cardFacePalette.panel,
    borderTop: `1px solid ${cardFacePalette.border}`,
    boxShadow: '0 -10px 22px rgba(68, 49, 32, 0.12)',
    padding: CARD_FACE_METRICS[variant].panelPadding,
    marginTop: 'auto',
  };
}