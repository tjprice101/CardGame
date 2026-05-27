import type { BoardState, ComputedBoardStats } from '@/types/game';
import type { AngelInstance, CherubimInstance, SeraphimInstance } from '@/types/cards';

export class ScoreSystem {
  static compute(board: BoardState): ComputedBoardStats {
    // Sum global oblivion multiplier from back-slot Cherubim (independent of active Seraphim count).
    let globalOblivionMult = 0;
    for (const slot of board.backSlots) {
      if (!slot) continue;
      const cherDef = ScoreSystem.getDefinition(slot.definitionId);
      if (!cherDef || cherDef.type !== 'Cherubim') continue;
      for (const eff of cherDef.effects) {
        if (eff.type === 'cherubim_global_oblivion_mult') {
          globalOblivionMult += eff.value;
        }
      }
    }

    const activeSeraphims = board.frontSlots.filter(
      (s): s is SeraphimInstance => s?.type === 'Seraphim' && s.isActive
    );

    const activeSynergies = activeSeraphims.length;
    const fullBoardActive =
      board.frontSlots.every(s => s !== null) &&
      board.backSlots.every(s => s !== null);

    if (activeSynergies === 0) {
      return { activeSynergies: 0, oblivionPerCardBonus: 0, ophanimOblivionBonus: 0, cherubimExtraPlays: 0, embersPerCardBonus: 0, globalOblivionMult, fullBoardActive };
    }

    let oblivionPerCardBonus = 0;
    let ophanimOblivionBonus = 0;
    let cherubimExtraPlays = 0;
    let embersPerCardBonus = 0;
    const prismaticChordBonus = computePrismaticChordBonus(board);

    for (const s of activeSeraphims) {
      const def = ScoreSystem.getDefinition(s.definitionId);
      if (!def || def.type !== 'Seraphim') continue;
      const { bonusType, bonusValue } = def.baseStats;
      const burnMultiplier = def.element === 'BlazingGarden' && s.burningGardenPhase === 'Burn'
        ? 1.45 + Math.min(0.75, (s.chromaticCounters ?? 0) * 0.12)
        : 1;
      switch (bonusType) {
        case 'oblivion_per_card':   oblivionPerCardBonus += bonusValue * burnMultiplier; break;
        case 'ophanim_bonus':        ophanimOblivionBonus  += bonusValue * burnMultiplier; break;
        case 'cherubim_extra_plays':   cherubimExtraPlays      += Math.round(bonusValue * burnMultiplier); break;
        case 'ember_per_card':      embersPerCardBonus   += bonusValue * burnMultiplier; break;
        // chain_bonus, cherubim_expire_bonus are handled at play-time
        // legacy Light types (power_amplifier, tick_acceleration, etc.) are no-ops until Light rework
      }
    }

    // Also sum oblivion_per_card and oblivion_per_seraphim from Angels on frontSlots
    const angels = board.frontSlots.filter((s): s is AngelInstance => s?.type === 'Angel');
    for (const a of angels) {
      const def = ScoreSystem.getDefinition(a.definitionId);
      if (!def || def.type !== 'Angel') continue;
      const burnMultiplier = def.element === 'BlazingGarden' && a.burningGardenPhase === 'Burn'
        ? 1.45 + Math.min(0.75, (a.chromaticCounters ?? 0) * 0.12)
        : 1;
      if (def.baseStats.bonusType === 'oblivion_per_card') {
        oblivionPerCardBonus += def.baseStats.bonusValue * burnMultiplier;
      } else if (def.baseStats.bonusType === 'oblivion_per_seraphim') {
        // Each active Seraphim contributes bonusValue additional Oblivion per card
        oblivionPerCardBonus += def.baseStats.bonusValue * activeSynergies * burnMultiplier;
      }
    }

    oblivionPerCardBonus += prismaticChordBonus;

    return { activeSynergies, oblivionPerCardBonus, ophanimOblivionBonus, cherubimExtraPlays, embersPerCardBonus, globalOblivionMult, fullBoardActive };
  }

  static getDefinition: (id: string) => import('@/types/cards').CardDefinition | undefined =
    () => undefined;
}

type PrismaticBoardCard = (SeraphimInstance | AngelInstance | CherubimInstance) & { spectrumTokens?: number; prismaticDepth?: number };

function computePrismaticChordBonus(board: BoardState): number {
  const nodes = new Map<string, PrismaticBoardCard>();

  board.frontSlots.forEach((slot, index) => {
    if (slot && (slot.prismaticDepth ?? 0) > 0 && (slot.spectrumTokens ?? 0) > 0) {
      nodes.set(`front:${index}`, slot);
    }
  });

  board.backSlots.forEach((slot, index) => {
    if (slot && (slot.prismaticDepth ?? 0) > 0 && (slot.spectrumTokens ?? 0) > 0) {
      nodes.set(`back:${index}`, slot);
    }
  });

  if (nodes.size < 3) return 0;

  const visited = new Set<string>();
  let bonus = 0;

  for (const key of nodes.keys()) {
    if (visited.has(key)) continue;

    const stack = [key];
    let componentSize = 0;

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      componentSize += 1;

      for (const neighbor of getPrismaticNeighbors(current)) {
        if (nodes.has(neighbor) && !visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }

    if (componentSize >= 3) {
      bonus += 10 + (componentSize - 3) * 5;
    }
  }

  return bonus;
}

function getPrismaticNeighbors(key: string): string[] {
  const [row, rawIndex] = key.split(':');
  const index = Number(rawIndex);

  if (row === 'front') {
    const neighbors: string[] = [];
    if (index > 0) neighbors.push(`front:${index - 1}`);
    if (index < 4) neighbors.push(`front:${index + 1}`);
    if (index > 0) neighbors.push(`back:${index - 1}`);
    if (index < 4) neighbors.push(`back:${index}`);
    return neighbors;
  }

  const neighbors: string[] = [];
  if (index > 0) neighbors.push(`back:${index - 1}`);
  if (index < 3) neighbors.push(`back:${index + 1}`);
  neighbors.push(`front:${index}`);
  if (index < 4) neighbors.push(`front:${index + 1}`);
  return neighbors;
}
