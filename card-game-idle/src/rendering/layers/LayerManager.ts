import { Container } from 'pixi.js';

export type LayerName =
  | 'background'
  | 'board'
  | 'cards'
  | 'effects'
  | 'overlay'
  | 'ui';

const LAYER_ORDER: LayerName[] = ['background', 'board', 'cards', 'effects', 'overlay', 'ui'];

export class LayerManager {
  private layers = new Map<LayerName, Container>();

  constructor(stage: Container) {
    for (const name of LAYER_ORDER) {
      const container = new Container();
      container.label = name;
      stage.addChild(container);
      this.layers.set(name, container);
    }
  }

  get(name: LayerName): Container {
    return this.layers.get(name)!;
  }
}
