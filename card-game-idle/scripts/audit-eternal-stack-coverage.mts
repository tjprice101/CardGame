// Audit which reworked cards have the primary eternal_stack_* mechanic
import { eternalCards } from '../src/data/cards/eternalCards.ts';
import { infiniteCards } from '../src/data/cards/infiniteCards.ts';

const setPrefixes: Record<string, RegExp> = {
  Pyroabyss: /^(btei-pyroabyss-|inf-(ash-kings|pyraxis|pyroclasm|riftborn))/,
  Light:     /^(btei-light-|inf-(celestial-blackout|lucent|heliarch))/,
  Thorn:     /^(btei-thorn|inf-(thornbound|thorn-widow|gravebloom))/,
  Mech:      /^(btei-mech-|inf-(machina|brass-eidolon|mech-entropy))/,
  Prism:     /^(btei-prismatic-|inf-prismatic-)/,
  BlackGlass:/^(btei-bgi-|inf-bgi-)/,
};

function flatten(card: any): any[] {
  const out: any[] = [];
  const push = (a: any) => Array.isArray(a) && out.push(...a);
  push(card.effects); push(card.onPlayEffects); push(card.onSummonEffects);
  if (card.activatedAbility?.effects) push(card.activatedAbility.effects);
  // walk nested conditional.then
  const walk = (effs: any[]) => {
    for (const e of effs) {
      if (e?.type === 'conditional' && Array.isArray(e.then)) { out.push(...e.then); walk(e.then); }
    }
  };
  walk(out.slice());
  return out;
}

const ALL = [...eternalCards, ...infiniteCards] as any[];
for (const [setName, re] of Object.entries(setPrefixes)) {
  console.log(`\n=== ${setName} ===`);
  const cards = ALL.filter(c => re.test(c.definitionId));
  for (const c of cards) {
    const flat = flatten(c);
    const hasStack = flat.some(e => typeof e?.type === 'string' && e.type.startsWith('eternal_stack_'));
    console.log(`${hasStack ? '✓' : '✗'} ${c.definitionId} (${c.type})`);
  }
}
