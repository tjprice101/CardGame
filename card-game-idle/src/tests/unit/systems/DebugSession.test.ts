import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LZString from 'lz-string';
import { defaultGameState, useStore } from '@/state/store';
import { CardRegistry } from '@/cards/CardRegistry';
import { ABILITY_DEFINITIONS } from '@/data/abilities/abilityDefinitions';
import { BOSS_DEFINITIONS, isBossUnlocked } from '@/data/bosses/bossDefinitions';
import { AVATARS, isAvatarUnlocked } from '@/data/profile/avatars';
import { UI_THEMES, isThemeUnlocked } from '@/data/profile/uiThemes';
import { isHoloOnlyCard, getNormalOwnedCopies } from '@/systems/progression/HolofoilSystem';
import { getPersistentGameState, isDebugSessionActive } from '@/core/debugSession';
import { getSupabase } from '@/net/supabaseClient';
import { SaveManager } from '@/save/SaveManager';
import type { SaveStorage } from '@/save/storage';
import type { GameState } from '@/types/game';
import { installDebugShortcut } from '@/ui/useDebugShortcut';

function memoryStorage(): SaveStorage {
  let saved: string | null = null;
  return { read: () => saved, write: value => { saved = value; }, remove: () => { saved = null; } };
}

function readPayload(storage: SaveStorage): GameState & { debugMode?: boolean } {
  const envelope = JSON.parse(storage.read()!) as { p: string };
  return JSON.parse(LZString.decompressFromUTF16(envelope.p)!);
}

describe('temporary full Debug session', () => {
  beforeEach(() => useStore.getState().loadState(structuredClone(defaultGameState)));
  afterEach(() => {
    useStore.getState().exitDebugMode();
    vi.useRealTimers();
  });

  it('grants every registered card with valid normal/holo and premium ownership', () => {
    useStore.getState().activateDebugMode();
    const { progress, debugMode } = useStore.getState();
    expect(debugMode).toBe(true);
    for (const definition of CardRegistry.getAll()) {
      const id = definition.definitionId;
      expect(progress.holoCollection[id], id).toBeGreaterThanOrEqual(8);
      expect(progress.collection[id], id).toBeGreaterThanOrEqual(progress.holoCollection[id]);
      if (!isHoloOnlyCard(definition)) {
        expect(getNormalOwnedCopies(definition, progress.collection, progress.holoCollection), id).toBeGreaterThanOrEqual(8);
      } else {
        expect(progress.collection[id], id).toBe(progress.holoCollection[id]);
      }
      if (definition.rarity === 'Infinite') expect(progress.infiniteCollection[id], id).toBe(progress.collection[id]);
      if (definition.rarity === 'Transcendent') expect(progress.transcendentCollection?.[id], id).toBe(progress.collection[id]);
    }
    for (const ability of ABILITY_DEFINITIONS) expect(progress.ownedAbilities?.[ability.id], ability.id).toBe(true);
  });

  it('satisfies progression menu, boss and cosmetic gates without manufacturing art', () => {
    useStore.getState().activateDebugMode();
    const { progress } = useStore.getState();
    expect(progress.totalPacksOpened).toBeGreaterThanOrEqual(10);
    const owned = CardRegistry.getAll().filter(card => progress.collection[card.definitionId] > 0);
    expect(owned.filter(card => card.rarity === 'Enigmatic').length).toBeGreaterThanOrEqual(3);
    expect(owned.filter(card => card.rarity === 'Eternal').length).toBeGreaterThanOrEqual(5);
    expect(progress.forgeOfTranscendenceUnlocked).toBe(true);
    for (const boss of BOSS_DEFINITIONS) expect(isBossUnlocked(progress, boss.id), boss.id).toBe(true);
    for (const avatar of AVATARS) expect(isAvatarUnlocked(avatar.id, progress), avatar.id).toBe(true);
    for (const theme of UI_THEMES) expect(isThemeUnlocked(theme.id, progress), theme.id).toBe(true);
    expect(progress.emberglass).toBeGreaterThan(0);
    expect(progress.divineLight).toBeLessThan(Infinity);
    expect(getSupabase()).toBeNull();
  });

  it('is idempotent and restores normal progress, deck, board and settings after debug changes', () => {
    const original = structuredClone(getPersistentGameState(useStore.getState()).progress);
    const originalDeck = structuredClone(useStore.getState().deck);
    const originalBoard = structuredClone(useStore.getState().board);
    const originalSettings = structuredClone(useStore.getState().settings);
    useStore.getState().activateDebugMode();
    useStore.getState().activateDebugMode();
    useStore.setState(state => ({ progress: { ...state.progress, divineLight: 1 }, settings: { ...state.settings, musicVolume: 0 } }));
    expect(getPersistentGameState(useStore.getState()).progress).toEqual(original);
    useStore.getState().exitDebugMode();
    expect(useStore.getState().progress).toEqual(original);
    expect(useStore.getState().deck).toEqual(originalDeck);
    expect(useStore.getState().board).toEqual(originalBoard);
    expect(useStore.getState().settings).toEqual(originalSettings);
    expect(isDebugSessionActive()).toBe(false);
    expect(useStore.getState().debugMode).toBe(false);
  });

  it.each(['save', 'saveAsync'] as const)('%s persists the normal snapshot, never debug grants', async method => {
    vi.useFakeTimers();
    const storage = memoryStorage();
    const manager = new SaveManager(() => useStore.getState(), storage);
    const original = structuredClone(useStore.getState().progress);
    useStore.getState().activateDebugMode();
    manager[method]();
    await vi.runAllTimersAsync();
    expect(readPayload(storage).progress).toEqual(original);
    expect(readPayload(storage).debugMode).toBeUndefined();
    manager.stopAutoSave();
  });

  it('export with no previous save exports the normal snapshot', () => {
    const storage = memoryStorage();
    const manager = new SaveManager(() => useStore.getState(), storage);
    const original = structuredClone(useStore.getState().progress.collection);
    useStore.getState().activateDebugMode();
    const exported = manager.exportSave();
    if (!exported) throw new Error('Debug export did not produce a save');
    expect(exported.startsWith('PANTHEON1:')).toBe(true);
    expect(manager.importSave(exported)?.state.progress.collection).toEqual(original);
    manager.stopAutoSave();
  });

  it.each(['load', 'reset'] as const)('%s clears the temporary snapshot', operation => {
    useStore.getState().activateDebugMode();
    if (operation === 'load') useStore.getState().loadState(structuredClone(defaultGameState));
    else useStore.getState().resetToDefault();
    expect(useStore.getState().debugMode).toBe(false);
    expect(isDebugSessionActive()).toBe(false);
    expect(useStore.getState().progress.divineLight).toBe(defaultGameState.progress.divineLight);
  });

  it('rejects activation during unfinished gameplay with an explicit message', () => {
    useStore.setState(state => ({ turn: { ...state.turn, phase: 'playing' } }));
    useStore.getState().activateDebugMode();
    expect(isDebugSessionActive()).toBe(false);
    expect(useStore.getState().toasts?.at(-1)?.message).toContain('finish active gameplay');
  });
});

