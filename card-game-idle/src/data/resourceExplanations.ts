/**
 * resourceExplanations.ts
 *
 * Single source of truth for per-resource human-readable descriptions.
 * Consumed by TutorialModal and any in-game tooltip that explains a resource.
 *
 * Each entry has:
 *  - key:             unique identifier (matches effect resource names where possible)
 *  - name:            display label
 *  - setName:         owning set display name
 *  - setElement:      Element string used in card definitions
 *  - shortDesc:       one-line tooltip description
 *  - longDesc:        paragraph-length explanation for the tutorial
 *  - mechanics:       bullet-point mechanic notes
 */

export interface ResourceInfo {
  key: string;
  name: string;
  setName: string;
  setId: string;
  shortDesc: string;
  longDesc: string;
  mechanics: string[];
}

export const RESOURCE_INFO: ResourceInfo[] = [
  {
    key: 'patience',
    name: 'Patience',
    setName: 'Neutrality',
    setId: 'Neutrality',
    shortDesc: 'Accumulates per card played; cashed out on Seraphim and Angel attacks.',
    longDesc:
      'Patience is Neutrality\'s core combat resource. While at least one Seraphim or Angel is on the board, each card you play adds +1 Patience to every Seraphim. Cherubim with a patience passive add extra stacks on top of the base +1.',
    mechanics: [
      'Each card played → +1 Patience per active Seraphim (and any adjacent-Cherubim bonus on top).',
      'On attack, each Patience stack → +15 Oblivion consumed.',
      'If Patience ≥ patienceThreshold on attack, you also draw bonus cards.',
      'Stacks reset to zero after the attack fires.',
    ],
  },
];
// Non-Neutrality resource entries removed — only Neutrality is implemented.

/** O(1) lookup by key. */
export const RESOURCE_BY_KEY: Map<string, ResourceInfo> = new Map(
  RESOURCE_INFO.map(r => [r.key, r]),
);
/** All resources for a specific set. */
export function resourcesForSet(setId: string): ResourceInfo[] {
  return RESOURCE_INFO.filter(r => r.setId === setId);
}
