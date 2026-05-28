import { CardRegistry } from '../src/cards/CardRegistry';
import '../src/cards/RegistryBoot';
import { TRIAL_DECK_DEFINITIONS } from '../src/data/trialDecks';

const target = process.argv[2];
const trial = Object.values(TRIAL_DECK_DEFINITIONS).find(t => t.packId === target);
if (!trial) { console.log('not found'); process.exit(1); }

console.log(`Trial: ${trial.displayName}\nDraw + look + search cards in deckList:`);
for (const e of trial.deckList) {
  const d: any = CardRegistry.get(e.definitionId);
  if (!d) continue;
  const fx = [...(d.effects ?? []), ...(d.onPlayEffects ?? [])];
  const parts: string[] = [];
  for (const ee of fx) {
    if (ee.type === 'draw') parts.push(`draw${ee.value}`);
    else if (ee.type === 'top_deck_choice') parts.push(`top${ee.take ?? 1}`);
    else if (ee.type === 'look_top_take' || ee.type === 'look_top_take_drop') parts.push(`look${ee.look}take${ee.take}`);
    else if (ee.type === 'search_deck' || ee.type === 'search_deck_by_type') parts.push(`search:${(ee.filter ?? []).join('|')}`);
    else if (ee.type === 'discard_then_draw' || ee.type === 'discard_draw') parts.push(`disDraw:${JSON.stringify(ee)}`);
    else if (ee.type === 'draw_first_card_bonus') parts.push(`firstDraw${ee.value}`);
  }
  if (parts.length > 0) console.log(`  ${e.definitionId.padEnd(38)} ${d.name.padEnd(28)} ${parts.join(' ')}`);
}
