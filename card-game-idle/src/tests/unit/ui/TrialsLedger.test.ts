import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import { defaultQuestState, refreshQuestRotation, getScaledQuestDivineLight } from '@/systems/progression/quests';
import { computeGlobalResonanceScore } from '@/systems/progression/cardMastery';
import QuestsModal from '@/ui/menus/QuestsModal';
import { applyUiPalette, DEFAULT_WARM_PALETTE, getUiColorModePalette, resetUiPalette } from '@/ui/theme';

describe.each(['light', 'dark'] as const)('Trials Ledger in %s mode', mode => {
  const original = useStore.getState();
  let host: HTMLDivElement;
  let root: Root;
  const close = vi.fn();

  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    close.mockClear();
    const progress = structuredClone(defaultGameState.progress);
    progress.quests = refreshQuestRotation(defaultQuestState(), Date.now());
    progress.quests.daily[0].progress = progress.quests.daily[0].goal;
    progress.quests.weekly[0].progress = progress.quests.weekly[0].goal;
    useStore.setState({ progress, settings: { ...original.settings, buttonColorMode: mode } });
    applyUiPalette(getUiColorModePalette(DEFAULT_WARM_PALETTE, mode));
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    await act(async () => root.render(createElement(QuestsModal, { onClose: close })));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    useStore.setState(original, true);
    resetUiPalette();
    vi.unstubAllGlobals();
  });

  async function selectTab(label: string) {
    const tab = [...host.querySelectorAll<HTMLButtonElement>('.trials-tab')].find(button => button.textContent?.startsWith(label))!;
    await act(async () => tab.click());
    expect(tab.getAttribute('aria-pressed')).toBe('true');
    expect(close).not.toHaveBeenCalled();
  }

  it('shows actual rotating objectives, progress and scaled reward values across tabs', async () => {
    const state = useStore.getState();
    expect(host.querySelectorAll('[data-quest-id]')).toHaveLength(5);
    expect(host.querySelector('.trials-claim-all')?.textContent).toContain('(2)');
    const quest = state.progress.quests.daily[0];
    const card = host.querySelector(`[data-quest-id="${quest.id}"]`)!;
    expect(card.textContent).toContain(quest.text);
    expect(card.textContent).toContain(`${getScaledQuestDivineLight(quest.divineLightReward ?? 0, computeGlobalResonanceScore(state.progress)).toLocaleString()} Divine Light`);
    expect(card.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe(String(quest.goal));
    expect(card.querySelector<HTMLButtonElement>('button')?.disabled).toBe(false);
    expect(host.querySelectorAll('.trials-card button:disabled')).toHaveLength(4);
    await selectTab('Weekly');
    expect(host.querySelectorAll('[data-quest-id]')).toHaveLength(4);
    for (const weekly of state.progress.quests.weekly) expect(host.querySelector(`[data-quest-id="${weekly.id}"]`)?.textContent).toContain(weekly.text);
    expect(useStore.getState().progress).toBe(state.progress);
  });

  it('claims an individual reward using the existing store action only once', async () => {
    const before = useStore.getState().progress;
    const quest = before.quests.daily[0];
    const reward = getScaledQuestDivineLight(quest.divineLightReward ?? 0, computeGlobalResonanceScore(before));
    const button = host.querySelector<HTMLButtonElement>(`[data-quest-id="${quest.id}"] button`)!;
    await act(async () => button.click());
    expect(useStore.getState().progress.divineLight).toBe(before.divineLight + reward);
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe('Claimed');
    await act(async () => button.click());
    expect(useStore.getState().progress.divineLight).toBe(before.divineLight + reward);
  });

  it('claims ready daily and weekly rewards together without claiming unfinished objectives', async () => {
    const before = useStore.getState().progress;
    const ready = [before.quests.daily[0], before.quests.weekly[0]];
    const light = ready.reduce((sum, q) => sum + getScaledQuestDivineLight(q.divineLightReward ?? 0, computeGlobalResonanceScore(before)), 0);
    const shards = ready.reduce((sum, q) => sum + q.shardReward, 0);
    await act(async () => host.querySelector<HTMLButtonElement>('.trials-claim-all')!.click());
    const after = useStore.getState().progress;
    expect(after.divineLight).toBe(before.divineLight + light);
    expect(after.aberratedShards).toBe(before.aberratedShards + shards);
    expect([...after.quests.daily, ...after.quests.weekly].filter(q => q.claimed)).toHaveLength(2);
    expect(host.querySelector<HTMLButtonElement>('.trials-claim-all')!.disabled).toBe(true);
  });

  it('keeps Super Weekly locked until all weekly rewards are claimed, then activates the existing bosses', async () => {
    await selectTab('Super Weekly');
    expect(host.querySelectorAll('.trials-boss')).toHaveLength(2);
    expect(host.querySelector<HTMLButtonElement>('.trials-super-action button')!.disabled).toBe(true);
    await act(async () => {
      const progress = structuredClone(useStore.getState().progress);
      progress.quests.weekly.forEach(q => { q.progress = q.goal; q.claimed = true; });
      useStore.setState({ progress });
    });
    const before = useStore.getState().progress;
    const bosses = before.quests.superWeeklies!.map(challenge => challenge.bossId);
    expect(host.querySelectorAll('.trials-step.is-complete')).toHaveLength(2);
    const button = host.querySelector<HTMLButtonElement>('.trials-super-action button')!;
    expect(button.disabled).toBe(false);
    await act(async () => button.click());
    const after = useStore.getState().progress;
    expect(after.quests.superWeeklies!.map(challenge => challenge.bossId)).toEqual(bosses);
    expect(after.quests.superWeeklies!.every(challenge => challenge.active)).toBe(true);
    expect(after.quests.weekly).toEqual(before.quests.weekly);
    expect(host.querySelectorAll('.trials-step.is-complete')).toHaveLength(3);
    expect(host.querySelector('.trials-super-action button')).toBeNull();
  });

  it('preserves the close action without treating tab or card interactions as dismissal', async () => {
    await selectTab('Weekly');
    await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Close Challenges"]')!.click());
    expect(close).toHaveBeenCalledTimes(1);
  });
});
