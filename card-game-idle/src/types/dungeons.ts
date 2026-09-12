export type GardenRewardCurrency = 'nullifiedLattice' | 'nullSearedLight' | 'nullifiedOblivionMatter';

export interface GardenEncounterDefinition {
  readonly id: string;
  readonly name: string;
  readonly maxHp: number;
  readonly reward?: {
    readonly currency: GardenRewardCurrency;
    readonly chance: number;
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
}
