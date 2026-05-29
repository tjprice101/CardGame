import { TRIAL_DECK_DEFINITIONS } from '../src/data/trialDecks';
import { CardRegistry } from '../src/cards/CardRegistry';
import '../src/cards/RegistryBoot';

for (const t of Object.values(TRIAL_DECK_DEFINITIONS)) {
  const last = t.guideSteps[t.guideSteps.length - 1];
  const def = CardRegistry.get(last.cardDefinitionId) as { type?: string; name?: string } | undefined;
  const hint = last.hint.replace(/\s+/g, ' ');
  const attackCue = /click|attack|activate/i.test(hint) ? 'attack-cue' : 'no-attack-cue';
  console.log(`${t.packId.padEnd(26)} last=${last.cardDefinitionId.padEnd(36)} type=${(def?.type ?? '?').padEnd(8)} ${attackCue} :: ${hint.slice(0, 140)}`);
}
