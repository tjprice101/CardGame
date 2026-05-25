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
const DARK_TEXT = '#2a1b08';
const DARK_TEXT_MUTED = 'rgba(42, 27, 8, 0.78)';

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
  // Furnace abyss; molten red into oxidized black.
  'Pyroabyss': {
    background:
      'radial-gradient(circle at 22% -8%, #c43820 0%, rgba(196, 56, 32, 0) 54%), radial-gradient(circle at 78% 108%, #5a0e02 0%, rgba(90, 14, 2, 0) 60%), linear-gradient(180deg, #1a0805 0%, #2b0e06 48%, #0c0402 100%)',
    accent: '#ff6a2e',
    accentSoft: '#ffb066',
    pulseInner: 'rgba(255, 140, 60, 1)',
    pulseOuter: 'rgba(120, 24, 8, 1)',
    panelBorder: 'rgba(255, 106, 46, 0.65)',
    panelTint: 'rgba(46, 14, 6, 0.94)',
    text: LIGHT_TEXT,
    textMuted: LIGHT_TEXT_MUTED,
  },
  // Bright cathedral skies; gold over pale gold-white.
  'Heavenly Light': {
    background:
      'radial-gradient(circle at 50% -10%, #fff3c4 0%, rgba(255, 243, 196, 0) 58%), radial-gradient(circle at 12% 108%, #f3d27a 0%, rgba(243, 210, 122, 0) 62%), linear-gradient(180deg, #f4e6b9 0%, #e8c97a 50%, #b8893a 100%)',
    accent: '#b88324',
    accentSoft: '#f0d178',
    pulseInner: 'rgba(255, 230, 130, 1)',
    pulseOuter: 'rgba(184, 131, 36, 1)',
    panelBorder: 'rgba(184, 131, 36, 0.7)',
    panelTint: 'rgba(252, 240, 200, 0.96)',
    text: DARK_TEXT,
    textMuted: DARK_TEXT_MUTED,
  },
  // Bloodthorn briars; oxblood with green-black undergrowth.
  'Thornbound Plains': {
    background:
      'radial-gradient(circle at 18% -10%, #7a1830 0%, rgba(122, 24, 48, 0) 58%), radial-gradient(circle at 82% 108%, #1f2a18 0%, rgba(31, 42, 24, 0) 60%), linear-gradient(180deg, #160a10 0%, #251018 48%, #0a0408 100%)',
    accent: '#c43b54',
    accentSoft: '#7faf68',
    pulseInner: 'rgba(196, 59, 84, 1)',
    pulseOuter: 'rgba(60, 12, 24, 1)',
    panelBorder: 'rgba(196, 59, 84, 0.6)',
    panelTint: 'rgba(38, 16, 24, 0.94)',
    text: LIGHT_TEXT,
    textMuted: LIGHT_TEXT_MUTED,
  },
  // Brass and lightning; cyan-arc over warm bronze.
  'Mechanical Dreams': {
    background:
      'radial-gradient(circle at 20% -10%, #3aa5c8 0%, rgba(58, 165, 200, 0) 56%), radial-gradient(circle at 80% 108%, #6b4318 0%, rgba(107, 67, 24, 0) 60%), linear-gradient(180deg, #0e1418 0%, #1a221f 48%, #0a0d0e 100%)',
    accent: '#58d4ff',
    accentSoft: '#e0a64a',
    pulseInner: 'rgba(88, 212, 255, 1)',
    pulseOuter: 'rgba(20, 60, 90, 1)',
    panelBorder: 'rgba(88, 212, 255, 0.55)',
    panelTint: 'rgba(20, 28, 34, 0.94)',
    text: LIGHT_TEXT,
    textMuted: LIGHT_TEXT_MUTED,
  },
  // Refracted spectrum; iridescent cyan/magenta over pale ash.
  'Prismatic Accord': {
    background:
      'radial-gradient(circle at 18% -10%, #ff7adc 0%, rgba(255, 122, 220, 0) 54%), radial-gradient(circle at 82% 108%, #58c6ff 0%, rgba(88, 198, 255, 0) 58%), linear-gradient(180deg, #15131c 0%, #221c2e 48%, #0c0a13 100%)',
    accent: '#ff7adc',
    accentSoft: '#58c6ff',
    pulseInner: 'rgba(255, 200, 240, 1)',
    pulseOuter: 'rgba(80, 40, 120, 1)',
    panelBorder: 'rgba(255, 122, 220, 0.55)',
    panelTint: 'rgba(28, 22, 38, 0.94)',
    text: LIGHT_TEXT,
    textMuted: LIGHT_TEXT_MUTED,
  },
  // Frostbound voltage; icy cyan over deep blue-black.
  'Snowbound Voltage': {
    background:
      'radial-gradient(circle at 20% -10%, #9be3ff 0%, rgba(155, 227, 255, 0) 58%), radial-gradient(circle at 80% 108%, #2050a8 0%, rgba(32, 80, 168, 0) 60%), linear-gradient(180deg, #06101c 0%, #0e1c34 48%, #03070e 100%)',
    accent: '#9be3ff',
    accentSoft: '#5c9eff',
    pulseInner: 'rgba(155, 227, 255, 1)',
    pulseOuter: 'rgba(20, 50, 120, 1)',
    panelBorder: 'rgba(155, 227, 255, 0.55)',
    panelTint: 'rgba(10, 22, 40, 0.94)',
    text: LIGHT_TEXT,
    textMuted: LIGHT_TEXT_MUTED,
  },
  // Black volcanic glass; obsidian with thin ember veins.
  'Black Glass Inferno': {
    background:
      'radial-gradient(circle at 18% -10%, #ff4422 0%, rgba(255, 68, 34, 0) 52%), radial-gradient(circle at 82% 108%, #1a0a08 0%, rgba(26, 10, 8, 0) 60%), linear-gradient(180deg, #0a0606 0%, #1a0e0c 48%, #050202 100%)',
    accent: '#ff5a2e',
    accentSoft: '#8c2418',
    pulseInner: 'rgba(255, 90, 46, 1)',
    pulseOuter: 'rgba(40, 8, 4, 1)',
    panelBorder: 'rgba(255, 90, 46, 0.55)',
    panelTint: 'rgba(18, 8, 6, 0.96)',
    text: LIGHT_TEXT,
    textMuted: LIGHT_TEXT_MUTED,
  },
  // Perfect refraction; cold cyan-white over pale slate.
  'Glass Absolute': {
    background:
      'radial-gradient(circle at 18% -10%, #a8e8ff 0%, rgba(168, 232, 255, 0) 60%), radial-gradient(circle at 82% 108%, #c4d4e0 0%, rgba(196, 212, 224, 0) 62%), linear-gradient(180deg, #d8e4ec 0%, #a8bcc8 50%, #6c8290 100%)',
    accent: '#3e7f9c',
    accentSoft: '#a8e8ff',
    pulseInner: 'rgba(168, 232, 255, 1)',
    pulseOuter: 'rgba(60, 120, 150, 1)',
    panelBorder: 'rgba(62, 127, 156, 0.6)',
    panelTint: 'rgba(230, 240, 248, 0.92)',
    text: DARK_TEXT,
    textMuted: DARK_TEXT_MUTED,
  },
  // Blooming gardens of fire; rose-gold over deep verdant.
  'The Blazing Garden': {
    background:
      'radial-gradient(circle at 20% -10%, #ff9a5a 0%, rgba(255, 154, 90, 0) 56%), radial-gradient(circle at 80% 108%, #1a3a1f 0%, rgba(26, 58, 31, 0) 60%), linear-gradient(180deg, #1a1208 0%, #2a2010 48%, #0c0805 100%)',
    accent: '#ff9a5a',
    accentSoft: '#7fc06a',
    pulseInner: 'rgba(255, 154, 90, 1)',
    pulseOuter: 'rgba(80, 32, 12, 1)',
    panelBorder: 'rgba(255, 154, 90, 0.55)',
    panelTint: 'rgba(32, 22, 12, 0.94)',
    text: LIGHT_TEXT,
    textMuted: LIGHT_TEXT_MUTED,
  },
  // Wings of dust and stained-glass; violet & turquoise.
  'Age of the Butterfly': {
    background:
      'radial-gradient(circle at 18% -10%, #c084ff 0%, rgba(192, 132, 255, 0) 56%), radial-gradient(circle at 82% 108%, #4ac8b4 0%, rgba(74, 200, 180, 0) 60%), linear-gradient(180deg, #120a1f 0%, #1e1530 48%, #07040c 100%)',
    accent: '#c084ff',
    accentSoft: '#4ac8b4',
    pulseInner: 'rgba(192, 132, 255, 1)',
    pulseOuter: 'rgba(60, 28, 100, 1)',
    panelBorder: 'rgba(192, 132, 255, 0.55)',
    panelTint: 'rgba(22, 14, 36, 0.94)',
    text: LIGHT_TEXT,
    textMuted: LIGHT_TEXT_MUTED,
  },
  // Deep ocean abyss; teal phosphor over near-black blue.
  'Eternal Seas': {
    background:
      'radial-gradient(circle at 18% -10%, #2ac8c4 0%, rgba(42, 200, 196, 0) 58%), radial-gradient(circle at 82% 108%, #0a2840 0%, rgba(10, 40, 64, 0) 60%), linear-gradient(180deg, #04101c 0%, #082030 48%, #02060c 100%)',
    accent: '#2ac8c4',
    accentSoft: '#7af0e6',
    pulseInner: 'rgba(122, 240, 230, 1)',
    pulseOuter: 'rgba(8, 50, 70, 1)',
    panelBorder: 'rgba(42, 200, 196, 0.55)',
    panelTint: 'rgba(8, 22, 36, 0.94)',
    text: LIGHT_TEXT,
    textMuted: LIGHT_TEXT_MUTED,
  },
  // Molten anvils beneath the sea; copper-gold sparks over basalt black.
  'Abyssal Forge': {
    background:
      'radial-gradient(circle at 18% -10%, #ffae3a 0%, rgba(255, 174, 58, 0) 54%), radial-gradient(circle at 82% 108%, #3a1c08 0%, rgba(58, 28, 8, 0) 60%), linear-gradient(180deg, #0e0805 0%, #1f120a 48%, #060302 100%)',
    accent: '#ffae3a',
    accentSoft: '#e6c890',
    pulseInner: 'rgba(255, 198, 110, 1)',
    pulseOuter: 'rgba(96, 40, 12, 1)',
    panelBorder: 'rgba(255, 174, 58, 0.6)',
    panelTint: 'rgba(28, 16, 8, 0.94)',
    text: LIGHT_TEXT,
    textMuted: LIGHT_TEXT_MUTED,
  },
  // Pale fire over crimson hell; bone-white embers on oxblood.
  'Death-flamed Hell': {
    background:
      'radial-gradient(circle at 18% -10%, #f0d8c0 0%, rgba(240, 216, 192, 0) 54%), radial-gradient(circle at 82% 108%, #4a0a0a 0%, rgba(74, 10, 10, 0) 60%), linear-gradient(180deg, #1a0606 0%, #2a0a0a 48%, #080202 100%)',
    accent: '#f0d8c0',
    accentSoft: '#c45050',
    pulseInner: 'rgba(240, 216, 192, 1)',
    pulseOuter: 'rgba(90, 12, 12, 1)',
    panelBorder: 'rgba(240, 216, 192, 0.55)',
    panelTint: 'rgba(30, 8, 8, 0.94)',
    text: LIGHT_TEXT,
    textMuted: LIGHT_TEXT_MUTED,
  },
  // Deep-space obsidian; ice-blue dreamfire on star-black.
  '[EVENT] Wished Upon A Star': {
    background:
      'radial-gradient(circle at 20% -10%, #9be3ff 0%, rgba(155, 227, 255, 0) 54%), radial-gradient(circle at 80% 110%, #3a2060 0%, rgba(58, 32, 96, 0) 60%), linear-gradient(180deg, #02040e 0%, #060814 48%, #01020a 100%)',
    accent: '#9be3ff',
    accentSoft: '#d4c8ff',
    pulseInner: 'rgba(155, 227, 255, 1)',
    pulseOuter: 'rgba(20, 40, 120, 1)',
    panelBorder: 'rgba(155, 227, 255, 0.55)',
    panelTint: 'rgba(6, 10, 24, 0.94)',
    text: LIGHT_TEXT,
    textMuted: LIGHT_TEXT_MUTED,
  },
};

export function getBossSetTheme(category: BossCategory | undefined): BossSetTheme {
  if (!category) return FALLBACK_THEME;
  return BOSS_SET_THEMES[category] ?? FALLBACK_THEME;
}
