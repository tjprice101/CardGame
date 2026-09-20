export type GardenRewardCurrency = 'nullifiedLattice' | 'nullSearedLight' | 'nullifiedOblivionMatter'
  | 'seedOfCausality' | 'causalBloom' | 'shatteredCausalTranscript' | 'heartOfCausality';

export interface GardenEncounterDefinition {
  readonly id: string;
  readonly name: string;
  readonly maxHp: number;
  readonly reward?: {
    readonly currency: GardenRewardCurrency;
    readonly artAssetKey: string;
  };
}

export interface GardenDungeonDefinition {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly coverArt: string;
  readonly encounters: readonly GardenEncounterDefinition[];
  readonly available: boolean;
  readonly category: 'Neutrality' | 'Causality';
}

export interface GardenDungeonState {
  phase: 'idle' | 'active' | 'victory' | 'defeat' | 'complete';
  dungeonId: string | null;
  encounterIndex: number;
  encounterHp: number;
  encounterMaxHp: number;
  timeRemainingSeconds: number;
  runCount: number;
  lastReward: GardenRewardCurrency | null;
  lastRewards?: Partial<Record<GardenRewardCurrency, number>>;
}