describe('key Debug shortcut', () => {
  let uninstall: () => void;
  const activate = vi.fn();
  beforeEach(() => {
    activate.mockClear();
    uninstall = installDebugShortcut(activate);
  });
  afterEach(() => {
    uninstall();
    document.body.replaceChildren();
    vi.useRealTimers();
  });
  function type(text: string, target: EventTarget = window, options: KeyboardEventInit = {}) {
    for (const key of text) target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }));
  }

  it('recognizes uppercase and lowercase sequences without firing twice', () => {
    type('KEY');
    expect(activate).toHaveBeenCalledTimes(1);
    type('x');
    expect(activate).toHaveBeenCalledTimes(1);
    type('key');
    expect(activate).toHaveBeenCalledTimes(2);
  });

  it.each(['input', 'textarea', 'select', 'div'])('ignores %s editing and clears partial matches', tag => {
    const target = document.createElement(tag);
    if (tag === 'div') target.setAttribute('contenteditable', 'true');
    document.body.append(target);
    type('k');
    type('key', target);
    type('ey');
    expect(activate).not.toHaveBeenCalled();
  });

  it.each([{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { repeat: true }])('ignores modified/repeated keys %j', options => {
    type('key', window, options);
    expect(activate).not.toHaveBeenCalled();
  });

  it('expires a partial sequence after two seconds', () => {
    vi.useFakeTimers();
    type('k');
    vi.advanceTimersByTime(2_001);
    type('ey');
    expect(activate).not.toHaveBeenCalled();
  });

  it('consumes the final key before ordinary menu shortcuts', () => {
    type('ke');
    const event = new KeyboardEvent('keydown', { key: 'y', code: 'KeyY', bubbles: true, cancelable: true });
    window.dispatchEvent(event);
    expect(activate).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });
});
