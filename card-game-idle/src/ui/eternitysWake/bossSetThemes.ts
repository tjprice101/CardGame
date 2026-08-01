import type { BossCategory } from '@/types/bossFight';

/**
 * Per-set visual theme applied to the playfield during an active Eternity's Wake boss fight.
 *
 *  - `background`      : full-bleed CSS background for the arena (gradient layered + optional radial accent).
 *  - `accent`          : primary accent color (HP bar, panel border highlight, vignette tint).
 *  - `accentSoft`      : softer companion color for secondary highlights.
 *  - `pulseInner`      : inner color of the damage-pulse vignette (alpha is driven separately).
 *  - `pulseOuter`      : outer color of the damage-pulse vignette.
 *  - `panelBorder`     : RGBA border color for the boss HP panel.
 *  - `panelTint`       : subtle background tint applied to the boss HP panel.
 */
export interface BossSetTheme {
  background: string;
  accent: string;
  accentSoft: string;
  pulseInner: string;
  pulseOuter: string;
  panelBorder: string;
  panelTint: string;
  /** Primary text color on the boss HP panel. */
  text: string;
  /** Secondary / muted text color on the boss HP panel. */
  textMuted: string;
}

const FALLBACK_THEME: BossSetTheme = {
  background:
    'radial-gradient(circle at 18% -12%, #3f2d23 0%, rgba(63, 45, 35, 0) 56%), linear-gradient(180deg, #16100d 0%, #241912 42%, #130d0a 100%)',
  accent: '#b85c4f',
  accentSoft: '#d59a52',
  pulseInner: 'rgba(255, 90, 70, 1)',
  pulseOuter: 'rgba(180, 30, 20, 1)',
  panelBorder: 'rgba(128, 81, 32, 0.56)',
  panelTint: 'rgba(224, 197, 164, 0.96)',
  text: '#2f1b0d',
  textMuted: 'rgba(47, 27, 13, 0.78)',
};

const LIGHT_TEXT = '#f4ecd8';
const LIGHT_TEXT_MUTED = 'rgba(244, 236, 216, 0.78)';

export const BOSS_SET_THEMES: Record<BossCategory, BossSetTheme> = {
  // Hollow voids; deep slate + bone, faint violet rift.
  'Neutrality': {
    background:
      'radial-gradient(circle at 18% -10%, #443955 0%, rgba(68, 57, 85, 0) 58%), radial-gradient(circle at 82% 110%, #1a1a26 0%, rgba(26, 26, 38, 0) 60%), linear-gradient(180deg, #0e0d14 0%, #1c1a24 50%, #08070c 100%)',
    accent: '#a89bc4',
    accentSoft: '#d4cce0',
    pulseInner: 'rgba(168, 155, 196, 1)',
    pulseOuter: 'rgba(60, 50, 90, 1)',
    panelBorder: 'rgba(168, 155, 196, 0.55)',
    panelTint: 'rgba(28, 24, 38, 0.92)',
    text: LIGHT_TEXT,
    textMuted: LIGHT_TEXT_MUTED,
  },
};


export function getBossSetTheme(category: BossCategory | undefined): BossSetTheme {
  if (!category) return FALLBACK_THEME;
  return BOSS_SET_THEMES[category] ?? FALLBACK_THEME;
}
