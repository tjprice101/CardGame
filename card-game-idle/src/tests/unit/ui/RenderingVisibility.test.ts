import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameEngine } from '@/core/engine/GameEngine';
const { start, stop, save, destroy } = vi.hoisted(() => ({
  start: vi.fn(), stop: vi.fn(), save: vi.fn(), destroy: vi.fn(),
}));
vi.mock('@/core/engine/Renderer', () => ({
  Renderer: { create: vi.fn(async () => ({ app: { start, stop }, destroy })) },
}));
vi.mock('@/save/SaveManager', () => ({
  SaveManager: class {
    loadWithStatus = () => null;
    startAutoSave = vi.fn();
    stopAutoSave = vi.fn();
    save = save;
  },
}));
afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); });

describe('covered canvas rendering', () => {
  it('honors inactive state before async init and resumes/stops graphics without pausing gameplay or saves', async () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    const engine = new GameEngine();
    engine.setRenderingActive(false);
    await engine.init(document.createElement('canvas'));
    try {
      expect(stop).toHaveBeenCalledTimes(1);
      expect(start).not.toHaveBeenCalled();
      engine.setRenderingActive(true);
      expect(start).toHaveBeenCalledTimes(1);
      engine.setRenderingActive(false);
      expect(stop).toHaveBeenCalledTimes(2);
      engine.saveNow();
      expect(save).toHaveBeenCalledTimes(1);
    } finally { engine.destroy(); }
  });

  it('stops a visible arena in a hidden tab and does not restart a covered arena when the tab returns', async () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    const engine = new GameEngine();
    await engine.init(document.createElement('canvas'));
    try {
      expect(start).toHaveBeenCalledTimes(1);
      visibility.mockReturnValue('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
      expect(stop).toHaveBeenCalledTimes(1);
      expect(save).toHaveBeenCalledTimes(1);
      engine.setRenderingActive(false);
      visibility.mockReturnValue('visible');
      document.dispatchEvent(new Event('visibilitychange'));
      expect(start).toHaveBeenCalledTimes(1);
      engine.setRenderingActive(true);
      expect(start).toHaveBeenCalledTimes(2);
    } finally { engine.destroy(); }
  });

  it('does not spin an empty board-effect RAF loop', async () => {
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame');
    const engine = new GameEngine();
    await engine.init(document.createElement('canvas'));
    try { expect(requestFrame).not.toHaveBeenCalled(); }
    finally { engine.destroy(); }
  });
});
