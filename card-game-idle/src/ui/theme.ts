/**
 * Palette shape consumed throughout the UI. Mutated in-place by
 * `applyUiPalette` so existing `import { warmTheme }` consumers continue
 * to read the active theme without refactoring.
 */
export interface UiPalette {
  appBackground: string;
  overlay: string;
  backdrop: string;
  surface: string;
  surfaceStrong: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textSoft: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentSoft: string;
  accentDeep: string;
  success: string;
  danger: string;
  cherubim: string;
  shadow: string;
  glow: string;
  button: string;
}

export const DEFAULT_WARM_PALETTE: UiPalette = {
  // Deep navy — visible behind modals/panels, matches the dark overlay
  // tones of the main menu art (InfiniteCardsMenuArt.png).
  appBackground: 'radial-gradient(circle at 22% -8%, #1e3a58 0%, rgba(30,58,88,0) 55%), linear-gradient(180deg, #0c1a2c 0%, #111f35 42%, #08111e 100%)',
  overlay: 'rgba(230, 237, 248, 0.92)',
  backdrop: 'rgba(8, 18, 38, 0.52)',
  // Surfaces: clean neutral cream — matches the main menu tile colour
  surface: 'rgba(244, 241, 234, 0.94)',
  surfaceStrong: 'rgba(252, 249, 244, 0.97)',
  surfaceMuted: 'rgba(222, 218, 208, 0.94)',
  // Borders: cool blue-grey (not warm amber)
  border: 'rgba(100, 140, 188, 0.28)',
  borderStrong: 'rgba(62, 112, 168, 0.52)',
  // Text: very dark blue-grey (reads on cream; close to the tile text colour)
  text: '#1a2535',
  textSoft: 'rgba(26, 37, 53, 0.88)',
  textMuted: 'rgba(26, 37, 53, 0.65)',
  textFaint: 'rgba(26, 37, 53, 0.46)',
  // Accents: steel blue — matches the primary "Begin Turn" tile
  accent: '#3a8ec8',
  accentSoft: '#58aada',
  accentDeep: '#0d1e34',
  success: '#4f8a47',
  danger: '#b85c4f',
  cherubim: '#7a82c0',
  shadow: '0 16px 36px rgba(16, 52, 100, 0.18)',
  glow: '0 10px 24px rgba(72, 152, 220, 0.20)',
  button: 'linear-gradient(180deg, #5aabdc 0%, #3888c4 100%)',
};

/**
 * Live UI palette. Always the same object reference. Mutated in-place by
 * `applyUiPalette` when the player switches themes; React surfaces re-render
 * via a top-level theme-version key in App.
 */
export const warmTheme: UiPalette = { ...DEFAULT_WARM_PALETTE };

/** Overwrite warmTheme in-place with `palette`. */
export function applyUiPalette(palette: UiPalette): void {
  Object.assign(warmTheme, palette);
}

/** Reset warmTheme to the default warm palette. */
export function resetUiPalette(): void {
  Object.assign(warmTheme, DEFAULT_WARM_PALETTE);
}

export const uiTypography = {
  display: 'Georgia, "Iowan Old Style", "Cambria", "Times New Roman", serif',
  body: 'Georgia, "Iowan Old Style", "Cambria", "Times New Roman", serif',
};

/**
 * Static warm-amber palette used by sub-menus, modals, and settings panels.
 * Always amber/cream regardless of what the player's active UI theme is.
 */
export const subMenuWarm = {
  accent:       '#c8803a',
  accentSoft:   '#daa058',
  accentDeep:   '#2c1a0e',
  text:         '#2c1a0e',
  textMuted:    'rgba(44,26,14,0.65)',
  textFaint:    'rgba(44,26,14,0.40)',
  border:       'rgba(194,151,102,0.35)',
  borderStrong: 'rgba(160,108,58,0.55)',
  surface:      'rgba(252,248,240,0.96)',
  surfaceStrong:'rgba(255,252,246,0.98)',
  surfaceMuted: 'rgba(238,230,214,0.92)',
  button:       'linear-gradient(180deg, #daa058 0%, #b06828 100%)',
  buttonText:   '#2c1a0e',
  success:      '#4f8a47',
  danger:       '#b85c4f',
  shadow:       '0 16px 40px rgba(80,40,10,0.22)',
};