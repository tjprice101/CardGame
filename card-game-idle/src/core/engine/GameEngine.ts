import { Renderer } from '@/core/engine/Renderer';
import { SaveManager } from '@/save/SaveManager';
import { useStore } from '@/state/store';
import { eventBus } from '@/core/events/EventBus';
import { BoardEffectsRenderer } from '@/rendering/effects/BoardEffectsRenderer';
import type { GameState } from '@/types/game';

export class GameEngine {
  private renderer: Renderer | undefined;
  private boardEffects: BoardEffectsRenderer | undefined;
  private saveManager!: SaveManager;
  private rafId: number | null = null;
  private lastTimestamp = 0;

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.saveManager = new SaveManager(
      () => useStore.getState() as unknown as GameState
    );

    const saved = this.saveManager.load();
    if (saved) {
      useStore.getState().loadState(saved);
    }

    try {
      this.renderer = await Renderer.create(canvas);
      this.boardEffects = new BoardEffectsRenderer(
        this.renderer.layers,
        this.renderer.width,
        this.renderer.height,
      );
      this.boardEffects.positionForBoard(this.renderer.width / 2, this.renderer.height * 0.42);
    } catch (err) {
      console.warn('Renderer failed to initialize; running without graphics.', err);
    }
    this.saveManager.startAutoSave();
    this.startLoop();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    eventBus.emit('game:ready', {});
  }

  private startLoop(): void {
    this.lastTimestamp = performance.now();
    const loop = (timestamp: number) => {
      const deltaMs = Math.min(timestamp - this.lastTimestamp, 200);
      this.lastTimestamp = timestamp;
      this.boardEffects?.update(deltaMs);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.saveManager.save();
    } else {
      this.lastTimestamp = performance.now();
    }
  };

  saveNow(): void {
    this.saveManager.save();
  }

  wipeData(): void {
    this.saveManager.stopAutoSave();
    this.saveManager.wipe();
    useStore.getState().resetToDefault();
    this.saveManager.startAutoSave();
  }

  destroy(): void {
    this.stopLoop();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.saveManager.stopAutoSave();
    this.renderer?.destroy();
    eventBus.clear();
  }
}
