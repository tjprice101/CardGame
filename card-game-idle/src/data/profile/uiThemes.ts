import type { ProgressState } from '@/types/game';
import type { BossCategory } from '@/types/bossFight';
import { DEFAULT_WARM_PALETTE, applyUiPalette, type UiPalette } from '@/ui/theme';

/**
 * UI theme registry. Each theme provides a full UiPalette and an unlock
 * predicate over ProgressState. Unlock conditions tie themes to set-themed
 * Infinite cards or to completing a full card set.
 *
 * Players may additionally store a "custom" palette override on their profile
 * (`progress.profile.customTheme`). That override is applied on top of the
 * selected theme via `applyEffectiveTheme`.
 */
export interface UiThemeDefinition {
  id: string;
  name: string;
  description: string;
  palette: UiPalette;
  /** True ⇒ available to the player. */
  isUnlocked: (progress: ProgressState) => boolean;
  /** Optional BossCategory grouping. */
  category?: BossCategory;
  /** Hint shown when the theme is locked. */
  unlockHint?: string;
}

// ── Palette builders ───────────────────────────────────────────────────────

/** Create a palette by overriding a handful of keys against the warm baseline. */
function makePalette(overrides: Partial<UiPalette>): UiPalette {
  return { ...DEFAULT_WARM_PALETTE, ...overrides };
}

// ── Theme palettes (12 sets + default) ─────────────────────────────────────

const WARM_DEFAULT: UiPalette = { ...DEFAULT_WARM_PALETTE };

const PYROABYSS: UiPalette = makePalette({
  appBackground: 'radial-gradient(circle at 20% -10%, #5a1208 0%, rgba(40,8,4,0) 55%), linear-gradient(180deg, #1a0604 0%, #2e0a04 45%, #0d0302 100%)',
  surface: 'rgba(64, 18, 10, 0.92)',
  surfaceStrong: 'rgba(82, 24, 12, 0.96)',
  surfaceMuted: 'rgba(48, 12, 6, 0.88)',
  border: 'rgba(255, 110, 50, 0.32)',
  borderStrong: 'rgba(255, 110, 50, 0.58)',
  text: '#ffd9b8',
  textSoft: 'rgba(255, 217, 184, 0.9)',
  textMuted: 'rgba(255, 217, 184, 0.72)',
  textFaint: 'rgba(255, 217, 184, 0.5)',
  accent: '#ff5a1f',
  accentSoft: '#ff9c5a',
  accentDeep: '#3d0a02',
  button: 'linear-gradient(180deg, #ff7a3a 0%, #c43412 100%)',
  glow: '0 12px 28px rgba(255, 100, 40, 0.28)',
});

const HEAVENLY_LIGHT: UiPalette = makePalette({
  appBackground: 'radial-gradient(circle at 50% -10%, #fff4dc 0%, rgba(255,244,220,0) 55%), linear-gradient(180deg, #fbf3e2 0%, #f3e3c1 45%, #ead4a7 100%)',
  surface: 'rgba(255, 251, 240, 0.95)',
  surfaceStrong: 'rgba(255, 246, 220, 0.98)',
  surfaceMuted: 'rgba(238, 224, 192, 0.92)',
  border: 'rgba(196, 160, 90, 0.34)',
  borderStrong: 'rgba(196, 160, 90, 0.6)',
  text: '#3a2a10',
  textSoft: 'rgba(58, 42, 16, 0.86)',
  textMuted: 'rgba(58, 42, 16, 0.68)',
  textFaint: 'rgba(58, 42, 16, 0.5)',
  accent: '#e1b14a',
  accentSoft: '#f4d68a',
  accentDeep: '#7c5a18',
  button: 'linear-gradient(180deg, #f6dc92 0%, #d8a948 100%)',
  glow: '0 10px 24px rgba(244, 214, 138, 0.4)',
});

