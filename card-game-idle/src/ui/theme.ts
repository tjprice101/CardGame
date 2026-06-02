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
  appBackground: 'radial-gradient(circle at 22% -8%, #1e3a58 0%, rgba(30,58,88,0) 55%), linear-gradient(180deg, #0c1a2c 0%, #111f35 42%, #08111e 100%)',
  overlay: 'rgba(10, 18, 30, 0.88)',
  backdrop: 'rgba(8, 18, 38, 0.56)',
  surface: 'rgba(20, 32, 50, 0.92)',
  surfaceStrong: 'rgba(26, 40, 62, 0.95)',
  surfaceMuted: 'rgba(16, 26, 40, 0.9)',
  border: 'rgba(100, 140, 188, 0.34)',
  borderStrong: 'rgba(92, 152, 220, 0.58)',
  text: '#eaf2ff',
  textSoft: 'rgba(234, 242, 255, 0.9)',
  textMuted: 'rgba(234, 242, 255, 0.72)',
  textFaint: 'rgba(234, 242, 255, 0.52)',
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

type Rgba = { r: number; g: number; b: number; a: number };

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function rgbaToCss({ r, g, b, a }: Rgba): string {
  const alpha = Math.round(clamp01(a) * 1000) / 1000;
  return `rgba(${clamp255(r)}, ${clamp255(g)}, ${clamp255(b)}, ${alpha})`;
}

function hexToRgba(hex: string): Rgba | null {
  const v = hex.trim().replace('#', '');
  if (v.length === 3) {
    const r = parseInt(v[0] + v[0], 16);
    const g = parseInt(v[1] + v[1], 16);
    const b = parseInt(v[2] + v[2], 16);
    return { r, g, b, a: 1 };
  }
  if (v.length === 6) {
    const r = parseInt(v.slice(0, 2), 16);
    const g = parseInt(v.slice(2, 4), 16);
    const b = parseInt(v.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  }
  if (v.length === 8) {
    const r = parseInt(v.slice(0, 2), 16);
    const g = parseInt(v.slice(2, 4), 16);
    const b = parseInt(v.slice(4, 6), 16);
    const a = parseInt(v.slice(6, 8), 16) / 255;
    return { r, g, b, a };
  }
  return null;
}

function parseRgbFn(value: string): Rgba | null {
  const match = value.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;
  const parts = match[1].split(',').map(p => p.trim());
  if (parts.length < 3) return null;
  const r = Number(parts[0]);
  const g = Number(parts[1]);
  const b = Number(parts[2]);
  const a = parts.length >= 4 ? Number(parts[3]) : 1;
  if ([r, g, b, a].some(n => Number.isNaN(n))) return null;
  return { r, g, b, a: clamp01(a) };
}

function extractFirstColorToken(value: string): string | null {
  const match = value.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))/);
  return match ? match[1] : null;
}

function parseColor(value: string): Rgba | null {
  const token = extractFirstColorToken(value.trim());
  if (!token) return null;
  if (token.startsWith('#')) return hexToRgba(token);
  if (token.startsWith('rgb')) return parseRgbFn(token);
  return null;
}

