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
  titleGradient?: string;
  buttonTitleGradient?: string;
  artworkTitleGradient?: string;
  buttonSurfaceGradient?: string;
  lightButtonSurfaceGradient?: string;
}

export const DEFAULT_WARM_PALETTE: UiPalette = {
  appBackground: 'radial-gradient(circle at 50% -12%, rgba(255, 255, 255, 0.08) 0%, transparent 48%), linear-gradient(180deg, #080808 0%, #141414 48%, #000000 100%)',
  overlay: 'rgba(0, 0, 0, 0.94)',
  backdrop: 'rgba(0, 0, 0, 0.76)',
  surface: 'rgba(15, 15, 15, 0.95)',
  surfaceStrong: 'rgba(26, 26, 26, 0.98)',
  surfaceMuted: 'rgba(7, 7, 7, 0.94)',
  border: 'rgba(255, 255, 255, 0.2)',
  borderStrong: 'rgba(255, 255, 255, 0.58)',
  text: '#ffffff',
  textSoft: 'rgba(255, 255, 255, 0.92)',
  textMuted: 'rgba(224, 224, 224, 0.74)',
  textFaint: 'rgba(204, 204, 204, 0.52)',
  accent: '#ffffff',
  accentSoft: '#cccccc',
  accentDeep: '#000000',
  success: '#85b879',
  danger: '#cb5b50',
  cherubim: '#d7ad63',
  shadow: '0 16px 36px rgba(0, 0, 0, 0.34)',
  glow: '0 10px 28px rgba(255, 255, 255, 0.18), 0 0 18px rgba(255, 255, 255, 0.1)',
  button: 'linear-gradient(110deg, #ffffff 0%, #dddddd 54%, #aaaaaa 100%)',
  titleGradient: 'none',
  buttonTitleGradient: 'none',
  buttonSurfaceGradient: 'none',
  lightButtonSurfaceGradient: 'none',
};

/**
 * Live UI palette. Always the same object reference. Mutated in-place by
 * `applyUiPalette` when the player switches themes; React surfaces re-render
 * via a top-level theme-version key in App.
 */
export const warmTheme: UiPalette = { ...DEFAULT_WARM_PALETTE };

type Rgba = { r: number; g: number; b: number; a: number };

export const PROFILE_COLOR_HOLD_MS = 60_000;
export const PROFILE_COLOR_FADE_MS = 3_000;

/** Rotate decorative colors while keeping the UI's reading surfaces neutral. */
export function getRotatingUiPalette(palette: UiPalette, elapsedMs: number, reducedMotion = false): UiPalette {
  const colors = [palette.accent, palette.accentSoft, palette.surfaceStrong, palette.text].map(value => {
    const color = parseColor(value);
    if (!color) throw new Error(`Invalid profile rotation color: ${value}`);
    return color;
  });
  const slotMs = PROFILE_COLOR_HOLD_MS + PROFILE_COLOR_FADE_MS;
  const elapsed = Math.max(0, elapsedMs);
  const index = Math.floor(elapsed / slotMs) % colors.length;
  const phaseMs = elapsed % slotMs;
  const blend = reducedMotion ? 0 : clamp01((phaseMs - PROFILE_COLOR_HOLD_MS) / PROFILE_COLOR_FADE_MS);
  const from = colors[index];
  const to = colors[(index + 1) % colors.length];
  const color = {
    r: from.r + (to.r - from.r) * blend,
    g: from.g + (to.g - from.g) * blend,
    b: from.b + (to.b - from.b) * blend,
    a: 1,
  };
  const tint = (strength: number, alpha = 1) => rgbaToCss({
    r: color.r * strength, g: color.g * strength, b: color.b * strength, a: alpha,
  });
  const titleTint = (white: number) => rgbaToCss({
    r: color.r * (1 - white) + 255 * white,
    g: color.g * (1 - white) + 255 * white,
    b: color.b * (1 - white) + 255 * white,
    a: 1,
  });
  const readableTitle = (white: number) => getReadableUiColor(titleTint(white), '#333333');
  const readableButtonTitle = (strength: number) => getReadableUiColor(tint(strength), '#adadad');
  return {
    ...DEFAULT_WARM_PALETTE,
    appBackground: '#000000',
    accent: rgbaToCss(color),
    accentSoft: titleTint(0.35),
    border: rgbaToCss({ ...color, a: 0.32 }),
    borderStrong: rgbaToCss({ ...color, a: 0.68 }),
    glow: `0 0 18px ${rgbaToCss({ ...color, a: 0.28 })}, 0 0 36px ${rgbaToCss({ ...color, a: 0.12 })}`,
    accentDeep: `#${[color.r, color.g, color.b].map(channel => clamp255(channel * 0.12).toString(16).padStart(2, '0')).join('')}`,
    titleGradient: `linear-gradient(110deg, ${readableTitle(0)} 0%, ${readableTitle(0.75)} 54%, ${readableTitle(0)} 100%)`,
    buttonTitleGradient: `linear-gradient(110deg, ${readableButtonTitle(0.9)} 0%, ${readableButtonTitle(0.25)} 54%, ${readableButtonTitle(0.9)} 100%)`,
    buttonSurfaceGradient: 'linear-gradient(110deg, rgba(24, 24, 24, 1) 0%, rgba(12, 12, 12, 1) 54%, rgba(0, 0, 0, 1) 100%)',
    lightButtonSurfaceGradient: 'linear-gradient(110deg, rgba(255, 255, 255, 1) 0%, rgba(244, 244, 244, 1) 54%, rgba(230, 230, 230, 1) 100%)',
  };
}