const THORNBOUND: UiPalette = makePalette({
  appBackground: 'radial-gradient(circle at 30% -10%, #2a0a10 0%, rgba(20,4,8,0) 55%), linear-gradient(180deg, #160508 0%, #2a0a10 45%, #0a0204 100%)',
  surface: 'rgba(54, 16, 22, 0.92)',
  surfaceStrong: 'rgba(70, 20, 28, 0.96)',
  surfaceMuted: 'rgba(40, 12, 16, 0.9)',
  border: 'rgba(180, 50, 70, 0.34)',
  borderStrong: 'rgba(180, 50, 70, 0.6)',
  text: '#f1d4d8',
  textSoft: 'rgba(241, 212, 216, 0.86)',
  textMuted: 'rgba(241, 212, 216, 0.66)',
  textFaint: 'rgba(241, 212, 216, 0.5)',
  accent: '#c2384f',
  accentSoft: '#e26478',
  accentDeep: '#3a070f',
  button: 'linear-gradient(180deg, #d04c64 0%, #8a1d33 100%)',
  glow: '0 10px 26px rgba(194, 56, 79, 0.3)',
});

const MECHANICAL: UiPalette = makePalette({
  appBackground: 'radial-gradient(circle at 20% -10%, #3a2814 0%, rgba(30,20,12,0) 55%), linear-gradient(180deg, #14100a 0%, #221810 45%, #0a0704 100%)',
  surface: 'rgba(60, 44, 24, 0.92)',
  surfaceStrong: 'rgba(80, 58, 30, 0.96)',
  surfaceMuted: 'rgba(44, 32, 18, 0.9)',
  border: 'rgba(220, 174, 90, 0.34)',
  borderStrong: 'rgba(220, 174, 90, 0.6)',
  text: '#f1e2bf',
  textSoft: 'rgba(241, 226, 191, 0.86)',
  textMuted: 'rgba(241, 226, 191, 0.66)',
  textFaint: 'rgba(241, 226, 191, 0.48)',
  accent: '#d4a14a',
  accentSoft: '#ecc777',
  accentDeep: '#3b2510',
  button: 'linear-gradient(180deg, #e4b75c 0%, #9a6b1c 100%)',
  glow: '0 10px 24px rgba(212, 161, 74, 0.28)',
});

const PRISMATIC: UiPalette = makePalette({
  appBackground: 'radial-gradient(circle at 50% -10%, #d8e6ff 0%, rgba(216,230,255,0) 55%), linear-gradient(180deg, #0d1224 0%, #1a2348 45%, #07091a 100%)',
  surface: 'rgba(28, 36, 70, 0.92)',
  surfaceStrong: 'rgba(40, 50, 96, 0.96)',
  surfaceMuted: 'rgba(20, 28, 56, 0.9)',
  border: 'rgba(180, 200, 255, 0.28)',
  borderStrong: 'rgba(180, 200, 255, 0.56)',
  text: '#eaf0ff',
  textSoft: 'rgba(234, 240, 255, 0.86)',
  textMuted: 'rgba(234, 240, 255, 0.66)',
  textFaint: 'rgba(234, 240, 255, 0.48)',
  accent: '#7aa9ff',
  accentSoft: '#b6cbff',
  accentDeep: '#1a2348',
  button: 'linear-gradient(180deg, #9bc1ff 0%, #4f73c4 100%)',
  glow: '0 12px 30px rgba(122, 169, 255, 0.32)',
});

const SNOWBOUND: UiPalette = makePalette({
  appBackground: 'radial-gradient(circle at 50% -10%, #d8efff 0%, rgba(216,239,255,0) 55%), linear-gradient(180deg, #06141e 0%, #0e2438 45%, #02080f 100%)',
  surface: 'rgba(20, 40, 60, 0.92)',
  surfaceStrong: 'rgba(28, 56, 84, 0.96)',
  surfaceMuted: 'rgba(14, 30, 46, 0.9)',
  border: 'rgba(140, 220, 255, 0.32)',
  borderStrong: 'rgba(140, 220, 255, 0.58)',
  text: '#e3f4ff',
  textSoft: 'rgba(227, 244, 255, 0.86)',
  textMuted: 'rgba(227, 244, 255, 0.66)',
  textFaint: 'rgba(227, 244, 255, 0.48)',
  accent: '#5fd3ff',
  accentSoft: '#a5e7ff',
  accentDeep: '#0a2438',
  button: 'linear-gradient(180deg, #8be4ff 0%, #2a8fc4 100%)',
  glow: '0 10px 28px rgba(95, 211, 255, 0.32)',
});

