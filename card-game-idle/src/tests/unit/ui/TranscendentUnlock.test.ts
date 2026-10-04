import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { defaultGameState, useStore } from '@/state/store';
import { useTranscendentUnlockStore } from '@/state/transcendentUnlockStore';
import { FORGE_CARD_LORE, FORGE_CARD_SHARD_COST } from '@/data/forge/forgeDefinitions';
import { ABILITY_DEFINITIONS, getAbilityMaterialCost } from '@/data/abilities/abilityDefinitions';
import TranscendentUnlockScreen, { TranscendentUnlockCeremony } from '@/ui/components/TranscendentUnlockScreen';

const cardId = FORGE_CARD_LORE[0].definitionId;
const ability = ABILITY_DEFINITIONS.find(entry => entry.setId === 'Transcendent')!;
const previousActEnvironment = Object.getOwnPropertyDescriptor(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
beforeAll(() => Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }));
afterAll(() => {
  if (previousActEnvironment) Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', previousActEnvironment);
  else Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

beforeEach(() => {
  useStore.getState().loadState(structuredClone(defaultGameState));
  useStore.setState(state => ({ progress: {
    ...state.progress, forgeOfTranscendenceUnlocked: true, shardsOfTranscendence: 1_000, divineLight: 100_000_000,
  } }));
});
afterEach(() => useTranscendentUnlockStore.getState().clear());

describe('Transcendent acquisition ceremonies', () => {
  it('queues a first-copy ceremony only after a successful paid shard claim', () => {
    expect(useStore.getState().purchaseForgeCardWithShards(cardId)).toBe(true);
    expect(useTranscendentUnlockStore.getState().queue).toEqual([{ kind: 'card', definitionId: cardId, firstCopy: true, totalOwned: 1 }]);
    expect(useStore.getState().progress.shardsOfTranscendence).toBe(1_000 - FORGE_CARD_SHARD_COST);
    expect(useStore.getState().progress.transcendentCollection?.[cardId]).toBe(1);
  });

  it('queues a distinct +1 ceremony for the second and later copies', () => {
    for (let count = 1; count <= 3; count++) {
      expect(useStore.getState().purchaseForgeCardWithShards(cardId)).toBe(true);
      expect(useTranscendentUnlockStore.getState().queue.at(-1)).toEqual({
        kind: 'card', definitionId: cardId, firstCopy: count === 1, totalOwned: count,
      });
    }
    useTranscendentUnlockStore.getState().dismiss();
    expect(useTranscendentUnlockStore.getState().queue[0]).toMatchObject({ firstCopy: false, totalOwned: 2 });
  });

  it('does not replay first-copy ceremony for historical ownership', () => {
    useStore.setState(state => ({ progress: { ...state.progress, everCollection: { [cardId]: 1 } } }));
    useStore.getState().purchaseForgeCardWithShards(cardId);
    expect(useTranscendentUnlockStore.getState().queue[0]).toMatchObject({ firstCopy: false });
  });

  it('does not celebrate rejected shard purchases', () => {
    useStore.setState(state => ({ progress: { ...state.progress, shardsOfTranscendence: 0 } }));
    expect(useStore.getState().purchaseForgeCardWithShards(cardId)).toBe(false);
    expect(useStore.getState().purchaseForgeCardWithShards('invalid')).toBe(false);
    expect(useTranscendentUnlockStore.getState().queue).toHaveLength(0);
  });

  it('celebrates each Transcendent ability only on successful first materialization', () => {
    for (const entry of ABILITY_DEFINITIONS.filter(entry => entry.setId === 'Transcendent')) {
      const before = useStore.getState().progress.shardsOfTranscendence!;
      expect(useStore.getState().purchaseAbility(entry.id)).toBe(true);
      expect(useTranscendentUnlockStore.getState().queue.at(-1)).toEqual({ kind: 'ability', abilityId: entry.id });
      expect(useStore.getState().progress.shardsOfTranscendence).toBe(before - getAbilityMaterialCost(entry).shardsOfTranscendence!);
      expect(useStore.getState().purchaseAbility(entry.id)).toBe(false);
    }
    expect(useTranscendentUnlockStore.getState().queue).toHaveLength(4);
  });

  it('does not celebrate unaffordable ability materialization', () => {
    useStore.setState(state => ({ progress: { ...state.progress, divineLight: 0 } }));
    expect(useStore.getState().purchaseAbility(ability.id)).toBe(false);
    expect(useTranscendentUnlockStore.getState().queue).toHaveLength(0);
  });

  it('clears ephemeral ceremonies on load and reset', () => {
    useStore.getState().purchaseForgeCardWithShards(cardId);
    useStore.getState().loadState(structuredClone(defaultGameState));
    expect(useTranscendentUnlockStore.getState().queue).toHaveLength(0);
    useTranscendentUnlockStore.getState().enqueue({ kind: 'ability', abilityId: ability.id });
    useStore.getState().resetToDefault();
    expect(useTranscendentUnlockStore.getState().queue).toHaveLength(0);
  });

  it('renders complete framed holofoil card and explicit +1 copy variant', () => {
    const html = renderToStaticMarkup(createElement(TranscendentUnlockCeremony, {
      unlock: { kind: 'card', definitionId: cardId, firstCopy: false, totalOwned: 2 }, onContinue: () => {},
    }));
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('transcendent-unlock-duplicate');
    expect(html).toContain('transcendent-unlock-plus');
    expect(html).toContain('>+1<');
    expect(html).toContain('Transcendant%20Card%20Front%20Frame.png');
    expect(html).toContain('live-card-shimmer-transcendent');
    expect(html).toContain('2 copies owned');
  });

  it('renders ability artwork, rules and equip instructions', () => {
    const html = renderToStaticMarkup(createElement(TranscendentUnlockCeremony, {
      unlock: { kind: 'ability', abilityId: ability.id }, onContinue: () => {},
    }));
    expect(html).toContain('Transcendent Power Awakened');
    expect(html).toContain(`${ability.iconAssetKey}.png`);
    expect(html).toContain('Deck Builder ability loadout');
    expect(html).not.toContain('transcendent-unlock-plus');
  });

  it('portals the ceremony as a separate screen, focuses Continue and dismisses explicitly', async () => {
    const host = document.createElement('div');
    const previous = document.createElement('button');
    document.body.append(host, previous);
    previous.focus();
    const root = createRoot(host);
    try {
      useTranscendentUnlockStore.getState().enqueue({ kind: 'card', definitionId: cardId, firstCopy: true, totalOwned: 1 });
      await act(async () => root.render(createElement(TranscendentUnlockScreen)));
      const dialog = document.body.querySelector('[role="dialog"]')!;
      expect(host.contains(dialog)).toBe(false);
      const button = dialog.querySelector('button')!;
      expect(document.activeElement).toBe(button);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(useTranscendentUnlockStore.getState().queue).toHaveLength(1);
      await act(async () => button.click());
      expect(document.body.querySelector('[role="dialog"]')).toBeNull();
      expect(document.activeElement).toBe(previous);
    } finally {
      await act(async () => root.unmount());
      host.remove();
      previous.remove();
    }
  });
});