export function getUiColorModePalette(palette: UiPalette, mode: 'light' | 'dark'): UiPalette {
  const light = mode === 'light';
  const background = light ? '#e6e6e6' : '#1a1a1a';
  const accent = getReadableUiColor(palette.accent, background);
  const accentSoft = getReadableUiColor(palette.accentSoft, background);
  const color = parseColor(accent);
  if (!color) throw new Error(`Invalid UI accent color: ${accent}`);
  const neutral = {
    appBackground: light ? '#ffffff' : '#000000',
    overlay: light ? 'rgba(255, 255, 255, 0.96)' : 'rgba(0, 0, 0, 0.94)',
    backdrop: light ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.76)',
    surface: light ? 'rgba(246, 246, 246, 0.98)' : 'rgba(12, 12, 12, 0.98)',
    surfaceStrong: light ? 'rgba(255, 255, 255, 0.98)' : 'rgba(20, 20, 20, 0.98)',
    surfaceMuted: light ? 'rgba(236, 236, 236, 0.98)' : 'rgba(5, 5, 5, 0.98)',
    accent,
    accentSoft,
    border: rgbaToCss({ ...color, a: light ? 0.38 : 0.32 }),
    borderStrong: rgbaToCss({ ...color, a: 0.68 }),
    glow: `0 0 18px ${rgbaToCss({ ...color, a: 0.28 })}, 0 0 36px ${rgbaToCss({ ...color, a: 0.12 })}`,
    success: getReadableUiColor(palette.success, background),
    danger: getReadableUiColor(palette.danger, background),
  };
  if (!light) return {
    ...palette,
    ...neutral,
    text: '#ffffff',
    textSoft: 'rgba(255, 255, 255, 0.92)',
    textMuted: 'rgba(255, 255, 255, 0.78)',
    textFaint: 'rgba(255, 255, 255, 0.62)',
  };
  return {
    ...palette,
    ...neutral,
    text: '#111111',
    textSoft: 'rgba(17, 17, 17, 0.92)',
    textMuted: 'rgba(17, 17, 17, 0.88)',
    textFaint: 'rgba(17, 17, 17, 0.78)',
    shadow: '0 12px 30px rgba(0, 0, 0, 0.14)',
    buttonSurfaceGradient: palette.lightButtonSurfaceGradient ?? 'none',
    titleGradient: palette.buttonTitleGradient && palette.buttonTitleGradient !== 'none'
      ? palette.buttonTitleGradient
      : 'linear-gradient(110deg, #000000 0%, #222222 54%, #000000 100%)',
    buttonTitleGradient: palette.buttonTitleGradient && palette.buttonTitleGradient !== 'none'
      ? palette.buttonTitleGradient
      : 'linear-gradient(110deg, #000000 0%, #222222 54%, #000000 100%)',
    artworkTitleGradient: palette.titleGradient && palette.titleGradient !== 'none'
      ? palette.titleGradient
      : 'linear-gradient(110deg, #ffffff 0%, #dddddd 54%, #ffffff 100%)',
  };
}

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

export function getReadableUiColor(foreground: string, background: string): string {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  if (!fg || !bg) throw new Error(`Invalid UI contrast colors: ${foreground}, ${background}`);
  const opaqueBg = bg.a < 1 ? compositeOver(bg, { r: 20, g: 28, b: 40, a: 1 }) : bg;
  if (contrastRatio(fg, opaqueBg) >= 4.5) return foreground;
  const black = { r: 0, g: 0, b: 0, a: 1 };
  const white = { r: 255, g: 255, b: 255, a: 1 };
  const target = contrastRatio(black, opaqueBg) > contrastRatio(white, opaqueBg) ? black : white;
  let low = 0;
  let high = 1;
  let readable = target;
  for (let step = 0; step < 12; step++) {
    const blend = (low + high) / 2;
    const candidate = {
      r: clamp255(fg.r + (target.r - fg.r) * blend),
      g: clamp255(fg.g + (target.g - fg.g) * blend),
      b: clamp255(fg.b + (target.b - fg.b) * blend),
      a: 1,
    };
    if (contrastRatio(candidate, opaqueBg) >= 4.5) {
      readable = candidate;
      high = blend;
    } else {
      low = blend;
    }
  }
  return rgbaToCss(readable);
}

