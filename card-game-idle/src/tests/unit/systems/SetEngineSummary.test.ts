import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { defaultGameState } from '@/state/store';
import { getSetEngineSnapshotForCard, getSetEngineSnapshotsForCards } from '@/ui/setEngineSummary';

describe('set engine summary', () => {
  it('surfaces the Neutrality engine for Neutrality cards', () => {
    const def = CardRegistry.get('ser-neutral-null');
    expect(def).toBeTruthy();

    const turn = {
      ...defaultGameState.turn,
      equilibriumDrift: 7,
      equilibriumStability: 4,
      neutralitySetupCount: 2,
      attenuationClassUses: { setup: 1, conversion: 2, multiplier: 0, refund: 0, finisher: 0 },
      attenuationBreaksUsed: 1,
      attenuationBrokenClasses: ['setup'],
      crossSetConversionDistinctSources: ['Fire'],
      neutralityEngineSignatures: ['setup', 'conversion'],
    };

    const snapshot = getSetEngineSnapshotForCard(def!, turn);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.label).toBe('Neutrality');
    expect(snapshot?.compact).toContain('Patience');
    expect(snapshot?.metrics.some(metric => metric.label === 'Patience Charged')).toBe(true);
    expect(snapshot?.metrics.some(metric => metric.label === 'Patience Consumed')).toBe(true);

    const list = getSetEngineSnapshotsForCards([def!], turn);
    expect(list).toHaveLength(1);
    expect(list[0]?.label).toBe('Neutrality');
  });

  it('can return the full engine catalog for mixed-set tabs', () => {
    const neutrality = CardRegistry.get('ser-neutral-null');
    const pyro = CardRegistry.getAll().find(card => card.element === 'Fire');
    expect(neutrality).toBeTruthy();
    expect(pyro).toBeTruthy();

    const list = getSetEngineSnapshotsForCards([neutrality!, pyro!], defaultGameState.turn, undefined, { includeAll: true });
    expect(list).toHaveLength(12);
    expect(list[0]?.label).toBe('Neutrality');
    expect(list.some(snapshot => snapshot.label === 'Pyroabyss')).toBe(true);
    expect(list.some(snapshot => snapshot.label === 'Glass Absolute')).toBe(true);
    expect(list.some(snapshot => snapshot.label === 'Age of the Butterfly')).toBe(true);
    expect(list.some(snapshot => snapshot.label === 'Eternal Seas')).toBe(true);
  });
});