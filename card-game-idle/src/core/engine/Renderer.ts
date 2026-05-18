import { Application } from 'pixi.js';
import { LayerManager } from '@/rendering/layers/LayerManager';

export class Renderer {
  readonly app: Application;
  readonly layers: LayerManager;

  private constructor(app: Application, layers: LayerManager) {
    this.app = app;
    this.layers = layers;
  }

  static async create(canvas: HTMLCanvasElement): Promise<Renderer> {
    const app = new Application();
    await app.init({
      canvas,
      resizeTo: canvas.parentElement ?? canvas,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 1.5),
      autoDensity: true,
      powerPreference: 'high-performance',
    });

    const layers = new LayerManager(app.stage);
    return new Renderer(app, layers);
  }

  get width(): number { return this.app.screen.width; }
  get height(): number { return this.app.screen.height; }

  destroy(): void {
    this.app.destroy(false, { children: true });
  }
}
