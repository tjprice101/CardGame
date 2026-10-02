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
    key: 'limitlessLightStacks',
    name: 'Limitless Light Stacks',
    setName: 'Shared',
    setId: 'Shared',
    shortDesc: 'A shared resource spent by card actions, Spectrum level-ups, and abilities.',
    longDesc:
      'Flipping a charged Soph card adds its stored charge to this turn-scoped pool. Card effects and Ain Soph Aur summons can also change it. The pool resets when the turn ends.',
    mechanics: [
      'Each card played adds charge to every face-down Soph card.',
      'At the required charge, flip a Soph card to Ain to add its stored charge to this pool, or sacrifice it to convert part of its charge into stacks.',
      'Soph attacks, Dark activations, Bridge attacks, Spectrum level-ups, and abilities may spend stacks; check each action for its cost.',
      'Limitless Light Stacks and Limitless Cosmos are separate resources and cannot be substituted for each other.',
    ],
  },
  {
    key: 'limitlessCosmosStacks',
    name: 'Limitless Cosmos',
    setName: 'Causality',
    setId: 'Causality',
    shortDesc: 'Causality resource generated, converted, and spent by Causality effects.',
    longDesc:
      'Causality cards and abilities generate Limitless Cosmos, convert Limitless Light Stacks into it, or spend it for effects. It is turn-scoped and resets at turn end.',
    mechanics: [
      'Card text defines each Cosmos generation, conversion, and spending rule.',
      'Causality Dark and Ain Soph Aur effects can spend Cosmos for card effects and ability payoffs.',
      'Cosmos is not a replacement for Limitless Light Stacks.',
    ],
  },
];

/** O(1) lookup by key. */
export const RESOURCE_BY_KEY: Map<string, ResourceInfo> = new Map(
  RESOURCE_INFO.map(r => [r.key, r]),
);
/** All resources for a specific set. */
export function resourcesForSet(setId: string): ResourceInfo[] {
  return RESOURCE_INFO.filter(r => r.setId === setId);
}
