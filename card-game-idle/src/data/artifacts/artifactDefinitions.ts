import type { ArtifactDefinition } from '@/types/artifacts';
import { ARTIFACT_TIER_COSTS } from '@/types/artifacts';

const T1 = ARTIFACT_TIER_COSTS.basic;
const T2 = ARTIFACT_TIER_COSTS.advanced;
const T3 = ARTIFACT_TIER_COSTS.apex;

export const ARTIFACT_DEFINITIONS: ArtifactDefinition[] = [

  // ── Neutrality ──────────────────────────────────────────────────────────────
  // All Neutrality artifacts are Patience-system-native.
  {
    id: 'artifact-neutrality-t1',
    setId: 'Neutrality',
    setName: 'Neutrality',
    tier: 'basic',
    name: 'Patience Accumulator',
    description: 'Each card played grants +1 Patience to Seraphim on the board, helping them reach their attack threshold sooner.',
    powderCost: T1,
    effects: [{ type: 'patience_gain_bonus', value: 1 }],
  },
  {
    id: 'artifact-neutrality-t2',
    setId: 'Neutrality',
    setName: 'Neutrality',
    tier: 'advanced',
    name: 'Patience Surge',
    description: 'When a Seraphim fires a Patience-powered attack, deal +150 bonus Oblivion. The release is worth the wait.',
    powderCost: T2,
    effects: [{ type: 'patience_attack_oblivion_bonus', value: 150 }],
  },
  {
    id: 'artifact-neutrality-t3',
    setId: 'Neutrality',
    setName: 'Neutrality',
    tier: 'apex',
    name: 'Patience Ascendant',
    description: 'Seraphim Patience threshold reduced by 2. They awaken sooner, and strike with full force.',
    powderCost: T3,
    effects: [{ type: 'patience_threshold_reduction', value: 2 }],
  },

];
/** Look up a single artifact definition by id. */
export function getArtifactById(id: string): ArtifactDefinition | undefined {
  return ARTIFACT_DEFINITIONS.find(a => a.id === id);
}

/** All artifacts for a given set. */
export function getArtifactsForSet(setId: string): ArtifactDefinition[] {
  return ARTIFACT_DEFINITIONS.filter(a => a.setId === setId);
}

/** All unique set element keys in display order (matches PACK_DEFINITIONS ordering). */
export const ARTIFACT_SET_ORDER: string[] = [
  'Neutrality',
];

/** Map element key → player-facing set name for the Artifacts menu sidebar. */
export const ARTIFACT_SET_NAMES: Record<string, string> = {
  Neutrality: 'Neutrality',
};

/** Map element key → accent color for UI theming. */
export const ARTIFACT_SET_COLORS: Record<string, string> = {
  Neutrality: '#a0a0c0',
};
