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
  appBackground: 'radial-gradient(circle at 18% -12%, #3f2d23 0%, rgba(63, 45, 35, 0) 56%), linear-gradient(180deg, #16100d 0%, #241912 42%, #130d0a 100%)',
  overlay: 'rgba(218, 193, 164, 0.9)',
  backdrop: 'rgba(58, 38, 20, 0.48)',
  surface: 'rgba(232, 211, 184, 0.9)',
  surfaceStrong: 'rgba(224, 197, 164, 0.96)',
  surfaceMuted: 'rgba(204, 173, 138, 0.9)',
  border: 'rgba(128, 81, 32, 0.32)',
  borderStrong: 'rgba(128, 81, 32, 0.56)',
  text: '#2f1b0d',
  textSoft: 'rgba(47, 27, 13, 0.88)',
  textMuted: 'rgba(47, 27, 13, 0.78)',
  textFaint: 'rgba(47, 27, 13, 0.64)',
  accent: '#b56a2e',
  accentSoft: '#d59a52',
  accentDeep: '#3a220f',
  success: '#4f8a47',
  danger: '#b85c4f',
  cherubim: '#8f74a9',
  shadow: '0 16px 36px rgba(146, 96, 43, 0.12)',
  glow: '0 10px 24px rgba(214, 162, 94, 0.16)',
  button: 'linear-gradient(180deg, #ebc48e 0%, #d59f55 100%)',
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