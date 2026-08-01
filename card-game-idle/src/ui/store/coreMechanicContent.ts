import { CardRegistry } from '@/cards/CardRegistry';
import { getTrialDeckDefinition } from '@/data/trialDecks';
import {
  SET_ENGINE_GUIDES,
  getEngineKeyForCard,
  type EngineKey,
  type GuideSection,
} from '@/ui/setEngineSummary';

export interface CoreMechanicPlaystyle {
  name: string;
  pattern: string;
  pilotTips: string;
  winCondition: string;
}

export interface CoreMechanicAdvancedLine {
  name: string;
  sequence: string;
  whyItWorks: string;
}

export interface CoreMechanicMistake {
  mistake: string;
  consequence: string;
  correction: string;
}

export interface CoreMechanicEffectExample {
  cardName: string;
  effectSummary: string;
}

export interface CoreMechanicContent {
  engineKey: EngineKey;
  title: string;
  intro: string;
  sections: GuideSection[];
  exampleCardIds: string[];
  playstyles: CoreMechanicPlaystyle[];
  advancedLines: CoreMechanicAdvancedLine[];
  commonMistakes: CoreMechanicMistake[];
  exampleEffects: CoreMechanicEffectExample[];
}

const PLAYSTYLE_MAP: Record<EngineKey, CoreMechanicPlaystyle[]> = {
  neutrality: [
    {
      name: 'Patience Ramp',
      pattern: 'Open with Seraphim + draw Ophanim loops, then delay attacks until 4-8 stacks are banked.',
      pilotTips: 'Do not fire early unless lethal or hand-starved. Every extra card played is hidden damage.',
      winCondition: 'One or two high-stack Seraphim attacks with threshold draws to bridge into the next burst.',
    },
    {
      name: 'Angel Doubled Patience',
      pattern: 'Build medium stacks first, then summon Angel and double to force a compressed finisher turn.',
      pilotTips: 'Hold doubling effects for the turn where attacks are ready or nearly ready.',
      winCondition: 'Explosive double-stack conversion plus bonus draw refill for follow-up pressure.',
    },
  ],
};

const ADVANCED_LINES_MAP: Record<EngineKey, CoreMechanicAdvancedLine[]> = {
  neutrality: [
    {
      name: 'Double-Threshold Window',
      sequence: 'Set two Seraphim just below threshold, then fire one draw-heavy Ophanim sequence to cross both before attacks.',
      whyItWorks: 'You convert one setup burst into two threshold draw payouts and keep hand velocity high.',
    },
  ],
};

const COMMON_MISTAKES_MAP: Record<EngineKey, CoreMechanicMistake[]> = {
  neutrality: [
    { mistake: 'Attacking too early', consequence: 'Low stack conversion and missed threshold draws.', correction: 'Delay attacks until meaningful stack and threshold values are reached.' },
  ],
};

function pickEngineKey(packId: string, packCardPool: string[]): EngineKey | null {
  const trial = getTrialDeckDefinition(packId);
  if (trial) {
    for (const step of trial.guideSteps) {
      const def = CardRegistry.get(step.cardDefinitionId);
      if (!def) continue;
      const key = getEngineKeyForCard(def);
      if (key) return key;
    }
  }

  for (const cardId of packCardPool) {
    const def = CardRegistry.get(cardId);
    if (!def) continue;
    const key = getEngineKeyForCard(def);
    if (key) return key;
  }

  return null;
}

function getExampleCardIds(packId: string, packCardPool: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (id: string | undefined) => {
    if (!id) return;
    if (seen.has(id)) return;
    if (!CardRegistry.get(id)) return;
    seen.add(id);
    out.push(id);
  };

  const trial = getTrialDeckDefinition(packId);
  if (trial) {
    for (const step of trial.guideSteps) push(step.cardDefinitionId);
  }

  const cardPoolDefs = packCardPool
    .map(id => CardRegistry.get(id))
    .filter((d): d is NonNullable<ReturnType<typeof CardRegistry.get>> => d !== undefined);

  const byType: Record<string, string | undefined> = {
    Ophanim: cardPoolDefs.find(d => d.type === 'Ophanim')?.definitionId,
    Cherubim: cardPoolDefs.find(d => d.type === 'Cherubim')?.definitionId,
    Seraphim: cardPoolDefs.find(d => d.type === 'Seraphim')?.definitionId,
    Angel: cardPoolDefs.find(d => d.type === 'Angel')?.definitionId,
  };

  push(byType.Ophanim);
  push(byType.Cherubim);
  push(byType.Seraphim);
  push(byType.Angel);

  for (const d of cardPoolDefs) push(d.definitionId);

  return out.slice(0, 8);
}

function getExampleEffects(packId: string): CoreMechanicEffectExample[] {
  const trial = getTrialDeckDefinition(packId);
  if (!trial) return [];

  return trial.guideSteps.slice(0, 6).map(step => {
    const def = CardRegistry.get(step.cardDefinitionId);
    return {
      cardName: def?.name ?? step.cardDefinitionId,
      effectSummary: step.hint,
    };
  });
}

export function buildCoreMechanicContent(packId: string, packCardPool: string[]): CoreMechanicContent | null {
  const key = pickEngineKey(packId, packCardPool);
  if (!key) return null;

  const guide = SET_ENGINE_GUIDES[key];
  if (!guide) return null;

  return {
    engineKey: key,
    title: guide.title,
    intro: guide.intro,
    sections: guide.sections,
    exampleCardIds: getExampleCardIds(packId, packCardPool),
    playstyles: PLAYSTYLE_MAP[key],
    advancedLines: ADVANCED_LINES_MAP[key],
    commonMistakes: COMMON_MISTAKES_MAP[key],
    exampleEffects: getExampleEffects(packId),
  };
}
