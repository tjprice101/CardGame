import { afterEach, describe, expect, it } from 'vitest';
import { UI_THEMES, getThemePreviewPalette } from '@/data/profile/uiThemes';
import {
  applyUiPalette,
  DEFAULT_WARM_PALETTE,
  getRotatingUiPalette,
  getUiColorModePalette,
  getReadableUiColor,
  normalizeUiPalette,
  PROFILE_COLOR_FADE_MS,
  PROFILE_COLOR_HOLD_MS,
  resetUiPalette,
} from '@/ui/theme';

const palette = {
  ...DEFAULT_WARM_PALETTE,
  accent: '#ff0000',
  accentSoft: '#00ff00',
  surfaceStrong: '#0000ff',
  text: '#ffffff',
};
const slotMs = PROFILE_COLOR_HOLD_MS + PROFILE_COLOR_FADE_MS;

describe('profile palette rotation', () => {
  afterEach(() => resetUiPalette());

  it('keeps all three Intensity rewards deep red, orange, black, and white throughout animation', () => {
    const themes = UI_THEMES.filter(theme => theme.setId === 'Intensity');
    expect(themes).toHaveLength(3);
    expect(new Set(themes.map(theme => theme.palette.accent)).size).toBe(3);
    const channels = (color: string): number[] => color.startsWith('#')
      ? [1, 3, 5].map(start => parseInt(color.slice(start, start + 2), 16))
      : color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    for (const theme of themes) {
      const [red, green, blue] = channels(theme.palette.accent);
      expect(red).toBeGreaterThanOrEqual(140);
      expect(red).toBeLessThanOrEqual(190);
      expect(green).toBeLessThan(25);
      expect(blue).toBeLessThan(45);
      for (const phase of [0, 0.25, 0.5, 0.75]) {
        const palette = getThemePreviewPalette(theme, theme.oscillation!.periodMs * phase);
        const [r, g, b] = channels(palette.accent);
        expect(r).toBeGreaterThan(g * 3);
        expect(r).toBeGreaterThan(b * 3);
        const [orangeR, orangeG, orangeB] = channels(palette.accentSoft);
        expect(orangeR).toBeGreaterThan(240);
        expect(orangeG).toBeGreaterThan(orangeB);
        expect(orangeG).toBeLessThan(120);
        expect(palette.surfaceStrong).toBe('rgba(8, 8, 8, 1)');
        expect(palette.text).toBe('#ffffff');
        for (const mode of ['light', 'dark'] as const) {
          for (let slot = 0; slot < 4; slot++) {
            const rotating = getRotatingUiPalette(palette, slot * slotMs);
            const effective = getUiColorModePalette(rotating, mode);
            expect(effective.appBackground).toBe(mode === 'light' ? '#ffffff' : '#000000');
            expect(getReadableUiColor(effective.accent, mode === 'light' ? '#e6e6e6' : '#1a1a1a')).toBe(effective.accent);
          }
        }
      }
    }
  });

  it('keeps every theme neutral in both modes, including all four swatches and their fades', () => {
    for (const theme of UI_THEMES) {
      const original = structuredClone(theme.palette);
      for (const source of [
        theme.palette,
        ...[0, slotMs, slotMs * 2, slotMs * 3, PROFILE_COLOR_HOLD_MS + 1500]
          .map(elapsed => getRotatingUiPalette(theme.palette, elapsed)),
      ]) {
        for (const mode of ['light', 'dark'] as const) {
          const result = getUiColorModePalette(source, mode);
          expect(result.appBackground).toBe(mode === 'light' ? '#ffffff' : '#000000');
          for (const surface of [result.surface, result.surfaceStrong, result.surfaceMuted]) {
            const [red, green, blue] = surface.match(/[\d.]+/g)!.slice(0, 3).map(Number);
            expect(red).toBe(green);
            expect(green).toBe(blue);
            expect(mode === 'light' ? red >= 230 : red <= 26).toBe(true);
          }
          const background = mode === 'light' ? '#e6e6e6' : '#1a1a1a';
          expect(getReadableUiColor(result.accent, background)).toBe(result.accent);
          expect(getReadableUiColor(result.accentSoft, background)).toBe(result.accentSoft);
          applyUiPalette(result);
          expect(document.documentElement.style.getPropertyValue('--profile-border-strong')).toBe(result.borderStrong);
          expect(document.documentElement.style.getPropertyValue('--profile-glow')).toBe(result.glow);
        }
      }
      expect(theme.palette).toEqual(original);
    }
  });

  it('keeps a personal color in borders and glows in light mode rather than replacing it with black', () => {
    const source = getRotatingUiPalette({ ...palette, accent: '#ed4477' }, 0);
    for (const mode of ['light', 'dark'] as const) {
      const result = getUiColorModePalette(source, mode);
      const channels = result.accent.match(/[\d.]+/g)!.slice(0, 3).map(Number);
      expect(Math.max(...channels) - Math.min(...channels)).toBeGreaterThan(75);
      expect(result.borderStrong).toBe(result.accent.replace(', 1)', ', 0.68)'));
      expect(result.glow).toContain(result.accent.replace(', 1)', ', 0.28)'));
    }
  });

  it('switches surfaces and heading contrast to light without replacing the rotating swatches', () => {
    for (const elapsed of [0, 61500, 63000, 126000]) {
      const dark = getRotatingUiPalette(palette, elapsed);
      const light = getUiColorModePalette(dark, 'light');
      expect(getUiColorModePalette(dark, 'dark').appBackground).toBe('#000000');
      expect(light.appBackground).toContain('#ffffff');
      expect(light.text).toBe('#111111');
      expect(light.titleGradient).toBe(dark.buttonTitleGradient);
      expect(light.artworkTitleGradient).toBe(dark.titleGradient);
      for (const surface of [light.surface, light.surfaceStrong, light.surfaceMuted]) {
        const channels = surface.match(/[\d.]+/g)!.slice(0, 3).map(Number);
        expect(channels.every(channel => channel >= 230)).toBe(true);
      }
      expect(light.buttonTitleGradient).toBe(dark.buttonTitleGradient);
    }
    const defaultLight = getUiColorModePalette(DEFAULT_WARM_PALETTE, 'light');
    expect(defaultLight.titleGradient).toBe('linear-gradient(110deg, #000000 0%, #222222 54%, #000000 100%)');
    expect(defaultLight.buttonTitleGradient).toBe(defaultLight.titleGradient);
    applyUiPalette(defaultLight);
    expect(document.documentElement.hasAttribute('data-profile-title-gradient')).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--profile-text-muted')).toBe('rgba(17, 17, 17, 0.88)');
    expect(document.documentElement.style.getPropertyValue('--profile-text-faint')).toBe('rgba(17, 17, 17, 0.78)');
  });

  it('rotates heading gradients with the same holds, fades, and reduced-motion timing', () => {
    const gradients = [
      getReadableUiColor('rgba(255, 0, 0, 1)', '#333333'),
      getReadableUiColor('rgba(0, 255, 0, 1)', '#333333'),
      getReadableUiColor('rgba(0, 0, 255, 1)', '#333333'),
      'rgba(255, 255, 255, 1)',
    ];
    for (let index = 0; index < 4; index++) {
      const start = index * slotMs;
      expect(getRotatingUiPalette(palette, start).titleGradient).toContain(gradients[index]);
      expect(getRotatingUiPalette(palette, start + PROFILE_COLOR_HOLD_MS).titleGradient)
        .toBe(getRotatingUiPalette(palette, start).titleGradient);
    }
    expect(getRotatingUiPalette(palette, PROFILE_COLOR_HOLD_MS + 1500).titleGradient)
      .toContain(getReadableUiColor('rgba(128, 128, 0, 1)', '#333333'));
    expect(getRotatingUiPalette(palette, 0).buttonTitleGradient).toContain(getReadableUiColor('rgba(230, 0, 0, 1)', '#adadad'));
    expect(getRotatingUiPalette(palette, slotMs).buttonTitleGradient).toContain(getReadableUiColor('rgba(0, 230, 0, 1)', '#adadad'));
    expect(getRotatingUiPalette(palette, PROFILE_COLOR_HOLD_MS + 1500).buttonTitleGradient)
      .toContain(getReadableUiColor('rgba(115, 115, 0, 1)', '#adadad'));
    expect(getRotatingUiPalette(palette, PROFILE_COLOR_HOLD_MS + 1500, true).titleGradient)
      .toBe(getRotatingUiPalette(palette, 0).titleGradient);
  });

  it('publishes the live heading gradient and clears it when returning to a nonrotating palette', () => {
    applyUiPalette(getRotatingUiPalette(palette, 0));
    expect(document.documentElement.style.getPropertyValue('--profile-title-gradient'))
      .toBe(getRotatingUiPalette(palette, 0).titleGradient);
    expect(document.documentElement.hasAttribute('data-profile-title-gradient')).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--profile-button-title-gradient'))
      .toBe(getRotatingUiPalette(palette, 0).buttonTitleGradient);
    expect(document.documentElement.style.getPropertyValue('--profile-button-surface-gradient'))
      .toBe(getRotatingUiPalette(palette, 0).buttonSurfaceGradient);
    expect(document.documentElement.hasAttribute('data-profile-button-gradient')).toBe(true);
    applyUiPalette(DEFAULT_WARM_PALETTE);
    expect(document.documentElement.style.getPropertyValue('--profile-title-gradient')).toBe('none');
    expect(document.documentElement.hasAttribute('data-profile-title-gradient')).toBe(false);
    expect(document.documentElement.hasAttribute('data-profile-button-gradient')).toBe(false);
    expect(document.documentElement.style.getPropertyValue('--profile-button-surface-gradient')).toBe('none');
  });

  it('holds each of the four profile swatches for a full minute', () => {
    const accents = ['rgba(255, 0, 0, 1)', 'rgba(0, 255, 0, 1)', 'rgba(0, 0, 255, 1)', 'rgba(255, 255, 255, 1)'];
    for (let index = 0; index < 4; index++) {
      const start = index * slotMs;
      expect(getRotatingUiPalette(palette, start).accent).toBe(accents[index]);
      expect(getRotatingUiPalette(palette, start + PROFILE_COLOR_HOLD_MS).accent).toBe(accents[index]);
    }
  });

  it('keeps chromatic swatches saturated in text and ornaments, not button surfaces', () => {
    const stops = (gradient: string) => [...gradient.matchAll(/rgba\(([\d, ]+), 1\)/g)]
      .map(match => match[1].split(',').map(Number));
    const chroma = (channels: number[]) => Math.max(...channels) - Math.min(...channels);
    for (const elapsed of [0, slotMs, slotMs * 2]) {
      const dark = getRotatingUiPalette(palette, elapsed);
      const light = getUiColorModePalette(dark, 'light');
      expect(stops(dark.titleGradient!).some(stop => chroma(stop) >= 100)).toBe(true);
      expect(stops(light.titleGradient!).some(stop => chroma(stop) >= 75)).toBe(true);
      expect(stops(dark.buttonSurfaceGradient!).every(stop => chroma(stop) === 0)).toBe(true);
      expect(stops(light.buttonSurfaceGradient!).every(stop => chroma(stop) === 0)).toBe(true);
      expect(dark.border).toBe(dark.accent.replace(', 1)', ', 0.32)'));
      expect(dark.glow).toContain(dark.accent.replace(', 1)', ', 0.28)'));
      expect(light.buttonSurfaceGradient).toBe(dark.lightButtonSurfaceGradient);
    }
  });

  it('publishes contrast-safe accent pill text in both modes throughout rotation', () => {
    const rgb = (value: string): number[] => value.startsWith('#')
      ? value.slice(1).match(/.{2}/g)!.map(channel => parseInt(channel, 16))
      : value.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    const luminance = (value: string) => rgb(value).reduce((sum, channel, index) => {
      const normalized = channel / 255;
      const linear = normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      return sum + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
    const contrast = (foreground: string, background: string) => {
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    for (const mode of ['light', 'dark'] as const) {
      for (let elapsed = 0; elapsed <= slotMs * 4; elapsed += 500) {
        const result = normalizeUiPalette(getUiColorModePalette(getRotatingUiPalette(palette, elapsed), mode));
        applyUiPalette(result);
        for (const [role, background] of [
          ['--profile-accent-text', result.accent],
          ['--profile-accent-soft-text', result.accentSoft],
        ]) {
          const foreground = document.documentElement.style.getPropertyValue(role);
          expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
        }
        for (const color of ['#ffffff', '#ffd700', '#e6c9ff', '#9be8a8', '#ff9f9f']) {
          expect(contrast(getReadableUiColor(color, result.surfaceStrong), result.surfaceStrong))
            .toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('retains readable semantic colors and reports invalid contrast inputs', () => {
    expect(getReadableUiColor('#ffffff', '#000000')).toBe('#ffffff');
    expect(getReadableUiColor('#111111', '#ffffff')).toBe('#111111');
    expect(() => getReadableUiColor('not-a-color', '#ffffff')).toThrow('Invalid UI contrast colors');
  });

  it('fades after the hold and wraps from the fourth color back to the first', () => {
    expect(getRotatingUiPalette(palette, PROFILE_COLOR_HOLD_MS + PROFILE_COLOR_FADE_MS / 2).accent)
      .toBe('rgba(128, 128, 0, 1)');
    expect(getRotatingUiPalette(palette, slotMs * 4)).toEqual(getRotatingUiPalette(palette, 0));
  });

  it('synchronizes colored accents and button text while retaining black backgrounds', () => {
    const result = getRotatingUiPalette(palette, 0);
    expect(result.appBackground).toBe('#000000');
    expect(result.accentDeep).toBe('#1f0000');
    expect(result.text).toBe('#ffffff');
    expect(result.accent).toBe('rgba(255, 0, 0, 1)');
    expect(result.button).toBe(DEFAULT_WARM_PALETTE.button);
    expect(palette.accent).toBe('#ff0000');
  });

  it('switches without fading when reduced motion is enabled', () => {
    expect(getRotatingUiPalette(palette, PROFILE_COLOR_HOLD_MS + 1500, true).accent)
      .toBe('rgba(255, 0, 0, 1)');
    expect(getRotatingUiPalette(palette, slotMs, true).accent).toBe('rgba(0, 255, 0, 1)');
  });

  it.each([
    palette,
    { ...palette, accent: '#000000', accentSoft: '#111111', surfaceStrong: '#ffffff', text: '#ffff00' },
  ])('maintains at least 4.5:1 contrast for heading stops, text, and button labels throughout the cycle (%#)', candidate => {
    const luminance = (channels: number[]) => channels.reduce((sum, channel, index) => {
      const value = channel / 255;
      const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      return sum + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
    for (let elapsed = 0; elapsed <= slotMs * 4; elapsed += 500) {
      const result = getRotatingUiPalette(candidate, elapsed);
      const surface = result.surfaceStrong.match(/[\d.]+/g)!.slice(0, 3).map(Number);
      const label = result.accentDeep.slice(1).match(/.{2}/g)!.map(channel => parseInt(channel, 16));
      const stops = [...result.titleGradient!.matchAll(/rgba\(([\d, ]+), 1\)/g)];
      expect(stops).toHaveLength(3);
      for (const stop of stops) {
        const channels = stop[1].split(',').map(Number);
        expect((luminance(channels) + 0.05) / (luminance(surface) + 0.05)).toBeGreaterThanOrEqual(4.5);
      }
      const buttonStops = [...result.buttonTitleGradient!.matchAll(/rgba\(([\d, ]+), 1\)/g)];
      expect(buttonStops).toHaveLength(3);
      for (const stop of buttonStops) {
        const channels = stop[1].split(',').map(Number);
        expect((luminance([173, 173, 173]) + 0.05) / (luminance(channels) + 0.05)).toBeGreaterThanOrEqual(4.5);
      }
      const darkButtonStops = [...result.buttonSurfaceGradient!.matchAll(/rgba\(([\d, ]+), 1\)/g)];
      const lightButtonStops = [...result.lightButtonSurfaceGradient!.matchAll(/rgba\(([\d, ]+), 1\)/g)];
      for (const stop of stops) {
        for (const background of darkButtonStops) {
          expect((luminance(stop[1].split(',').map(Number)) + 0.05) /
            (luminance(background[1].split(',').map(Number)) + 0.05)).toBeGreaterThanOrEqual(4.5);
        }
      }
      for (const stop of buttonStops) {
        for (const background of lightButtonStops) {
          expect((luminance(background[1].split(',').map(Number)) + 0.05) /
            (luminance(stop[1].split(',').map(Number)) + 0.05)).toBeGreaterThanOrEqual(4.5);
        }
      }
      expect(1.05 / (luminance(surface) + 0.05)).toBeGreaterThanOrEqual(4.5);
      const muted = surface.map(channel => 224 * 0.74 + channel * (1 - 0.74));
      expect((luminance(muted) + 0.05) / (luminance(surface) + 0.05)).toBeGreaterThanOrEqual(4.5);
      expect((luminance([170, 170, 170]) + 0.05) / (luminance(label) + 0.05)).toBeGreaterThanOrEqual(4.5);
      const light = normalizeUiPalette(getUiColorModePalette(result, 'light'));
      const lightStops = [...light.titleGradient!.matchAll(/rgba\(([\d, ]+), 1\)/g)];
      expect(lightStops).toHaveLength(3);
      for (const background of [light.surface, light.surfaceStrong, light.surfaceMuted]) {
        const channels = background.match(/[\d.]+/g)!.slice(0, 3).map(Number);
        for (const stop of lightStops) {
          expect((luminance(channels) + 0.05) / (luminance(stop[1].split(',').map(Number)) + 0.05))
            .toBeGreaterThanOrEqual(4.5);
        }
        for (const role of [light.text, light.textSoft, light.textMuted, light.textFaint]) {
          const foreground = role.match(/[\d.]+/g)!.map(Number);
          const alpha = foreground[3] ?? 1;
          const text = channels.map((channel, index) => foreground[index] * alpha + channel * (1 - alpha));
          expect((luminance(channels) + 0.05) / (luminance(text) + 0.05)).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});