const BLACK_GLASS_INFERNO: UiPalette = makePalette({
  appBackground: 'radial-gradient(circle at 20% -10%, #1a0a0a 0%, rgba(10,4,4,0) 55%), linear-gradient(180deg, #050202 0%, #120606 45%, #000 100%)',
  surface: 'rgba(20, 8, 8, 0.95)',
  surfaceStrong: 'rgba(36, 14, 14, 0.97)',
  surfaceMuted: 'rgba(12, 4, 4, 0.94)',
  border: 'rgba(220, 178, 90, 0.34)',
  borderStrong: 'rgba(220, 178, 90, 0.62)',
  text: '#f6e0b8',
  textSoft: 'rgba(246, 224, 184, 0.86)',
  textMuted: 'rgba(246, 224, 184, 0.66)',
  textFaint: 'rgba(246, 224, 184, 0.46)',
  accent: '#e6b454',
  accentSoft: '#f4d186',
  accentDeep: '#3a1a08',
  button: 'linear-gradient(180deg, #f0c266 0%, #8a4818 100%)',
  glow: '0 12px 30px rgba(230, 180, 84, 0.32)',
});

const GLASS_ABSOLUTE: UiPalette = makePalette({
  appBackground: 'radial-gradient(circle at 50% -10%, #f4f9ff 0%, rgba(244,249,255,0) 55%), linear-gradient(180deg, #e8eef6 0%, #d2dce9 45%, #b8c4d4 100%)',
  surface: 'rgba(255, 255, 255, 0.92)',
  surfaceStrong: 'rgba(255, 255, 255, 0.98)',
  surfaceMuted: 'rgba(228, 234, 244, 0.92)',
  border: 'rgba(120, 140, 170, 0.34)',
  borderStrong: 'rgba(120, 140, 170, 0.58)',
  text: '#1a2535',
  textSoft: 'rgba(26, 37, 53, 0.86)',
  textMuted: 'rgba(26, 37, 53, 0.66)',
  textFaint: 'rgba(26, 37, 53, 0.48)',
  accent: '#6c8aaa',
  accentSoft: '#a8c0d8',
  accentDeep: '#2a3a52',
  button: 'linear-gradient(180deg, #c8d8e8 0%, #6c8aaa 100%)',
  glow: '0 12px 30px rgba(168, 192, 216, 0.45)',
});

const BLAZING_GARDEN: UiPalette = makePalette({
  appBackground: 'radial-gradient(circle at 50% -10%, #ffd9b0 0%, rgba(255,217,176,0) 55%), linear-gradient(180deg, #2a0e08 0%, #4a1a0c 45%, #190504 100%)',
  surface: 'rgba(74, 26, 12, 0.92)',
  surfaceStrong: 'rgba(96, 34, 16, 0.96)',
  surfaceMuted: 'rgba(56, 20, 10, 0.9)',
  border: 'rgba(255, 178, 90, 0.34)',
  borderStrong: 'rgba(255, 178, 90, 0.6)',
  text: '#ffe6c8',
  textSoft: 'rgba(255, 230, 200, 0.86)',
  textMuted: 'rgba(255, 230, 200, 0.66)',
  textFaint: 'rgba(255, 230, 200, 0.48)',
  accent: '#ff9444',
  accentSoft: '#ffc28a',
  accentDeep: '#4a1a0c',
  button: 'linear-gradient(180deg, #ffb670 0%, #c45a18 100%)',
  glow: '0 12px 28px rgba(255, 148, 68, 0.3)',
});

const BUTTERFLY: UiPalette = makePalette({
  appBackground: 'radial-gradient(circle at 30% -10%, #d6b8ff 0%, rgba(214,184,255,0) 55%), linear-gradient(180deg, #1a0a2a 0%, #2c1448 45%, #0a0418 100%)',
  surface: 'rgba(48, 24, 76, 0.92)',
  surfaceStrong: 'rgba(64, 34, 100, 0.96)',
  surfaceMuted: 'rgba(36, 18, 56, 0.9)',
  border: 'rgba(210, 168, 255, 0.32)',
  borderStrong: 'rgba(210, 168, 255, 0.58)',
  text: '#efe2ff',
  textSoft: 'rgba(239, 226, 255, 0.86)',
  textMuted: 'rgba(239, 226, 255, 0.66)',
  textFaint: 'rgba(239, 226, 255, 0.48)',
  accent: '#b88aff',
  accentSoft: '#d6b8ff',
  accentDeep: '#2c1448',
  button: 'linear-gradient(180deg, #c8a4ff 0%, #6a3ac4 100%)',
  glow: '0 12px 30px rgba(184, 138, 255, 0.34)',
});

