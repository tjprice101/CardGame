/**
 * Neutrality set abilities — gutted for the Ain/Soph rework (Patience is retired).
 * A future Neutrality-specific mechanic can replace this stub.
 */

import { type SetEngineDefinition, registerSet } from '@/systems/sets/SetEngine';
import { TRANSCENDENT_ANGEL_IDS } from '@/data/ascension/transcendentCards';

const NEUTRALITY_SET: SetEngineDefinition = {
  id: 'Neutrality',
  label: 'Neutrality',
  signatureMechanic: 'none',
  membership: {
    isMember: id => id.startsWith('neutral-'),
    isEternal: () => false,
    isInfinite: () => false,
    isTranscendentAngel: id => TRANSCENDENT_ANGEL_IDS.has(id),
  },
  abilities: [],
};

registerSet(NEUTRALITY_SET);

export { NEUTRALITY_SET };
