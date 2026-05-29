import { describe, expect, it } from 'vitest';
import { CardRegistry } from '@/cards/CardRegistry';
import { defaultGameState } from '@/state/store';
import { SET_ENGINE_GUIDES, getSetEngineSnapshotForCard, getSetEngineSnapshotsForCards } from '@/ui/setEngineSummary';

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
    expect(list).toHaveLength(15);
    expect(list[0]?.label).toBe('Neutrality');
    expect(list.some(snapshot => snapshot.label === 'Pyroabyss')).toBe(true);
    expect(list.some(snapshot => snapshot.label === 'Glass Absolute')).toBe(true);
    expect(list.some(snapshot => snapshot.label === 'Age of the Butterfly')).toBe(true);
    expect(list.some(snapshot => snapshot.label === 'Eternal Seas')).toBe(true);
    expect(list.some(snapshot => snapshot.label === 'Abyssal Forge')).toBe(true);
    expect(list.some(snapshot => snapshot.label === 'Death-flamed Hell')).toBe(true);
    expect(list.some(snapshot => snapshot.label === 'Wished Upon a Star')).toBe(true);
  });

  it('documents Prismatic Resonance overlay consistently for Eternity and Infinite', () => {
    const prismaticInfinite = CardRegistry.get('inf-prismatic-axiom-rain');
    expect(prismaticInfinite).toBeTruthy();

    const turn = {
      ...defaultGameState.turn,
      prismaticCurrentChannel: 'amber' as const,
      prismaticDistinctChannels: ['amber', 'azure', 'crimson', 'emerald'],
      prismaticRefractionDepth: 5,
      prismaticNodeCharges: 2,
      prismaticResonanceCharge: 7,
    };

    const snapshot = getSetEngineSnapshotForCard(prismaticInfinite!, turn);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.summary).toContain('Resonance Charge');
    expect(snapshot?.summary).toContain('Eternity and Infinite');
    expect(snapshot?.summary).not.toContain('x1.22');

    const resonanceMetric = snapshot?.metrics.find(metric => metric.label === 'Resonance Charge');
    expect(resonanceMetric?.hint).toContain('Eternity and Infinite');

    const prismaticGuide = SET_ENGINE_GUIDES.prismatic;
    expect(prismaticGuide.sections.some(section => section.heading.includes('Resonance Overlay'))).toBe(true);
    expect(prismaticGuide.sections.some(section => section.heading.includes('Infinite Extension'))).toBe(true);
  });

  it('surfaces Butterfly Wing Resonance overlay metrics', () => {
    const butterflyEternal = CardRegistry.get('bf-et-nullwing-interstice');
    expect(butterflyEternal).toBeTruthy();

    const turn = {
      ...defaultGameState.turn,
      butterflySpectrum: 8,
      butterflyFormation: 3,
      butterflyFormationTypesSeen: ['Seraphim', 'Ophanim', 'Angel'],
      butterflyFlutterLevel: 2,
      eternalStacks: { ...(defaultGameState.turn.eternalStacks ?? {}), flutter: 4 },
    };

    const snapshot = getSetEngineSnapshotForCard(butterflyEternal!, turn);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.summary).toContain('Wing Resonance');
    expect(snapshot?.compact).toContain('Resonance 4');

    const resonanceMetric = snapshot?.metrics.find(metric => metric.label === 'Wing Resonance');
    expect(resonanceMetric?.value).toBe('4');
  });

  it('surfaces Abyssal Eternal Imprint overlay metrics', () => {
    const abyssalEternal = CardRegistry.get('af-et-forge-beneath');
    expect(abyssalEternal).toBeTruthy();

    const turn = {
      ...defaultGameState.turn,
      reforgeCharges: 3,
      reforgeChargeCap: 6,
      forgeRecastEventsThisTurn: 2,
      recastLedger: [
        {
          definitionId: 'af-ser-slagback-crawler',
          instanceId: 't1',
          ledgerIndex: 0,
          recastCount: 1,
          imprintStacks: 4,
          isAnvilSealed: false,
          isNacreCoated: false,
        },
      ],
    };

    const snapshot = getSetEngineSnapshotForCard(abyssalEternal!, turn);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.compact).toContain('Imprint 4');
    expect(snapshot?.summary).toContain('Imprint');

    const imprintMetric = snapshot?.metrics.find(metric => metric.label === 'Imprint');
    expect(imprintMetric?.value).toBe('4');
  });
});