const ETERNAL_SEAS: UiPalette = makePalette({
  appBackground: 'radial-gradient(circle at 30% -10%, #1a4858 0%, rgba(10,40,52,0) 55%), linear-gradient(180deg, #04161e 0%, #0a2c3a 45%, #02080c 100%)',
  surface: 'rgba(14, 44, 56, 0.92)',
  surfaceStrong: 'rgba(20, 60, 76, 0.96)',
  surfaceMuted: 'rgba(10, 32, 42, 0.9)',
  border: 'rgba(120, 210, 220, 0.32)',
  borderStrong: 'rgba(120, 210, 220, 0.58)',
  text: '#dff4f5',
  textSoft: 'rgba(223, 244, 245, 0.86)',
  textMuted: 'rgba(223, 244, 245, 0.66)',
  textFaint: 'rgba(223, 244, 245, 0.48)',
  accent: '#3fc7c5',
  accentSoft: '#7be0dd',
  accentDeep: '#0a2c3a',
  button: 'linear-gradient(180deg, #5fdcd9 0%, #1a7a78 100%)',
  glow: '0 10px 28px rgba(63, 199, 197, 0.3)',
});

const ABYSSAL_FORGE: UiPalette = makePalette({
  appBackground: 'radial-gradient(circle at 20% -10%, #ffae3a 0%, rgba(255,174,58,0) 55%), linear-gradient(180deg, #0e0805 0%, #1f120a 45%, #060302 100%)',
  surface: 'rgba(40, 22, 12, 0.92)',
  surfaceStrong: 'rgba(58, 32, 16, 0.96)',
  surfaceMuted: 'rgba(28, 16, 8, 0.9)',
  border: 'rgba(255, 174, 58, 0.32)',
  borderStrong: 'rgba(255, 174, 58, 0.6)',
  text: '#fce6c0',
  textSoft: 'rgba(252, 230, 192, 0.88)',
  textMuted: 'rgba(252, 230, 192, 0.68)',
  textFaint: 'rgba(252, 230, 192, 0.48)',
  accent: '#ffae3a',
  accentSoft: '#e6c890',
  accentDeep: '#1f120a',
  button: 'linear-gradient(180deg, #ffc870 0%, #a05a14 100%)',
  glow: '0 10px 28px rgba(255, 174, 58, 0.32)',
});

const DEATH_FLAMED_HELL: UiPalette = makePalette({
  appBackground: 'radial-gradient(circle at 30% -10%, #f0d8c0 0%, rgba(240,216,192,0) 50%), radial-gradient(circle at 75% 110%, #4a0a0a 0%, rgba(74,10,10,0) 60%), linear-gradient(180deg, #1a0606 0%, #2a0a0a 45%, #080202 100%)',
  surface: 'rgba(46, 14, 14, 0.92)',
  surfaceStrong: 'rgba(64, 18, 18, 0.96)',
  surfaceMuted: 'rgba(32, 8, 8, 0.9)',
  border: 'rgba(240, 216, 192, 0.28)',
  borderStrong: 'rgba(240, 216, 192, 0.55)',
  text: '#f4e2cf',
  textSoft: 'rgba(244, 226, 207, 0.86)',
  textMuted: 'rgba(244, 226, 207, 0.66)',
  textFaint: 'rgba(244, 226, 207, 0.48)',
  accent: '#f0d8c0',
  accentSoft: '#c45050',
  accentDeep: '#2a0a0a',
  button: 'linear-gradient(180deg, #f4e2cf 0%, #6c1818 100%)',
  glow: '0 10px 28px rgba(196, 80, 80, 0.32)',
});

const NEUTRALITY: UiPalette = makePalette({
  appBackground: 'radial-gradient(circle at 50% -10%, #6a6a6a 0%, rgba(106,106,106,0) 55%), linear-gradient(180deg, #0a0a0e 0%, #181822 45%, #050508 100%)',
  surface: 'rgba(32, 32, 42, 0.92)',
  surfaceStrong: 'rgba(46, 46, 60, 0.96)',
  surfaceMuted: 'rgba(22, 22, 30, 0.9)',
  border: 'rgba(180, 180, 200, 0.28)',
  borderStrong: 'rgba(180, 180, 200, 0.56)',
  text: '#e8e8f2',
  textSoft: 'rgba(232, 232, 242, 0.86)',
  textMuted: 'rgba(232, 232, 242, 0.66)',
  textFaint: 'rgba(232, 232, 242, 0.48)',
  accent: '#9a9ab2',
  accentSoft: '#c8c8dc',
  accentDeep: '#1a1a24',
  button: 'linear-gradient(180deg, #c0c0d4 0%, #6a6a82 100%)',
  glow: '0 10px 28px rgba(154, 154, 178, 0.24)',
});

