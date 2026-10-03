import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TutorialModal from '@/ui/menus/TutorialModal';
import { TUTORIAL_SECTIONS, RARITY_TIERS } from '@/data/tutorialContent';
import { ABILITY_DEFINITIONS } from '@/data/abilities/abilityDefinitions';
import { CUSTOM_MAIN_MENU_BACKGROUND_REWARDS } from '@/data/profile/customMainMenuBackgrounds';
import { CROWN_BACKGROUND_REWARDS } from '@/data/profile/crownBackgroundRewards';
import { ACHIEVEMENT_CATEGORIES } from '@/systems/progression/achievementCategories';
import { applyUiPalette, DEFAULT_WARM_PALETTE, getUiColorModePalette, resetUiPalette } from '@/ui/theme';

describe('Codex tutorial navigation', () => {
  let container: HTMLDivElement;
  let root: Root;
  const onClose = vi.fn();

  beforeEach(async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    onClose.mockClear();
    await act(async () => root.render(createElement(TutorialModal, { onClose })));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    resetUiPalette();
    vi.unstubAllGlobals();
  });

  async function click(element: Element | null) {
    expect(element).not.toBeNull();
    await act(async () => (element as HTMLElement).click());
  }

  it('keeps every topic, builds a matching page index, and preserves live reference data', async () => {
    expect(container.querySelectorAll('.codex-topic')).toHaveLength(TUTORIAL_SECTIONS.length);
    expect(container.querySelector('[role="dialog"]')?.getAttribute('aria-labelledby')).toBe('codex-title');
    for (const section of TUTORIAL_SECTIONS) {
      await click(Array.from(container.querySelectorAll('.codex-topic')).find(button =>
        button.textContent?.includes(section.label),
      ) ?? null);
      expect(container.querySelector('#codex-topic-title')?.textContent).toBe(section.title);
      expect(container.querySelector('.codex-article-heading p')?.textContent).toBe(section.subtitle);
      expect(container.querySelectorAll('.codex-block-heading').length).toBeGreaterThan(0);
      const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('.codex-index a'));
      expect(links).toHaveLength(container.querySelectorAll('.codex-block-heading').length);
      for (const link of links) {
        expect(container.querySelector(link.getAttribute('href')!)?.textContent).toBe(link.textContent);
      }
      if (section.id === 'sets') {
        expect(container.querySelectorAll('.codex-ability')).toHaveLength(ABILITY_DEFINITIONS.length);
        for (const ability of ABILITY_DEFINITIONS) {
          expect(container.querySelector('.codex-content')?.textContent).toContain(ability.description);
        }
      }
      if (section.id === 'rarities') {
        expect(container.querySelectorAll('.codex-rarity-row')).toHaveLength(RARITY_TIERS.length);
      }
    }
    expect(container.querySelector('progress')?.value).toBe(TUTORIAL_SECTIONS.length);
  });

  it('supports sequential chapters, resets scroll, and counts unique topics only', async () => {
    const article = container.querySelector<HTMLElement>('.codex-article')!;
    article.scrollTop = 250;
    await click(container.querySelector('.codex-next'));
    expect(container.querySelector('#codex-topic-title')?.textContent).toBe('Turn Flow');
    expect(article.scrollTop).toBe(0);
    expect(container.querySelector('progress')?.value).toBe(2);
    await click(container.querySelector('.codex-pagination button'));
    expect(container.querySelector('#codex-topic-title')?.textContent).toBe('How To Play');
    expect(container.querySelector('progress')?.value).toBe(2);
    await click(container.querySelector('.codex-close'));
    expect(onClose).toHaveBeenCalledOnce();
    await act(async () => container.querySelector('.codex-close')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    ));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('documents current cosmetics, achievement organization, and profile appearance in both modes', async () => {
    await click(Array.from(container.querySelectorAll('.codex-topic')).find(button =>
      button.textContent?.includes('Progression'),
    ) ?? null);
    for (const mode of ['light', 'dark'] as const) {
      await act(async () => applyUiPalette(getUiColorModePalette(DEFAULT_WARM_PALETTE, mode)));
      const copy = container.querySelector('.codex-content')!.textContent!;
      expect(copy).toContain(`${ACHIEVEMENT_CATEGORIES.length} subcategories`);
      expect(copy).toContain('Ready to claim');
      expect(copy).toContain('up to 24 characters');
      expect(copy).toContain('up to 200 characters');
      expect(copy).toContain('Save UI Theme');
      expect(copy).toContain('Reduced motion switches swatches without fading');
      expect(copy).toContain('Their artwork is installed');
      expect(copy).toContain('it is not required to equip the art');
      expect(copy).toContain('not by Light, Dark, or Ain Soph Aur');
      expect(copy).not.toContain('custom theme from the Settings');
      for (const reward of [...CROWN_BACKGROUND_REWARDS, ...CUSTOM_MAIN_MENU_BACKGROUND_REWARDS]) {
        expect(copy).toContain(reward.name);
        expect(copy).toContain(reward.requirement);
      }
    }
    await click(Array.from(container.querySelectorAll('.codex-topic')).find(button =>
      button.textContent?.includes('Modes'),
    ) ?? null);
    const modeCopy = container.querySelector('.codex-content')!.textContent!;
    expect(modeCopy).toContain('current boss sets are Neutrality and Causality');
    expect(modeCopy).not.toContain('Pyroabyss');
    expect(modeCopy).not.toContain('Intensity');
  });

  it('filters topics without discarding the current chapter and reports empty search results', async () => {
    const input = container.querySelector<HTMLInputElement>('input[type="search"]')!;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    async function search(value: string) {
      await act(async () => {
        setter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }
    await search('forge');
    expect(container.querySelectorAll('.codex-topic')).toHaveLength(1);
    expect(container.querySelector('.codex-topic')?.textContent).toContain('Forge');
    expect(container.querySelector('#codex-topic-title')?.textContent).toBe('How To Play');
    await search('not-a-topic');
    expect(container.querySelectorAll('.codex-topic')).toHaveLength(0);
    expect(container.querySelector('[role="status"]')?.textContent).toBe('No topics match your search.');
    await search('');
    expect(container.querySelectorAll('.codex-topic')).toHaveLength(TUTORIAL_SECTIONS.length);
  });

  it('preserves the active chapter and copy when switching appearance modes', async () => {
    await click(container.querySelector('.codex-next'));
    const content = container.querySelector('.codex-content')!.textContent;
    await act(async () => applyUiPalette(getUiColorModePalette(DEFAULT_WARM_PALETTE, 'light')));
    expect(container.querySelector('.codex-content')!.textContent).toBe(content);
    expect(container.querySelector('#codex-topic-title')?.textContent).toBe('Turn Flow');
    await act(async () => applyUiPalette(DEFAULT_WARM_PALETTE));
    expect(container.querySelector('.codex-content')!.textContent).toBe(content);
  });
});
