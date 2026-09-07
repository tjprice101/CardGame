import { CardRegistry } from '@/cards/CardRegistry';
import {
  SET_ENGINE_GUIDES,
  getEngineKeyForCard,
  type EngineKey,
  type GuideSection,
} from '@/ui/setEngineSummary';

export interface CoreMechanicContent {
  engineKey: EngineKey;
  title: string;
  intro: string;
  sections: GuideSection[];
  exampleCardIds: string[];
}

function pickEngineKey(packCardPool: string[]): EngineKey | null {
  for (const cardId of packCardPool) {
    const def = CardRegistry.get(cardId);
    if (!def) continue;
    const key = getEngineKeyForCard(def);
    if (key) return key;
  }

  return null;
}

function getExampleCardIds(packCardPool: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (id: string | undefined) => {
    if (!id) return;
    if (seen.has(id)) return;
    if (!CardRegistry.get(id)) return;
    seen.add(id);
    out.push(id);
  };

  const cardPoolDefs = packCardPool
    .map(id => CardRegistry.get(id))
    .filter((d): d is NonNullable<ReturnType<typeof CardRegistry.get>> => d !== undefined);

  const byType: Record<string, string | undefined> = {
    Light: cardPoolDefs.find(d => d.type === 'Light')?.definitionId,
    Dark: cardPoolDefs.find(d => d.type === 'Dark')?.definitionId,
    AinSophAur: cardPoolDefs.find(d => d.type === 'AinSophAur')?.definitionId,
  };

  push(byType.Light);
  push(byType.Dark);
  push(byType.AinSophAur);

  for (const d of cardPoolDefs) push(d.definitionId);

  return out.slice(0, 8);
}

export function buildCoreMechanicContent(packCardPool: string[]): CoreMechanicContent | null {
  const key = pickEngineKey(packCardPool);
  if (!key) return null;

  const guide = SET_ENGINE_GUIDES[key];
  if (!guide) return null;

  return {
    engineKey: key,
    title: guide.title,
    intro: guide.intro,
    sections: guide.sections,
    exampleCardIds: getExampleCardIds(packCardPool),
  };
}