// ── Unlock predicates ──────────────────────────────────────────────────────

function ownsAny(p: ProgressState, prefixes: string[]): boolean {
  const keys = Object.keys(p.infiniteCollection);
  return keys.some((k) => (p.infiniteCollection[k] ?? 0) > 0 && prefixes.some((pre) => k.startsWith(pre)));
}

// ── Theme registry ─────────────────────────────────────────────────────────

export const DEFAULT_UI_THEME_ID = 'theme-warm-default';

export const UI_THEMES: UiThemeDefinition[] = [
  {
    id: DEFAULT_UI_THEME_ID,
    name: 'Warm Hearth',
    description: 'The default amber palette.',
    palette: WARM_DEFAULT,
    isUnlocked: () => true,
  },
  {
    id: 'theme-neutrality',
    name: 'Neutral Equilibrium',
    description: 'Silver, slate, and starlight — the founding balance.',
    palette: NEUTRALITY,
    category: 'Neutrality',
    isUnlocked: (p) => ownsAny(p, ['inf-oblivion-', 'inf-void-cascade', 'inf-entropic-crown', 'inf-annihilation-field', 'inf-sovereign-void', 'inf-eternity-rupture', 'inf-genesis-throne', 'inf-null-apex']),
    unlockHint: 'Unlock any Neutrality Infinite card.',
  },
  {
    id: 'theme-pyroabyss',
    name: 'Pyroabyss Ember',
    description: 'Black coals and screaming cinders.',
    palette: PYROABYSS,
    category: 'Pyroabyss',
    isUnlocked: (p) => ownsAny(p, ['inf-pyraxis-colossus', 'inf-ash-kings-apocalypse', 'inf-pyroclasm-engine', 'inf-riftborn-sovereign']),
    unlockHint: 'Unlock any Pyroabyss Infinite card.',
  },
  {
    id: 'theme-heavenly-light',
    name: 'Heavenly Radiance',
    description: 'Dawn-gold sanctum.',
    palette: HEAVENLY_LIGHT,
    category: 'Heavenly Light',
    isUnlocked: (p) => ownsAny(p, ['inf-celestial-blackout', 'inf-lucent-cataclysm-archon', 'inf-heliarch-eclipse-engine']),
    unlockHint: 'Unlock any Heavenly Light Infinite card.',
  },
  {
    id: 'theme-thornbound',
    name: 'Thornbound Briar',
    description: 'Bleeding-road crimson and iron.',
    palette: THORNBOUND,
    category: 'Thornbound Plains',
    isUnlocked: (p) => ownsAny(p, ['inf-thornbound-', 'inf-thorn-widow-engine', 'inf-gravebloom-singularity']),
    unlockHint: 'Unlock any Thornbound Plains Infinite card.',
  },
  {
    id: 'theme-mechanical',
    name: 'Mechanical Brass',
    description: 'Furnace-mind brass and oil.',
    palette: MECHANICAL,
    category: 'Mechanical Dreams',
    isUnlocked: (p) => ownsAny(p, ['inf-machina-eternal-loop', 'inf-brass-eidolon-prime', 'inf-mech-entropy-foundry', 'inf-mechanical-apotheosis-core']),
    unlockHint: 'Unlock any Mechanical Dreams Infinite card.',
  },
  {
    id: 'theme-prismatic',
    name: 'Prismatic Spectrum',
    description: 'Cool spectrum and refracting steel.',
    palette: PRISMATIC,
    category: 'Prismatic Accord',
    isUnlocked: (p) => ownsAny(p, ['inf-prismatic-']),
    unlockHint: 'Unlock any Prismatic Accord Infinite card.',
  },
  {
    id: 'theme-snowbound',
    name: 'Snowbound Aurora',
    description: 'Cyan voltage on glacier blue.',
    palette: SNOWBOUND,
    category: 'Snowbound Voltage',
    isUnlocked: (p) => ownsAny(p, ['inf-sv-']),
    unlockHint: 'Unlock any Snowbound Voltage Infinite card.',
  },
  {
    id: 'theme-blackglass',
    name: 'Black Glass Inferno',
    description: 'Obsidian glass and gold-fire.',
    palette: BLACK_GLASS_INFERNO,
    category: 'Black Glass Inferno',
    isUnlocked: (p) => ownsAny(p, ['inf-bgi-']),
    unlockHint: 'Unlock any Black Glass Inferno Infinite card.',
  },
  {
    id: 'theme-glass-absolute',
    name: 'Glass Absolute',
    description: 'First-white crystal and steel-frost.',
    palette: GLASS_ABSOLUTE,
    category: 'Glass Absolute',
    isUnlocked: (p) => ownsAny(p, ['inf-ga-']),
    unlockHint: 'Unlock any Glass Absolute Infinite card.',
  },
  {
    id: 'theme-blazing-garden',
    name: 'Blazing Garden',
    description: 'Petal-fire ember and ember-noon.',
    palette: BLAZING_GARDEN,
    category: 'The Blazing Garden',
    isUnlocked: (p) => ownsAny(p, ['inf-bg-']),
    unlockHint: 'Unlock any Blazing Garden Infinite card.',
  },
  {
    id: 'theme-butterfly',
    name: 'Butterfly Chrysalis',
    description: 'Seven-layered violet wings.',
    palette: BUTTERFLY,
    category: 'Age of the Butterfly',
    isUnlocked: (p) => ownsAny(p, ['inf-bf-']),
    unlockHint: 'Unlock any Butterfly Age Infinite card.',
  },
  {
    id: 'theme-eternal-seas',
    name: 'Eternal Tide',
    description: 'Veilmargin cyan and oldlight teal.',
    palette: ETERNAL_SEAS,
    category: 'Eternal Seas',
    isUnlocked: (p) => ownsAny(p, ['inf-es-']),
    unlockHint: 'Unlock any Eternal Seas Infinite card.',
  },
  {
    id: 'theme-abyssal-forge',
    name: 'Abyssal Forge',
    description: 'Molten copper-gold over basalt black.',
    palette: ABYSSAL_FORGE,
    category: 'Abyssal Forge',
    isUnlocked: (p) => ownsAny(p, ['af-inf-']),
    unlockHint: 'Unlock any Abyssal Forge Infinite card.',
  },
  {
    id: 'theme-death-flamed-hell',
    name: 'Death-flamed Hell',
    description: 'Pale-fire bone over oxblood deep.',
    palette: DEATH_FLAMED_HELL,
    category: 'Death-flamed Hell',
    isUnlocked: (p) => ownsAny(p, ['dfh-inf-']),
    unlockHint: 'Unlock any Death-flamed Hell Infinite card.',
  },
];

