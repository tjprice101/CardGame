import { CardRegistry } from '@/cards/CardRegistry';
import type { CardDefinition } from '@/types/cards';

// Re-export for backwards compat with ScoreSystem.getDefinition
export { CardRegistry };

// Seal the registry hook into ScoreSystem at module load time
import { ScoreSystem } from '@/systems/scoring/ScoreSystem';
ScoreSystem.getDefinition = (id: string): CardDefinition | undefined => CardRegistry.get(id);
