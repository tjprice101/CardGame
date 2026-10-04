import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DailyRewardModal from '@/ui/profile/DailyRewardModal';
import { useStore } from '@/state/store';
import { FORGE_WHEEL_PRIZES } from '@/data/forge/forgeDefinitions';
import { getLocalDayIndex } from '@/systems/progression/dailyLogin';
import { useTranscendentUnlockStore } from '@/state/transcendentUnlockStore';
import { eventBus } from '@/core/events/EventBus';
import { applyUiPalette, DEFAULT_WARM_PALETTE, getUiColorModePalette, resetUiPalette } from '@/ui/theme';

describe.each(['light', 'dark'] as const)('daily reward readability in %s mode', mode => {
  const original = useStore.getState();
  let host: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    useStore.setState({
      settings: { ...original.settings, buttonColorMode: mode },
      progress: { ...original.progress, forgeOfTranscendenceUnlocked: true },
    });
    applyUiPalette(getUiColorModePalette(DEFAULT_WARM_PALETTE, mode));
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    useStore.setState(original, true);
    resetUiPalette();
    vi.unstubAllGlobals();
  });

  it('uses an opaque mode-correct backdrop and a readable theme foreground', async () => {
    await act(async () => root.render(createElement(DailyRewardModal, { onClose: () => {}, onOpenForge: () => {} })));
    const screen = host.querySelector<HTMLElement>('.login-calendar-screen')!;
    expect(screen.style.getPropertyValue('--calendar-base')).toBe(mode === 'light' ? '#ffffff' : '#000000');
    const css = readFileSync(join(process.cwd(), 'src', 'styles', 'animations.css'), 'utf8');
    expect(css).toContain('background-color: var(--calendar-base, #000000);');
    expect(css).toMatch(/\.login-wheel-prize-row strong \{ color: var\(--calendar-text\); font-size: 13px;/);
  });

  it('matches wheel slices to odds badges without changing prize weights or reward labels', async () => {
    await act(async () => root.render(createElement(DailyRewardModal, { onClose: () => {}, onOpenForge: () => {} })));
    const tab = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(button => button.textContent?.includes('Wheel'))!;
    await act(async () => tab.click());
    const segments = host.querySelectorAll('.login-wheel-rotor > g');
    const rows = host.querySelectorAll('.login-wheel-prize-row');
    expect(segments).toHaveLength(FORGE_WHEEL_PRIZES.length);
    expect(rows).toHaveLength(FORGE_WHEEL_PRIZES.length);
    FORGE_WHEEL_PRIZES.forEach((prize, index) => {
      expect(segments[index].querySelector('path')!.getAttribute('fill')).toBe(prize.color);
      expect(segments[index].querySelector('text')!.getAttribute('fill')).toBe('#ffffff');
      const badge = rows[index].querySelector<HTMLElement>('b')!;
      const swatch = document.createElement('div');
      swatch.style.backgroundColor = prize.color;
      expect(badge.style.backgroundColor).toBe(swatch.style.backgroundColor);
      expect(rows[index].querySelector('strong')!.textContent).toBe(prize.label);
      expect(rows[index].querySelector('em')!.textContent).toBe(`${(prize.weight / 82 * 100).toFixed(1)}%`);
    });
    expect(new Set(FORGE_WHEEL_PRIZES.filter(prize => prize.kind === 'aberrated_shards').map(prize => prize.color)).size).toBe(1);
    expect(new Set(FORGE_WHEEL_PRIZES.map(prize => prize.color)).size).toBe(4);
  });
});

describe('Wheel of Transcendence deferred reveal', () => {
  const original = useStore.getState();
  let host: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.useFakeTimers();
    const today = getLocalDayIndex(Date.now());
    useStore.setState({
      settings: { ...original.settings, reducedMotion: false },
      toasts: [],
      progress: { ...original.progress, forgeOfTranscendenceUnlocked: true, forgeWheelSpins: 1, forgeWheelLastAccruedDayIndex: today, shardsOfTranscendence: 0 },
    });
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    useStore.setState(original, true);
    useTranscendentUnlockStore.getState().clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('spends, grants and saves immediately but hides the prize until the wheel stops', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(62 / 82);
    const saves = vi.fn();
    const unsubscribe = eventBus.on('save:immediate', saves);
    await act(async () => root.render(createElement(DailyRewardModal, { onClose: () => {}, onOpenForge: () => {} })));
    const tab = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(button => button.textContent?.includes('Wheel'))!;
    await act(async () => tab.click());
    const spin = host.querySelector<HTMLButtonElement>('.login-calendar-claim.is-wheel')!;
    await act(async () => spin.click());

    const progress = useStore.getState().progress;
    expect(progress.forgeWheelSpins).toBe(0);
    expect(progress.shardsOfTranscendence).toBe(1);
    expect(saves).toHaveBeenCalledTimes(1);
    expect(spin.disabled).toBe(true);
    expect(host.querySelector('.login-wheel-reveal')).toBeNull();
    expect(host.querySelector('.login-wheel-prize-row.is-winner')).toBeNull();
    expect(host.querySelector('.is-violet')!.textContent).toBe('0');
    expect(useStore.getState().toasts).toHaveLength(0);
    expect(useTranscendentUnlockStore.getState().queue).toEqual([]);

    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(host.querySelector('.login-wheel-reveal')).toBeNull();
    await act(async () => { vi.advanceTimersByTime(400); });
    expect(host.querySelector('.login-wheel-reveal strong')!.textContent).toBe('+1 Shard of Transcendence');
    expect(host.querySelector('.is-violet')!.textContent).toBe('1');
    expect(useStore.getState().toasts.length).toBeGreaterThan(0);
    expect(useTranscendentUnlockStore.getState().queue).toEqual([{ kind: 'shards', amount: 1, totalOwned: 1 }]);
    unsubscribe();
  });
});
