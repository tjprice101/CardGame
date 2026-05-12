import { Container, Graphics } from 'pixi.js';
import { GodRaysFilter } from '@/rendering/filters/GodRaysFilter';
import { HaloFilter } from '@/rendering/filters/HaloFilter';
import { useStore } from '@/state/store';
import type { LayerManager } from '@/rendering/layers/LayerManager';

const SLOT_OFFSETS: readonly [number, number][] = [[-210, 15], [210, 15], [0, -185]];
const HALO_SIZE = 220;

export class BoardEffectsRenderer {
  private readonly godRaysFilter: GodRaysFilter;
  private readonly haloFilters: [HaloFilter, HaloFilter, HaloFilter];
  private readonly haloContainers: [Container, Container, Container];
  private elapsed = 0;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(layers: LayerManager, canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // ── God rays background ──────────────────────────────────────────────────
    this.godRaysFilter = new GodRaysFilter();
    (this.godRaysFilter as unknown as { blendMode: string }).blendMode = 'add';

    const bgContainer = new Container();
    const bgRect = new Graphics();
    bgRect.rect(0, 0, Math.max(canvasWidth, 1920), Math.max(canvasHeight, 1080));
    bgRect.fill({ color: 0x000000, alpha: 0 });
    bgContainer.addChild(bgRect);
    bgContainer.filters = [this.godRaysFilter];
    layers.get('background').addChild(bgContainer);

    // ── Halo rings at each seraphim slot position ────────────────────────────
    this.haloFilters = [new HaloFilter(), new HaloFilter(), new HaloFilter()];
    this.haloContainers = [new Container(), new Container(), new Container()] as [Container, Container, Container];

    SLOT_OFFSETS.forEach((_, i) => {
      const filter = this.haloFilters[i];
      (filter as unknown as { blendMode: string }).blendMode = 'add';

      const rect = new Graphics();
      rect.rect(-HALO_SIZE / 2, -HALO_SIZE / 2, HALO_SIZE, HALO_SIZE);
      rect.fill({ color: 0x000000, alpha: 0 });

      this.haloContainers[i].addChild(rect);
      this.haloContainers[i].filters = [filter];
      this.haloContainers[i].alpha = 0;
      layers.get('effects').addChild(this.haloContainers[i]);
    });
  }

  positionForBoard(centerX: number, centerY: number): void {
    // God rays center in UV [0,1] space
    this.godRaysFilter.setCenter(
      centerX / this.canvasWidth,
      centerY / this.canvasHeight
    );

    // Halo containers in pixel space
    SLOT_OFFSETS.forEach(([dx, dy], i) => {
      this.haloContainers[i].position.set(centerX + dx, centerY + dy);
    });
  }

  update(deltaMs: number): void {
    this.elapsed += deltaMs / 1000;
    this.godRaysFilter.time = this.elapsed;

    const { board } = useStore.getState();
    const angelSlot = board.frontSlots.find(s => s?.type === 'Angel');
    const isNeutrality = angelSlot?.element === 'Neutrality';

    // Update god rays color to match angel element
    if (isNeutrality) {
      this.godRaysFilter.setRayColor(0.7, 0.75, 1.0);
    } else {
      this.godRaysFilter.setRayColor(1.0, 0.84, 0.0);
    }
    this.godRaysFilter.intensity = angelSlot ? 0.22 : 0;

    // Get up to 3 seraphim slots for the halo containers
    const seraphims = board.frontSlots.filter(s => s?.type === 'Seraphim').slice(0, 3);
    for (let i = 0; i < 3; i++) {
      const halo = this.haloFilters[i];
      const container = this.haloContainers[i];
      halo.time = this.elapsed;

      const slot = seraphims[i];
      if (slot?.type === 'Seraphim' && slot.isActive) {
        halo.setGlowColor(1.0, 0.85, 0.2);
      } else {
        halo.setGlowColor(0.6, 0.6, 0.7);
      }

      const target = slot ? (slot.type === 'Seraphim' && slot.isActive ? 0.55 : 0.15) : 0;
      container.alpha += (target - container.alpha) * 0.06;
    }
  }
}
