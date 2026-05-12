import type { BoardState, ComputedBoardStats } from '@/types/game';
import type { AngelInstance, SeraphimInstance } from '@/types/cards';

export class ScoreSystem {
  static compute(board: BoardState): ComputedBoardStats {
    const activeSeraphims = board.frontSlots.filter(
      (s): s is SeraphimInstance => s?.type === 'Seraphim' && s.isActive
    );

    const activeSynergies = activeSeraphims.length;

    if (activeSynergies === 0) {
      return { activeSynergies: 0, oblivionPerCardBonus: 0, seekerOblivionBonus: 0, chaosExtraPlays: 0, embersPerCardBonus: 0 };
    }

    let oblivionPerCardBonus = 0;
    let seekerOblivionBonus = 0;
    let chaosExtraPlays = 0;
    let embersPerCardBonus = 0;

    for (const s of activeSeraphims) {
      const def = ScoreSystem.getDefinition(s.definitionId);
      if (!def || def.type !== 'Seraphim') continue;
      const { bonusType, bonusValue } = def.baseStats;
      switch (bonusType) {
        case 'oblivion_per_card':   oblivionPerCardBonus += bonusValue; break;
        case 'seeker_bonus':        seekerOblivionBonus  += bonusValue; break;
        case 'chaos_extra_plays':   chaosExtraPlays      += bonusValue; break;
        case 'ember_per_card':      embersPerCardBonus   += bonusValue; break;
        // chain_bonus, chaos_expire_bonus are handled at play-time
        // legacy Light types (power_amplifier, tick_acceleration, etc.) are no-ops until Light rework
      }
    }

    // Also sum oblivion_per_card from Angels on frontSlots
    const angels = board.frontSlots.filter((s): s is AngelInstance => s?.type === 'Angel');
    for (const a of angels) {
      const def = ScoreSystem.getDefinition(a.definitionId);
      if (!def || def.type !== 'Angel') continue;
      if (def.baseStats.bonusType === 'oblivion_per_card') {
        oblivionPerCardBonus += def.baseStats.bonusValue;
      }
    }

    return { activeSynergies, oblivionPerCardBonus, seekerOblivionBonus, chaosExtraPlays, embersPerCardBonus };
  }

  static getDefinition: (id: string) => import('@/types/cards').CardDefinition | undefined =
    () => undefined;
}
