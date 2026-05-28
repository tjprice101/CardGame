import { CardRegistry } from '../src/cards/CardRegistry';
import '../src/cards/RegistryBoot';
import { TRIAL_DECK_DEFINITIONS } from '../src/data/trialDecks';

const target = process.argv[2];
if (!target) { console.log('usage: tsx probe-trial-resources.mts <packId>'); process.exit(1); }
const trial = TRIAL_DECK_DEFINITIONS[target] ?? Object.values(TRIAL_DECK_DEFINITIONS).find(t => t.packId === target);
if (!trial) { console.log('trial not found'); process.exit(1); }

console.log(`Trial: ${trial.displayName}`);
console.log(`\nGuide steps + their resource effects:`);
for (let i = 0; i < trial.guideSteps.length; i++) {
  const s = trial.guideSteps[i];
  const def: any = CardRegistry.get(s.cardDefinitionId);
  if (!def) { console.log(`  ${i+1}. ${s.cardDefinitionId} MISSING`); continue; }
  const fx = [...(def.effects ?? []), ...(def.onPlayEffects ?? [])];
  const res: string[] = [];
  for (const e of fx) {
    const m = e.type.match(/^(\w+?)_(gain|spend)$/);
    if (m && typeof e.value === 'number') res.push(`${m[2]==='gain'?'+':'-'}${e.value}${m[1]}`);
    if (e.type === 'conditional' && e.then) for (const ie of e.then) {
      const im = ie.type?.match(/^(\w+?)_(gain|spend)$/);
      if (im && typeof ie.value === 'number') res.push(`if(${e.condition?.type}):${im[2]==='gain'?'+':'-'}${ie.value}${im[1]}`);
    }
  }
  console.log(`  ${i+1}. ${def.name.padEnd(28)} [${def.type}] ${res.join(' ')}`);
}

console.log(`\nAll Seraphim in deckList + their attacks:`);
const seraphimIds = new Set<string>();
for (const e of trial.deckList) {
  const d: any = CardRegistry.get(e.definitionId);
  if (d?.type === 'Seraphim') seraphimIds.add(e.definitionId);
}
for (const sid of seraphimIds) {
  const d: any = CardRegistry.get(sid);
  const atks = Array.isArray(d.attacks) ? d.attacks : Object.values(d.attacks ?? {});
  for (const a of atks as any[]) {
    const costs = (a.costs ?? []).map((c: any) => `${c.type}=${c.value}`).join(',') || 'free';
    const angel = a.requiresAngelOnBoard ? ' [needs angel]' : '';
    console.log(`  ${sid.padEnd(35)} ${a.label}: base=${a.baseOblivion} cost=${costs}${angel}`);
  }
}

console.log(`\nAll resource-gain Ophanim/Cherubim in deckList:`);
const others: { id: string; name: string; type: string; gains: string }[] = [];
for (const e of trial.deckList) {
  const d: any = CardRegistry.get(e.definitionId);
  if (!d || d.type === 'Seraphim') continue;
  const fx = [...(d.effects ?? []), ...(d.onPlayEffects ?? [])];
  const res: string[] = [];
  for (const ee of fx) {
    const m = ee.type?.match(/^(\w+?)_(gain|spend)$/);
    if (m && typeof ee.value === 'number') res.push(`${m[2]==='gain'?'+':'-'}${ee.value}${m[1]}`);
    if (ee.type === 'conditional' && ee.then) for (const ie of ee.then) {
      const im = ie.type?.match(/^(\w+?)_(gain|spend)$/);
      if (im && typeof ie.value === 'number') res.push(`if:${im[2]==='gain'?'+':'-'}${ie.value}${im[1]}`);
    }
  }
  if (res.length > 0) others.push({ id: e.definitionId, name: d.name, type: d.type, gains: res.join(' ') });
}
others.sort((a, b) => a.gains.localeCompare(b.gains));
for (const o of others) console.log(`  ${o.id.padEnd(40)} [${o.type.padEnd(9)}] ${o.gains}`);