export function normalizeUiPalette(palette: UiPalette): UiPalette {
  const fallbackBg: Rgba = { r: 20, g: 20, b: 20, a: 1 };
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

  const chosenSoft = withAlpha(chosenText, Math.max(0.92, parseColor(palette.textSoft)?.a ?? 0.92));
  const chosenMuted = withAlpha(chosenText, Math.max(0.78, parseColor(palette.textMuted)?.a ?? 0.78));
  const chosenFaint = withAlpha(chosenText, Math.max(0.62, parseColor(palette.textFaint)?.a ?? 0.62));

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
  Object.assign(warmTheme, normalizeUiPalette(palette), {
    buttonSurfaceGradient: palette.buttonSurfaceGradient ?? 'none',
    lightButtonSurfaceGradient: palette.lightButtonSurfaceGradient ?? 'none',
  });
  warmTheme.titleGradient = palette.titleGradient ?? 'none';
  warmTheme.buttonTitleGradient = palette.buttonTitleGradient ?? 'none';
  warmTheme.artworkTitleGradient = palette.artworkTitleGradient ?? palette.titleGradient ?? 'none';
  publishThemeCssVariables();
  bumpThemeVersion();
}

/** Reset warmTheme to the default warm palette. */
export function resetUiPalette(): void {
  Object.assign(warmTheme, DEFAULT_WARM_PALETTE);
  warmTheme.artworkTitleGradient = 'none';
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
  const colorToRgbChannels = (value: string): string => {
    const color = parseColor(value);
    return color ? `${clamp255(color.r)}, ${clamp255(color.g)}, ${clamp255(color.b)}` : '255, 255, 255';
  };
  setVar('--profile-app-background', warmTheme.appBackground);
  setVar('--profile-text', warmTheme.text);
  setVar('--profile-text-soft', warmTheme.textSoft);
  setVar('--profile-text-muted', warmTheme.textMuted);
  setVar('--profile-text-faint', warmTheme.textFaint);
  setVar('--profile-accent', warmTheme.accent);
  setVar('--profile-accent-soft', warmTheme.accentSoft);
  setVar('--profile-accent-deep', warmTheme.accentDeep);
  setVar('--profile-accent-text', getReadableUiColor(warmTheme.accentDeep, warmTheme.accent));
  setVar('--profile-accent-soft-text', getReadableUiColor(warmTheme.accentDeep, warmTheme.accentSoft));
  setVar('--profile-accent-glass', warmTheme.surfaceMuted);
  setVar('--profile-border', warmTheme.border);
  setVar('--profile-border-strong', warmTheme.borderStrong);
  setVar('--profile-surface', warmTheme.surface);
  setVar('--profile-surface-strong', warmTheme.surfaceStrong);
  setVar('--profile-surface-muted', warmTheme.surfaceMuted);
  setVar('--profile-glow', warmTheme.glow);
  setVar('--profile-shadow', warmTheme.shadow);
  setVar('--profile-success', warmTheme.success);
  setVar('--profile-danger', warmTheme.danger);
  setVar('--profile-accent-rgb', colorToRgbChannels(warmTheme.accent));
  setVar('--profile-accent-soft-rgb', colorToRgbChannels(warmTheme.accentSoft));
  setVar('--profile-button', warmTheme.button);
  setVar('--profile-button-surface-gradient', warmTheme.buttonSurfaceGradient ?? 'none');
  setVar('--profile-button-text', warmTheme.accentDeep);
  setVar('--profile-title-gradient', warmTheme.titleGradient ?? 'none');
  setVar('--profile-button-title-gradient', warmTheme.buttonTitleGradient ?? 'none');
  setVar('--profile-artwork-title-gradient', warmTheme.artworkTitleGradient ?? warmTheme.titleGradient ?? 'none');
  root.toggleAttribute('data-profile-title-gradient', warmTheme.titleGradient !== 'none' && !!warmTheme.titleGradient);
  root.toggleAttribute('data-profile-button-gradient', warmTheme.buttonSurfaceGradient !== 'none' && !!warmTheme.buttonSurfaceGradient);
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