function compositeOver(fg: Rgba, bg: Rgba): Rgba {
  const a = clamp01(fg.a + bg.a * (1 - fg.a));
  if (a <= 0) return { r: 0, g: 0, b: 0, a: 0 };
  const r = (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a;
  const g = (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a;
  const b = (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a;
  return { r, g, b, a };
}

function linearize(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(c: Rgba): number {
  const r = linearize(clamp255(c.r));
  const g = linearize(clamp255(c.g));
  const b = linearize(clamp255(c.b));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg: Rgba, bg: Rgba): number {
  const effectiveFg = fg.a < 1 ? compositeOver(fg, bg) : fg;
  const l1 = luminance(effectiveFg);
  const l2 = luminance(bg);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function minContrastAgainstBackgrounds(fg: Rgba, bgs: Rgba[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (const bg of bgs) {
    min = Math.min(min, contrastRatio(fg, bg));
  }
  return Number.isFinite(min) ? min : 0;
}

function withAlpha(c: Rgba, a: number): Rgba {
  return { r: c.r, g: c.g, b: c.b, a: clamp01(a) };
}

function normalizePaletteForLegibility(palette: UiPalette): UiPalette {
  const fallbackBg: Rgba = { r: 20, g: 28, b: 40, a: 1 };
  const bgs = [palette.surface, palette.surfaceStrong, palette.surfaceMuted]
    .map(parseColor)
    .filter((v): v is Rgba => !!v)
    .map(bg => (bg.a < 1 ? compositeOver(bg, fallbackBg) : bg));

  if (bgs.length === 0) return palette;

  const preferredText = parseColor(palette.text) ?? parseColor(DEFAULT_WARM_PALETTE.text) ?? { r: 234, g: 242, b: 255, a: 1 };
  const candidateTexts: Rgba[] = [
    withAlpha(preferredText, 1),
    { r: 245, g: 249, b: 255, a: 1 },
    { r: 248, g: 241, b: 225, a: 1 },
    { r: 20, g: 25, b: 36, a: 1 },
    { r: 35, g: 29, b: 20, a: 1 },
  ];

  let best = candidateTexts[0];
  let bestScore = minContrastAgainstBackgrounds(best, bgs);
  for (const c of candidateTexts.slice(1)) {
    const score = minContrastAgainstBackgrounds(c, bgs);
    if (score > bestScore) {
      best = c;
      bestScore = score;
    }
  }

  const minPrimaryContrast = 4.5;
  const chosenText = bestScore >= minPrimaryContrast ? best : candidateTexts.reduce((acc, c) => {
    const s = minContrastAgainstBackgrounds(c, bgs);
    return s > minContrastAgainstBackgrounds(acc, bgs) ? c : acc;
  }, best);

  const chosenSoft = withAlpha(chosenText, 0.92);
  const chosenMuted = withAlpha(chosenText, 0.78);
  const chosenFaint = withAlpha(chosenText, 0.62);

  return {
    ...palette,
    text: rgbaToCss(withAlpha(chosenText, 1)),
    textSoft: rgbaToCss(chosenSoft),
    textMuted: rgbaToCss(chosenMuted),
    textFaint: rgbaToCss(chosenFaint),
  };
}

// ─── Theme version subscription ───────────────────────────────────────────
// React components that read `warmTheme.*` inline (instead of deriving from
// `getEffectiveThemePalette` in a memo) won't re-render when the palette is
// mutated by applyUiPalette. We expose a tiny external store so they can
// subscribe with `useThemeVersion()` and re-render on theme changes.
let themeVersion = 0;
const themeListeners = new Set<() => void>();

export function getThemeVersion(): number {
  return themeVersion;
}

export function subscribeThemeVersion(fn: () => void): () => void {
  themeListeners.add(fn);
  return () => {
    themeListeners.delete(fn);
  };
}

function bumpThemeVersion(): void {
  themeVersion++;
  themeListeners.forEach(fn => {
    try { fn(); } catch { /* listener errors are swallowed */ }
  });
}

/** Overwrite warmTheme in-place with `palette`. */
export function applyUiPalette(palette: UiPalette): void {
  Object.assign(warmTheme, normalizePaletteForLegibility(palette));
  publishThemeCssVariables();
  bumpThemeVersion();
}

/** Reset warmTheme to the default warm palette. */
export function resetUiPalette(): void {
  Object.assign(warmTheme, DEFAULT_WARM_PALETTE);
  publishThemeCssVariables();
  bumpThemeVersion();
}

/**
 * Mirror the live palette onto :root as CSS custom properties so any UI
 * surface using `var(--profile-X)` (FriendsPanel, ChatWindow, AuthPanel,
 * PlayerInformationPage globals, …) updates instantly on theme switch
 * without needing a React re-render. Names map 1:1 from camelCase to
 * --profile-kebab-case for keys that already follow that contract.
 */
function publishThemeCssVariables(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (!root) return;
  const setVar = (name: string, value: string) => {
    root.style.setProperty(name, value);
  };
  setVar('--profile-text', warmTheme.text);
  setVar('--profile-text-soft', warmTheme.textSoft);
  setVar('--profile-text-muted', warmTheme.textMuted);
  setVar('--profile-text-faint', warmTheme.textFaint);
  setVar('--profile-accent', warmTheme.accent);
  setVar('--profile-accent-soft', warmTheme.accentSoft);
  setVar('--profile-accent-deep', warmTheme.accentDeep);
  setVar('--profile-accent-glass', warmTheme.surfaceMuted);
  setVar('--profile-border', warmTheme.border);
  setVar('--profile-border-strong', warmTheme.borderStrong);
  setVar('--profile-surface', warmTheme.surface);
  setVar('--profile-surface-strong', warmTheme.surfaceStrong);
  setVar('--profile-surface-muted', warmTheme.surfaceMuted);
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