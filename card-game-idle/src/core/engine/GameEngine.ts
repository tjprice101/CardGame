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
      () => useStore.getState() as unknown as GameState,
      undefined,
      (savedAt) => {
        useStore.setState({ lastSavedAt: savedAt });
      },
    );

    const saved = this.saveManager.loadWithStatus();
    if (saved) {
      useStore.getState().loadState(saved.state);
      useStore.setState({ saveTampered: saved.tampered });
      if (saved.tampered) {
        console.warn('[SaveManager] On-disk save failed integrity check; flagged as tampered.');
      }
      if (saved.legacy) {
        // Re-save immediately to upgrade the on-disk envelope to the signed
        // format so future loads validate.
        this.saveManager.save();
      }
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
    this.registerVisualFeedbackListeners();
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

  private registerVisualFeedbackListeners(): void {
    // Utility: dispatch a radial color flash to the FlashOverlay component.
    const flash = (r: number, g: number, b: number, alpha: number, durationMs: number) => {
      window.dispatchEvent(new CustomEvent('hud-flash', { detail: { r, g, b, alpha, durationMs } }));
    };
    const shake = (hard: boolean) => {
      window.dispatchEvent(new Event(hard ? 'hud-shake-hard' : 'hud-shake-soft'));
    };

    // Angel summoned — brilliant warm-white/gold burst + hard shake
    eventBus.on('angel:summoned', () => {
      shake(true);
      flash(255, 235, 180, 0.88, 650);
    });

    // Angel attacked — ice-blue flash + soft shake
    eventBus.on('angel:attacked', () => {
      shake(false);
      flash(100, 220, 255, 0.72, 480);
    });

    // Seraphim attacked — stronger silver-blue flash + micro-shake (fires frequently, keep subtle)
    eventBus.on('seraphim:attacked', () => {
      window.dispatchEvent(new Event('hud-shake-micro'));
      flash(145, 210, 255, 0.60, 400);
    });

    // Seraphim synergy gained — violet bloom
    eventBus.on('seraphim:synergy-gained', () => {
      flash(200, 130, 255, 0.70, 500);
    });

    // Boss defeated (victory) — golden victory burst + hard shake
    // boss:damaged visual is already handled by BossFightArena (vignette + HP shake)
    eventBus.on('boss:defeated', ({ victory }) => {
      if (victory) {
        shake(true);
        flash(255, 215, 80, 0.92, 900);
      }
    });

    // Milestone reached — warm amber flash
    eventBus.on('milestone:reached', () => {
      flash(255, 175, 60, 0.68, 560);
    });
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
    useStore.setState({ saveTampered: false });
    this.saveManager.startAutoSave();
  }

  /** Returns the current save serialized as a portable text payload. */
  exportSave(): string | null {
    return this.saveManager.exportSave();
  }

  /**
   * Replaces the on-disk save with `text` if it is a valid Heavenly
   * Retribution export, reloads the state, and returns true. Returns false
   * if the payload is unrecognized or corrupt (state is left untouched).
   */
  importSave(text: string): boolean {
    const result = this.saveManager.importSave(text);
    if (!result) return false;
    useStore.getState().loadState(result.state);
    useStore.setState({ saveTampered: result.tampered });
    // Imported envelopes can carry very old lastSavedAt values. Re-save now so
    // cloud sync sees a fresh timestamp and propagates this imported state to
    // the account without requiring extra manual actions.
    this.saveManager.save();
    return true;
  }

  destroy(): void {
    this.stopLoop();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.saveManager.stopAutoSave();
    this.boardEffects?.destroy();
    this.renderer?.destroy();
    eventBus.clear();
  }
}