export const UI_THEME_BY_ID: Record<string, UiThemeDefinition> =
  Object.fromEntries(UI_THEMES.map((t) => [t.id, t]));

export function isThemeUnlocked(id: string, progress: ProgressState): boolean {
  const def = UI_THEME_BY_ID[id];
  return !!def && def.isUnlocked(progress);
}

export function resolveThemeId(id: string, progress: ProgressState): string {
  return isThemeUnlocked(id, progress) ? id : DEFAULT_UI_THEME_ID;
}

/**
 * Apply the effective theme: base palette from `themeId`, with any
 * `customTheme` override merged on top. Mutates the live warmTheme in place.
 */
export function applyEffectiveTheme(
  themeId: string,
  customTheme: Partial<UiPalette> | null,
  progress: ProgressState,
): void {
  const resolvedId = resolveThemeId(themeId, progress);
  const base = UI_THEME_BY_ID[resolvedId]?.palette ?? DEFAULT_WARM_PALETTE;
  const effective: UiPalette = customTheme ? { ...base, ...customTheme } : { ...base };
  applyUiPalette(effective);
}

/**
 * Keys exposed in the custom-color editor. Keep the list small to avoid
 * overwhelming the picker UI.
 */
export const CUSTOM_THEME_EDITABLE_KEYS: Array<keyof UiPalette> = [
  'accent',
  'accentSoft',
  'accentDeep',
  'surface',
  'text',
  'border',
];
