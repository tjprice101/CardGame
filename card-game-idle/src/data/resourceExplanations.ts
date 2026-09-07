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
    name: 'Light Stack',
    setName: 'Neutrality',
    setId: 'Neutrality',
    shortDesc: 'Tracks the live Light-stack value for the current turn and board state.',
    longDesc:
      'The current runtime model stores Light stacks directly on the turn, then evaluates board support from the active Light, Dark, and Ain-Soph composition. This replaces the archived Neutrality patience drift bookkeeping.',
    mechanics: [
      'Turn-state Light stack count is the canonical resource value.',
      'Board support is derived from active Light / Dark / Ain-Soph units on the board.',
      'Infinite and high-tier full-fire scaling key off the live board state instead of obsolete drift fields.',
      'Legacy patience-leak fields are intentionally not persisted or reintroduced.',
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
